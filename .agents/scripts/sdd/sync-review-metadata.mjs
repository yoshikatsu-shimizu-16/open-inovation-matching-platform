import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const API_VERSION = "2022-11-28";

/**
 * GitHub Mergeをレビュー証跡として同期する対象ファイルか判定する。
 *
 * @param {string} filePath リポジトリ相対パス。
 * @returns {boolean} Review metadataを持つSDD成果物ならtrue。
 */
export function isReviewablePath(filePath) {
  return (
    filePath === "docs/project-requirements.md" ||
    filePath === "docs/constitution.md" ||
    /^docs\/specs\/[^/]+\/(?:requirements|design|tasks)\.md$/.test(filePath)
  );
}

/**
 * starterの未具体化テンプレートを人間承認済み成果物として同期しないための判定。
 *
 * @param {string} content Markdown本文。
 * @returns {boolean} 実プロジェクトのレビュー対象として同期可能ならtrue。
 */
export function isReviewableContent(content) {
  return !content.includes("**singleton / template**");
}

/**
 * 現在のdefault branch上の成果物が、対象PRをMergeした時点の内容と一致することを確認する。
 * Merge後に同じ成果物へ別変更が入っていれば、古いPRの証跡を新しい内容へ付与してはならない。
 *
 * @param {string} currentContent 現在のdefault branch上の本文。
 * @param {string} mergedContent 対象PRのmerge commit上の本文。
 * @param {string} filePath リポジトリ相対パス。
 */
export function assertMergedRevisionMatchesCurrent(currentContent, mergedContent, filePath) {
  if (currentContent !== mergedContent) {
    throw new Error(
      `${filePath} changed after the reviewed PR was merged; refusing to attach stale review evidence`,
    );
  }
}

/**
 * 指定revision時点のファイル本文をlocal git object databaseから読む。
 * workflowはfetch-depth: 0でcheckoutするため、merge commitも参照可能である。
 *
 * @param {string} revision commit SHA。
 * @param {string} filePath リポジトリ相対パス。
 * @returns {string} revision時点の本文。
 */
function readFileAtRevision(revision, filePath) {
  try {
    return execFileSync("git", ["show", `${revision}:${filePath}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = error?.stderr?.toString?.().trim();
    throw new Error(
      `cannot read ${filePath} at merged revision ${revision}${detail ? `: ${detail}` : ""}`,
    );
  }
}

/**
 * ## Review セクションをMerge済みPRの証跡へ更新する。
 * すでにreviewedの文書は既存証跡を保持する。再レビューが必要な変更では、
 * PR作成時にStatusをpendingへ戻してから人間レビューへ渡す。
 *
 * @param {string} content Markdown本文。
 * @param {{prNumber: string, reviewedAt: string, reviewedBy: string}} evidence レビュー証跡。
 * @returns {{content: string, changed: boolean}} 更新後本文と変更有無。
 */
export function syncReviewMetadata(content, evidence) {
  const heading = /^## Review\s*$/m.exec(content);
  if (!heading) {
    throw new Error("missing ## Review section");
  }

  const sectionStart = heading.index + heading[0].length;
  const tail = content.slice(sectionStart);
  const nextHeading = /\n##\s/.exec(tail);
  const sectionEnd = nextHeading ? sectionStart + nextHeading.index : content.length;
  const currentSection = content.slice(sectionStart, sectionEnd);
  const currentStatus = /^\s*-\s*Status:\s*(\S+)\s*$/mi.exec(currentSection)?.[1]?.toLowerCase();

  if (currentStatus === "reviewed") {
    return { content, changed: false };
  }

  const reviewedAt = new Date(evidence.reviewedAt);
  if (Number.isNaN(reviewedAt.getTime())) {
    throw new Error(`invalid reviewedAt: ${evidence.reviewedAt}`);
  }

  const reviewBlock = [
    "",
    "",
    "- Status: reviewed",
    `- Evidence: PR #${evidence.prNumber}`,
    `- Reviewed at: ${reviewedAt.toISOString()}`,
    `- Reviewed by: @${evidence.reviewedBy}`,
    "",
  ].join("\n");

  return {
    content: `${content.slice(0, sectionStart)}${reviewBlock}${content.slice(sectionEnd)}`,
    changed: true,
  };
}

/**
 * 対象PRで変更されたファイル一覧をGitHub APIから取得する。
 *
 * @param {{repository: string, prNumber: string, token: string}} input API入力。
 * @returns {Promise<string[]>} 変更ファイルのリポジトリ相対パス。
 */
async function fetchChangedFiles(input) {
  const files = [];
  for (let page = 1; ; page += 1) {
    const response = await fetch(
      `https://api.github.com/repos/${input.repository}/pulls/${input.prNumber}/files?per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${input.token}`,
          "X-GitHub-Api-Version": API_VERSION,
        },
      },
    );
    if (!response.ok) {
      throw new Error(`GitHub API failed: ${response.status} ${await response.text()}`);
    }
    const pageFiles = await response.json();
    files.push(...pageFiles.map((file) => file.filename));
    if (pageFiles.length < 100) break;
  }
  return files;
}

/** Merge済みPRのReview metadataをワークツリーへ反映する。 */
async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.PR_NUMBER;
  const mergeSha = process.env.MERGE_SHA;
  const reviewedAt = process.env.REVIEWED_AT;
  const reviewedBy = process.env.REVIEWED_BY;

  if (!token || !repository || !prNumber || !mergeSha || !reviewedAt || !reviewedBy) {
    throw new Error(
      "GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, MERGE_SHA, REVIEWED_AT, REVIEWED_BY are required",
    );
  }

  const changedFiles = await fetchChangedFiles({ repository, prNumber, token });
  const reviewableFiles = changedFiles.filter(isReviewablePath);

  for (const filePath of reviewableFiles) {
    if (!existsSync(filePath)) continue;
    const original = readFileSync(filePath, "utf8");
    const mergedContent = readFileAtRevision(mergeSha, filePath);
    assertMergedRevisionMatchesCurrent(original, mergedContent, filePath);
    if (!isReviewableContent(original)) {
      console.log(`[sdd-review] skip starter template: ${filePath}`);
      continue;
    }
    const result = syncReviewMetadata(original, { prNumber, reviewedAt, reviewedBy });
    if (!result.changed) continue;
    writeFileSync(filePath, result.content);
    console.log(`[sdd-review] reviewed: ${filePath}`);
  }

  if (!reviewableFiles.length) {
    console.log("[sdd-review] no SDD review artifacts changed");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[sdd-review] ${error.stack ?? error.message}`);
    process.exit(1);
  });
}
