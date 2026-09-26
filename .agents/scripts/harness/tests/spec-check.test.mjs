import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isReviewablePath,
  syncReviewMetadata,
} from "../../sdd/sync-review-metadata.mjs";

const checker = resolve(".agents/scripts/harness/checks/spec-check.sh");
const review = (reviewed = true) =>
  reviewed
    ? "- Status: reviewed\n- Evidence: PR #99\n- Reviewed at: 2026-09-26T10:00:00.000Z\n- Reviewed by: @reviewer"
    : "- Status: pending\n- Evidence: —\n- Reviewed at: —\n- Reviewed by: —";
const project = (rows, reviewed = true) => `# Project Requirements
## Requirements register
| ID | 要求と全体受入条件 | 状態 | 対象段階 | 対応SPEC | 完了日 | 検証根拠 |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}
## Review
${review(reviewed)}
`;
const constitution = (reviewed = true) => `# Project Constitution
## Principles
- P-001: 仕様をレビューしてから実装する。
## Review
${review(reviewed)}
`;
const fr = (spec = "dialogue") => `| FR-001 | 相談を受ける | 仕様化中 | 1 | ${spec} | — | — |`;
const nfr = () => "| NFR-001 | 秘密を守る | 予定 | 1 | — | — | — |";

function runFixture({ rows = [fr(), nfr()], projectReviewed = true, constitutionReviewed = true, feature = true, legacy = false, parent = "FR-001", requirementReviewed = false, omitProject = false }) {
  const root = mkdtempSync(join(tmpdir(), "sdd-spec-check-"));
  try {
    mkdirSync(join(root, "docs/specs"), { recursive: true });
    writeFileSync(join(root, "docs/constitution.md"), constitution(constitutionReviewed));
    if (!omitProject) writeFileSync(join(root, "docs/project-requirements.md"), project(rows, projectReviewed));
    if (feature) {
      mkdirSync(join(root, "docs/specs/dialogue"));
      writeFileSync(join(root, "docs/specs/dialogue/requirements.md"), `# Dialogue
## Parent requirements
${parent}
## Requirements (EARS)
- [ ] REQ-001: THE SYSTEM SHALL 相談を開始する。
## Review
${review(requirementReviewed)}
`);
    }
    if (legacy) {
      mkdirSync(join(root, "docs/specs/hono-backend-boilerplate"));
      writeFileSync(join(root, "docs/specs/hono-backend-boilerplate/requirements.md"), "- [x] レビュー済み\nREQ-001");
    }
    const result = spawnSync("bash", [checker], { cwd: root, encoding: "utf8" });
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("スターターの既存SPECだけなら全体要件がなくても通る", () => {
  assert.equal(runFixture({ feature: false, legacy: true, omitProject: true, constitutionReviewed: false }).status, 0);
});
test("新しいSPECはレビュー済みの全体要件とconstitutionを必要とする", () => {
  assert.match(runFixture({ omitProject: true }).output, /missing docs\/project-requirements.md/);
  assert.match(runFixture({ projectReviewed: false }).output, /must be human-reviewed/);
  assert.match(runFixture({ constitutionReviewed: false }).output, /constitution must be human-reviewed/);
  assert.equal(runFixture({}).status, 0);
});
test("番号の欠番・重複と存在しない参照を拒否する", () => {
  assert.match(runFixture({ rows: [fr(), fr(), nfr()] }).output, /duplicate requirement ID/);
  assert.match(runFixture({ rows: [fr(), "| FR-003 | 次の機能 | 予定 | 2 | — | — | — |", nfr()] }).output, /gap in FR IDs/);
  assert.match(runFixture({ parent: "FR-999" }).output, /unknown parent FR-999/);
  assert.match(runFixture({ rows: [fr("missing"), nfr()] }).output, /refers to missing spec/);
});
test("検証済み要求には完了日と根拠が必要", () => {
  const result = runFixture({ rows: ["| FR-001 | 相談 | 検証済み | 1 | dialogue | — | — |", nfr()] });
  assert.match(result.output, /needs completion date and evidence/);
});
test("レビュー済み文書の雛形と取り下げ済みの親要求を拒否する", () => {
  assert.match(runFixture({ rows: [fr().replace("相談を受ける", "<未記入>"), nfr()] }).output, /template placeholders/);
  assert.match(runFixture({ rows: [fr().replace("仕様化中", "取り下げ"), nfr()] }).output, /withdrawn parent/);
});
test("designはrequirementsのreviewed metadataがないと作成済み扱いにできない", () => {
  const root = mkdtempSync(join(tmpdir(), "sdd-review-order-"));
  try {
    mkdirSync(join(root, "docs/specs/dialogue"), { recursive: true });
    writeFileSync(join(root, "docs/project-requirements.md"), project([fr(), nfr()], true));
    writeFileSync(join(root, "docs/constitution.md"), constitution(true));
    writeFileSync(join(root, "docs/specs/dialogue/requirements.md"), `# Dialogue\n## Parent requirements\nFR-001\nREQ-001\n## Review\n${review(false)}\n`);
    writeFileSync(join(root, "docs/specs/dialogue/design.md"), `# Design\n## Review\n${review(false)}\n`);
    const result = spawnSync("bash", [checker], { cwd: root, encoding: "utf8" });
    assert.match(result.stdout + result.stderr, /design.md exists before requirements.md is reviewed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("review metadata syncはpendingをMerge証跡へ変換する", () => {
  const source = `# Requirements\n\n## Review\n\n${review(false)}\n`;
  const result = syncReviewMetadata(source, {
    prNumber: "7",
    reviewedAt: "2026-09-26T10:49:33Z",
    reviewedBy: "swdevsmz",
  });
  assert.equal(result.changed, true);
  assert.match(result.content, /- Status: reviewed/);
  assert.match(result.content, /- Evidence: PR #7/);
  assert.match(result.content, /- Reviewed by: @swdevsmz/);
});
test("review metadata syncは既存のreviewed証跡を上書きしない", () => {
  const source = `# Requirements\n\n## Review\n\n${review(true)}\n`;
  const result = syncReviewMetadata(source, {
    prNumber: "100",
    reviewedAt: "2026-09-26T11:00:00Z",
    reviewedBy: "other",
  });
  assert.equal(result.changed, false);
  assert.equal(result.content, source);
});
test("review対象パスだけを同期対象にする", () => {
  assert.equal(isReviewablePath("docs/project-requirements.md"), true);
  assert.equal(isReviewablePath("docs/constitution.md"), true);
  assert.equal(isReviewablePath("docs/specs/F001-demo/requirements.md"), true);
  assert.equal(isReviewablePath("docs/specs/F001-demo/design.md"), true);
  assert.equal(isReviewablePath("docs/specs/F001-demo/tasks.md"), true);
  assert.equal(isReviewablePath("README.md"), false);
});
