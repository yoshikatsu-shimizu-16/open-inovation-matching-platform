import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const result = spawnSync("npm", ["run", "harness:verify", "--", "--hook"], {
  cwd: repositoryRoot,
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

if (result.error || result.status !== 0) {
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  process.stderr.write(
    output.slice(-12_000) || String(result.error || `exit ${result.status}`),
  );
  process.exit(2);
}

process.stdout.write("{}\n");
