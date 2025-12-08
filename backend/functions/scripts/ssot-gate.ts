import {execSync} from "child_process";
import type {ExecSyncOptions} from "child_process";

const SKIP_TOKEN = "[skip-gate]";
const OPENAPI_SOURCE = "src/docs/openapi.ts";
const OPENAPI_SPEC = "openapi.json";

function run(command: string, options: ExecSyncOptions = {}): string {
  const result = execSync(command, {encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], ...options});
  return result.toString().trim();
}

function maybeFetchBase(): void {
  try {
    execSync("git rev-parse --verify origin/main", {stdio: "ignore"});
  } catch {
    execSync("git fetch origin main", {stdio: "inherit"});
  }
}

function hasSkipToken(): boolean {
  try {
    const message = run("git log -1 --pretty=%B").toLowerCase();
    return message.includes(SKIP_TOKEN);
  } catch {
    return false;
  }
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

if (hasSkipToken()) {
  console.log("[SSOT] 커밋 메시지에 [skip-gate]가 있어 검증을 생략합니다.");
  process.exit(0);
}

maybeFetchBase();

let diffOutput = "";
try {
  diffOutput = run("git diff --name-only origin/main...HEAD");
} catch (error) {
  console.error("[SSOT] 변경 파일을 가져오지 못했습니다.", error);
  process.exit(1);
}

const changedFiles = diffOutput
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);

if (changedFiles.length === 0) {
  console.log("[SSOT] 변경된 파일이 없어 게이트를 통과합니다.");
  process.exit(0);
}

const codeChanged = changedFiles.some((file) => /^src\/(routes|controllers|schemas)\//.test(file));
const openApiSourceChanged = changedFiles.includes(OPENAPI_SOURCE);
const openApiJsonChanged = changedFiles.includes(OPENAPI_SPEC);

if (openApiJsonChanged && !openApiSourceChanged) {
  fail("[SSOT] openapi.json만 수정되었습니다. 항상 src/docs/openapi.ts에서 스펙을 생성하세요 (npm run openapi:print > openapi.json).");
}

if (openApiSourceChanged && !openApiJsonChanged) {
  fail("[SSOT] OpenAPI 소스가 수정되었지만 openapi.json이 갱신되지 않았습니다. npm run openapi:print > openapi.json을 실행하고 커밋하세요.");
}

if (codeChanged && !openApiSourceChanged) {
  fail("[SSOT] API 코드가 변경되었지만 스펙 소스(src/docs/openapi.ts)가 갱신되지 않았습니다.");
}

console.log("[SSOT] 코드, 스펙 소스, 산출물이 동기화되었습니다.");
