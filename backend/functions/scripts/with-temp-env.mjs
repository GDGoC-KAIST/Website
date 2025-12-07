import fs from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");

// Get command to run
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/with-temp-env.mjs <command> [args...]");
  process.exit(1);
}

// Create dummy .env if missing
let created = false;
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, "# temp env for firebase emulator\n", "utf8");
  created = true;
}

// Execute the command
const child = spawn(args[0], args.slice(1), {stdio: "inherit", shell: false});

child.on("exit", (code) => {
  // Cleanup
  if (created) {
    try {
      fs.unlinkSync(envPath);
    } catch {}
  }
  process.exit(code ?? 1);
});
