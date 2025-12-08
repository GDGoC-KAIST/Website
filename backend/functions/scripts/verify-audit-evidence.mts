import fs from "node:fs";
import path from "node:path";

const DOCS_DIR = path.resolve(process.cwd(), "docs/audit");
const SRC_ROOT = process.cwd();

// Matches patterns like "src/path/to/file.ts:10" or "src/path/to/file.ts:10-20"
const EVIDENCE_REGEX = /([a-zA-Z0-9_.-/]+\.(ts|js|json)):(\d+)(-(\d+))?/g;

let hasError = false;

function verifyFile(docPath: string): void {
  const content = fs.readFileSync(docPath, "utf-8");
  let match: RegExpExecArray | null;

  while ((match = EVIDENCE_REGEX.exec(content)) !== null) {
    const [, filePath, , startLine, , endLine] = match;
    const absolutePath = path.resolve(SRC_ROOT, filePath);

    if (!fs.existsSync(absolutePath)) {
      console.error(`[Missing File] in ${path.basename(docPath)}: ${filePath} not found.`);
      hasError = true;
      continue;
    }

    const fileLines = fs.readFileSync(absolutePath, "utf-8").split("\n").length;
    const start = parseInt(startLine, 10);
    const end = endLine ? parseInt(endLine, 10) : start;

    if (start > fileLines || end > fileLines) {
      console.error(
        `[Invalid Line] in ${path.basename(docPath)}: ${filePath}:${start}-${end} (File has ${fileLines} lines).`
      );
      hasError = true;
    }
  }
}

if (!fs.existsSync(DOCS_DIR)) {
  console.error("Docs directory not found.");
  process.exit(1);
}

const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"));
console.log(`Verifying evidence in ${files.length} documents...`);

files.forEach((file) => verifyFile(path.join(DOCS_DIR, file)));

if (hasError) {
  console.error("Verification Failed: Fix broken evidence links.");
  process.exit(1);
}

console.log("All evidence links are valid.");
process.exit(0);
