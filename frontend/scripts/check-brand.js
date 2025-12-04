#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const INCLUDE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".json", ".mjs"]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".turbo"]);

const FORBIDDEN_PATTERNS = [
  {
    regex: /\bGDGoC\b/,
    message: "Replace 'GDGoC' with 'Google Developer Group on Campus KAIST' or 'GDG on Campus KAIST'.",
  },
  {
    regex: /\bGDG KAIST\b/,
    message: "Use 'GDG on Campus KAIST' instead of 'GDG KAIST'.",
  },
];

function shouldSkipFile(file) {
  return !INCLUDE_EXTENSIONS.has(path.extname(file));
}

function shouldAllowLine(line) {
  return /GDGoC KAIST Logo\.png/.test(line);
}

const SKIP_FILES = new Set([path.join(ROOT, "scripts", "check-brand.js")]);

function walk(dir, collector) {
  const entries = fs.readdirSync(dir, {withFileTypes: true});
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, collector);
    } else if (!shouldSkipFile(entry.name)) {
      collector.push(fullPath);
    }
  }
}

function run() {
  const files = [];
  walk(ROOT, files);

  const violations = [];

  files.forEach((file) => {
    if (SKIP_FILES.has(file)) return;
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (shouldAllowLine(line)) return;
      FORBIDDEN_PATTERNS.forEach(({regex, message}) => {
        if (regex.test(line)) {
          violations.push({
            file,
            line: index + 1,
            snippet: line.trim(),
            message,
          });
        }
      });
    });
  });

  if (violations.length > 0) {
    console.error("Branding lint failed:");
    violations.forEach((violation) => {
      console.error(
        ` - ${violation.file}:${violation.line} — ${violation.message}\n   ${violation.snippet}`
      );
    });
    process.exit(1);
  } else {
    console.log("Branding lint passed ✅");
  }
}

run();
