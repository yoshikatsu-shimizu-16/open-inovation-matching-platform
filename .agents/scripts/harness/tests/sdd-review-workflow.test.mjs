import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const workflowPath = resolve(".github/workflows/sdd-review-evidence.yml");

test("Review evidence syncはpre-sync検証後にmetadataを更新する", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  const preSyncCheck = workflow.indexOf("- name: Verify SDD review state before sync");
  const sync = workflow.indexOf("- name: Sync SDD review metadata");
  const postSyncCheck = workflow.indexOf("- name: Verify SDD review state after sync");

  assert.ok(preSyncCheck >= 0, "pre-sync stage check is required");
  assert.ok(sync > preSyncCheck, "metadata sync must run after pre-sync stage check");
  assert.ok(postSyncCheck > sync, "post-sync stage check must run after metadata sync");
});
