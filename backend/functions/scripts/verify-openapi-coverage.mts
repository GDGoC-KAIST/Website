import express from "express";
import fs from "fs";
import path from "path";
import {v2Router} from "../src/routes/v2/index.ts";

interface RouteDef {
  path: string;
  method: string;
}

const IGNORE_PATTERNS = [
  "/v2/docs",
  "/v2/docs/*",
  "/v2/openapi.json",
  "/v2/openapi.public.json",
  "/v2/openapi.admin.json",
  "/v2/openapi.ops.json",
  "/healthz",
  "/v2/healthz",
];

const SKIP_METHODS = new Set(["head", "options"]);

function escapeRegex(pattern: string): string {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toRegex(pattern: string): RegExp {
  const source = escapeRegex(pattern).replace(/\\\*/g, ".*");
  return new RegExp(`^${source}$`);
}

const ignoreRegexes = IGNORE_PATTERNS.map(toRegex);

function shouldIgnore(pathname: string): boolean {
  return ignoreRegexes.some((regex) => regex.test(pathname));
}

function pathFromRegexp(regexp: RegExp): string {
  const str = regexp?.toString();
  if (!str || str === "/^\\/?$/i") return "";
  const match = str.match(/^\/\^\\\/(.*?)\\\/\?\(\?=\\\/\|\$\)\/i$/);
  if (match?.[1]) {
    return "/" + match[1].replace(/\\\\\//g, "/");
  }
  return "";
}

function normalizePath(routePath: string): string {
  const normalized = routePath
    .replace(/\\/g, "/")
    .replace(/:(\w+)/g, "{$1}")
    .replace(/\/+$/, "");
  return normalized || "/";
}

function collectRoutes(stack: any[], prefix = ""): RouteDef[] {
  const results: RouteDef[] = [];
  for (const layer of stack) {
    if (layer.route && layer.route.path) {
      const routes = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      for (const routePath of routes) {
        for (const method of Object.keys(layer.route.methods || {})) {
          if (SKIP_METHODS.has(method.toLowerCase())) continue;
          const combined = `${prefix}/${routePath}`;
          const fullPath = normalizePath(combined.replace(/\/+/g, "/"));
          results.push({path: fullPath, method: method.toLowerCase()});
        }
      }
    } else if (layer.name === "router" && layer.handle?.stack) {
      const newPrefix = normalizePath(prefix + pathFromRegexp(layer.regexp || /(?:)/));
      results.push(...collectRoutes(layer.handle.stack, newPrefix));
    }
  }
  return results;
}

function loadSpec(specPath: string) {
  const absolute = path.resolve(specPath);
  if (!fs.existsSync(absolute)) {
    console.error(`Spec file not found: ${absolute}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(absolute, "utf8"));
}

function specOperations(spec: any): Set<string> {
  const ops = new Set<string>();
  const paths = spec.paths || {};
  for (const [route, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== "object") continue;
    const normalizedRoute = normalizePath(route);
    for (const method of Object.keys(methods)) {
      const lower = method.toLowerCase();
      if (lower === "parameters") continue;
      ops.add(`${normalizedRoute}::${lower}`);
    }
  }
  return ops;
}

function routeKey(route: RouteDef): string {
  return `${route.path}::${route.method}`;
}

function main() {
  const app = express();
  app.use("/v2", v2Router);

  const routes = collectRoutes(app._router.stack, "");
  const filteredRoutes = routes.filter((r) => !shouldIgnore(r.path));

  const specPath = path.join(process.cwd(), "docs/openapi.ops.json");
  const spec = loadSpec(specPath);
  const specOps = specOperations(spec);

  const missing = filteredRoutes.filter((r) => !specOps.has(routeKey(r)));

  if (missing.length) {
    console.error("OpenAPI coverage failed. Missing routes:");
    for (const miss of missing) {
      console.error(`- ${miss.method.toUpperCase()} ${miss.path}`);
    }
    process.exit(1);
  }

  console.log("✅ OpenAPI coverage verified");
}

main();
