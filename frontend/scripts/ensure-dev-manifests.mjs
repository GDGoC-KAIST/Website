import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const devDir = path.join(root, ".next", "dev");
const manifestPath = path.join(devDir, "routes-manifest.json");

const defaultManifest = {
  version: 3,
  caseSensitive: false,
  basePath: "",
  rewrites: {
    beforeFiles: [],
    afterFiles: [],
    fallback: [],
  },
  redirects: [],
  headers: [],
};

function ensureRoutesManifest() {
  if (!fs.existsSync(devDir)) {
    fs.mkdirSync(devDir, {recursive: true});
  }

  if (!fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, JSON.stringify(defaultManifest), "utf8");
  }
}

ensureRoutesManifest();
