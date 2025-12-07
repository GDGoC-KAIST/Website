import {execSync, ExecSyncOptions} from "child_process";

const SKIP_TOKEN = "[skip-gate]";

function run(command: string, options: ExecSyncOptions = {}): string {
  return execSync(command, {encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], ...options}).trim();
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

const codeChanged = changedFiles.some((file) => /^src\/(routes|controllers|schemas)\//.test(file));
const docChanged = changedFiles.some((file) => file === "src/docs/openapi.ts");

if (codeChanged && !docChanged) {
  console.error("[SSOT] API 코드가 변경되었지만 문서가 갱신되지 않았습니다. src/docs/openapi.ts 파일을 업데이트하세요.");
  process.exit(1);
}

console.log("[SSOT] 문서와 코드의 동기화가 확인되었습니다.");
