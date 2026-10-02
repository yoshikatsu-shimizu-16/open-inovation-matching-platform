import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const workflowUrl = new URL(
  "../../.github/workflows/backend-deploy.yml",
  import.meta.url,
);

test("Cloudflare application deployは環境を選択する手動実行だけを許可する", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /^on:\n  workflow_dispatch:/m);
  assert.doesNotMatch(workflow, /^  push:/m);
  assert.match(workflow, /options: \[preview, production\]/);
});

test("previewのAccess確認と設定生成をmigrationとdeployより先に実行する", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /output -raw preview_hostname/);
  assert.match(workflow, /output -raw preview_access_application_id/);
  const generate = workflow.indexOf("npm run infrastructure:generate-wrangler");
  assert.ok(generate > 0);
  assert.ok(generate < workflow.indexOf("npx wrangler d1 migrations apply"));
  assert.ok(generate < workflow.indexOf("npx wrangler deploy"));
});
