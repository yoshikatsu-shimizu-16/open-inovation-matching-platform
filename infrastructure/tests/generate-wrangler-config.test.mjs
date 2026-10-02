import assert from "node:assert/strict";
import { test } from "node:test";

import { buildWranglerConfig } from "../scripts/generate-wrangler-config.mjs";

test("Terraform outputsからremote bindingとSPA assets設定を生成する", () => {
  const config = buildWranglerConfig({
    WORKER_NAME: "sample-preview-worker",
    D1_DATABASE_NAME: "sample-preview-tasks",
    D1_DATABASE_ID: "00000000-0000-0000-0000-000000000001",
    R2_BUCKET_NAME: "sample-preview-assets",
    DEPLOY_ENVIRONMENT: "preview",
    PREVIEW_HOSTNAME: "preview.example.com",
    PREVIEW_ACCESS_APPLICATION_ID: "00000000-0000-0000-0000-000000000002",
  });

  assert.equal(config.name, "sample-preview-worker");
  assert.equal(config.d1_databases[0].binding, "DB");
  assert.equal(
    config.d1_databases[0].database_id,
    "00000000-0000-0000-0000-000000000001",
  );
  assert.equal(config.r2_buckets[0].binding, "OBJECTS");
  assert.equal(config.r2_buckets[0].bucket_name, "sample-preview-assets");
  assert.deepEqual(config.assets.run_worker_first, ["/api/*"]);
  assert.equal(config.assets.not_found_handling, "single-page-application");
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(config.routes, [
    { pattern: "preview.example.com", custom_domain: true },
  ]);
});

test("local設定はproduction resource IDを要求しない", () => {
  const config = buildWranglerConfig({});

  assert.equal(config.d1_databases[0].database_id, "local");
  assert.equal(config.r2_buckets[0].bucket_name, "dev-standard-kit-assets");
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(config.routes, []);
});

test("Accessが未適用のpreviewは設定生成の時点で拒否する", () => {
  assert.throws(
    () =>
      buildWranglerConfig({
        DEPLOY_ENVIRONMENT: "preview",
        D1_DATABASE_ID: "remote",
        PREVIEW_HOSTNAME: "preview.example.com",
      }),
    /Access/,
  );
  assert.throws(
    () =>
      buildWranglerConfig({
        DEPLOY_ENVIRONMENT: "preview",
        D1_DATABASE_ID: "remote",
        PREVIEW_ACCESS_APPLICATION_ID: "application",
      }),
    /Access/,
  );
});

test("remote bindingには対象環境の明示を要求する", () => {
  assert.throws(
    () => buildWranglerConfig({ D1_DATABASE_ID: "remote" }),
    /DEPLOY_ENVIRONMENT/,
  );
});

test("preview hostnameにはパス、wildcard、URL、workers.devを許可しない", () => {
  for (const hostname of [
    "https://preview.example.com",
    "*.example.com",
    "preview.example.com/api",
    "example.workers.dev",
  ]) {
    assert.throws(
      () =>
        buildWranglerConfig({
          DEPLOY_ENVIRONMENT: "preview",
          PREVIEW_HOSTNAME: hostname,
          PREVIEW_ACCESS_APPLICATION_ID: "application",
        }),
      /hostname/,
    );
  }
});

test("productionの既存routing契約は変更しない", () => {
  const config = buildWranglerConfig({
    DEPLOY_ENVIRONMENT: "production",
    D1_DATABASE_ID: "remote",
  });
  assert.equal(config.workers_dev, undefined);
  assert.equal(config.routes, undefined);
});
