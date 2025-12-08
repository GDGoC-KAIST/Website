import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execSync} from "node:child_process";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const cwd = process.cwd();
const baselinePath = path.join(cwd, "docs", "openapi.json");

if (!fs.existsSync(baselinePath)) {
  fail("Missing baseline OpenAPI spec at docs/openapi.json. Generate it and commit before releasing.");
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "openapi-"));
const tempPath = path.join(tempDir, "generated-openapi.json");

try {
  execSync(`ts-node scripts/print-openapi.ts --out ${tempPath} --scope ops`, {
    stdio: "inherit",
  });

  const expected = fs.readFileSync(baselinePath, "utf8");
  const actual = fs.readFileSync(tempPath, "utf8");

  if (expected !== actual) {
    fail("OpenAPI spec is out of sync. Run `npm run openapi:print > docs/openapi.json` and commit the changes.");
  }

  console.log("OpenAPI spec is in sync.");
} catch (error) {
  fail(`OpenAPI verification failed: ${(error as Error).message}`);
} finally {
  try {
    fs.rmSync(tempDir, {recursive: true, force: true});
  } catch {
    // ignore cleanup errors
  }
}
