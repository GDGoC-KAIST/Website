import swaggerJsdoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";

type Scope = "public" | "admin" | "ops";

const args = process.argv.slice(2);

function parseArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function requireArg(flag: string, name: string): string {
  const val = parseArg(flag);
  if (!val) {
    console.error(`Missing required argument: ${flag} <${name}>`);
    process.exit(1);
  }
  return val;
}

const outPath = path.resolve(requireArg("--out", "path"));
const scope = (parseArg("--scope") as Scope | undefined) ?? "ops";
const validScopes: Scope[] = ["public", "admin", "ops"];
if (!validScopes.includes(scope)) {
  console.error(`Invalid scope: ${scope}. Expected one of ${validScopes.join(",")}`);
  process.exit(1);
}

const openApiModule = await import("../src/docs/openapi.ts");
const {openApiOptions} = openApiModule as {openApiOptions: import("swagger-jsdoc").Options};

// 키를 알파벳 순으로 정렬해 항상 동일한 JSON을 생성한다.
function sortKeys<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => sortKeys(item)) as T;
  }

  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = sortKeys(record[key]);
    }
    return sorted as T;
  }

  return input;
}

function filterPaths(paths: Record<string, unknown>, currentScope: Scope) {
  const result: Record<string, unknown> = {};
  for (const [route, value] of Object.entries(paths)) {
    const isAdmin = route.startsWith("/v2/admin");
    const isAdminOps = route.startsWith("/v2/admin/ops");
    const isAdminMigrations = route.startsWith("/v2/admin/migrations");

    if (currentScope === "public") {
      if (isAdmin) continue;
    } else if (currentScope === "admin") {
      if (!isAdmin) continue;
      if (isAdminOps || isAdminMigrations) continue;
    }

    result[route] = value;
  }
  return result;
}

const spec = swaggerJsdoc(openApiOptions);

// Defensive injection for TipTapDoc schema
const s = spec as any;
s.components = s.components || {};
s.components.schemas = s.components.schemas || {};
s.components.schemas.TipTapDoc = s.components.schemas.TipTapDoc || {
  type: "object",
  additionalProperties: true,
  description: "TipTap editor JSON structure - injected at generation",
};

s.paths = filterPaths(s.paths || {}, scope);

const stableSpec = sortKeys(spec);

fs.writeFileSync(outPath, JSON.stringify(stableSpec, null, 2), "utf8");
console.log(`✅ Generated OpenAPI spec at ${outPath}`);
