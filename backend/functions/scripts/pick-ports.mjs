import net from "node:net";
import {fileURLToPath} from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const functionsDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(functionsDir, "..");
const tmpDir = path.join(repoRoot, ".tmp");
const envFilePath = path.join(tmpDir, "emulators.env");
const baseFirebaseConfig = path.join(repoRoot, "firebase.json");
const testFirebaseConfig = path.join(repoRoot, "firebase.test.json");

async function findOpenPort(retry = 0) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", (error) => {
      server.close();
      if (retry < 5) {
        setTimeout(() => {
          findOpenPort(retry + 1).then(resolve).catch(reject);
        }, 50);
      } else {
        reject(error);
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const {port} = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function ensureUniquePorts(count) {
  const ports = new Set();
  while (ports.size < count) {
    ports.add(await findOpenPort());
  }
  return [...ports];
}

async function main() {
  const [firestorePort, authPort, functionsPort, hubPort] = await ensureUniquePorts(4);

  await fs.mkdir(tmpDir, {recursive: true});
  const envContents = [
    `FIRESTORE_EMULATOR_HOST=127.0.0.1:${firestorePort}`,
    `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:${authPort}`,
    `FUNCTIONS_EMULATOR_HOST=127.0.0.1:${functionsPort}`,
    `FIREBASE_EMULATOR_HUB=127.0.0.1:${hubPort}`,
  ].join("\n") + "\n";
  await fs.writeFile(envFilePath, envContents, "utf8");

  const configRaw = await fs.readFile(baseFirebaseConfig, "utf8");
  const config = JSON.parse(configRaw);
  config.emulators = config.emulators ?? {};

  config.emulators.firestore = {
    ...(config.emulators.firestore ?? {}),
    host: "127.0.0.1",
    port: firestorePort,
  };

  config.emulators.auth = {
    ...(config.emulators.auth ?? {}),
    host: "127.0.0.1",
    port: authPort,
  };

  config.emulators.functions = {
    ...(config.emulators.functions ?? {}),
    host: "127.0.0.1",
    port: functionsPort,
  };

  config.emulators.hub = {
    ...(config.emulators.hub ?? {}),
    host: "127.0.0.1",
    port: hubPort,
  };

  await fs.writeFile(testFirebaseConfig, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(
    `Using dynamic emulator ports - firestore:${firestorePort}, auth:${authPort}, functions:${functionsPort}, hub:${hubPort}`
  );
}

main().catch((error) => {
  console.error("Failed to pick emulator ports:", error);
  process.exit(1);
});
