import express from "express";
import fs from "fs";
import path from "path";
import {v2Router} from "../src/routes/v2/index.ts";

interface RouteDef {
  path: string;
  method: string;
}

const IGNORE_PATHS = new Set<string>([
  "/docs",
  "/docs-inline",
  "/openapi.json",
  "/openapi.public.json",
  "/openapi.admin.json",
  "/openapi.ops.json",
  "/healthz",
]);

const IGNORE_PREFIXES = [
  "/admin/ops",
  "/admin/members",
  "/admin/migrations",
  "/admin/recruit",
  "/auth",
  "/users",
  "/posts",
  "/images",
  "/comments",
  "/likes",
  "/galleries",
  "/recruit",
];

function stripVersionPrefix(p: string): string {
  if (p.startsWith("/v2")) {
    const trimmed = p.slice(3);
    return trimmed.length ? trimmed : "/";
  }
  return p;
}

function pathFromRegexp(regexp: RegExp): string {
  const source = regexp.source;
  if (source === "^\\/?$") return "";
  const match = source.match(/^\^\\?\/?(.*?)\/?\(\?=\\\/(?:\|\$)\)/);
  if (match && match[1]) {
    const segment = match[1].replace(/\\\//g, "/");
    return segment.startsWith("/") ? segment : `/${segment}`;
  }
  return "";
}

function collectRoutes(stack: any[], prefix = ""): RouteDef[] {
  const results: RouteDef[] = [];
  for (const layer of stack) {
    if (layer.route && layer.route.path) {
      const routes = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      for (const routePath of routes) {
        for (const method of Object.keys(layer.route.methods || {})) {
          const fullPath = path
            .posix
            .join(prefix || "/", routePath)
            .replace(/\\/g, "/")
            .replace(/\/\?\//g, "/")
            .replace(/\/\?$/g, "/");
          const normalizedPath = fullPath !== "/" && fullPath.endsWith("/") ? fullPath.slice(0, -1) : fullPath;
          const oasPath = normalizedPath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
          results.push({path: oasPath, method: method.toLowerCase()});
        }
      }
    } else if (layer.name === "router" && layer.handle?.stack) {
      const newPrefix = prefix + pathFromRegexp(layer.regexp || /(?:)/);
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
  const raw = fs.readFileSync(absolute, "utf8");
  const start = raw.indexOf("{");
  if (start === -1) {
    console.error(`Spec file is not valid JSON: ${absolute}`);
    process.exit(1);
  }
  const json = raw.slice(start);
  return JSON.parse(json);
}

function specOperations(spec: any): Set<string> {
  const ops = new Set<string>();
  const paths = spec.paths || {};
  for (const [route, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== "object") continue;
    for (const method of Object.keys(methods)) {
      const lower = method.toLowerCase();
      if (["parameters"].includes(lower)) continue;
      ops.add(`${route}::${lower}`);
    }
  }
  return ops;
}

function routeKey(route: RouteDef): string {
  return `${route.path}::${route.method}`;
}

function main() {
  const routes = collectRoutes((v2Router as any).stack, "/v2");
  const filteredRoutes = routes
    .map((r) => ({...r, path: stripVersionPrefix(r.path)}))
    .filter((r) => !IGNORE_PATHS.has(r.path))
    .filter((r) => !IGNORE_PREFIXES.some((prefix) => r.path.startsWith(prefix)));

  const specPath = path.join(process.cwd(), "docs/openapi.json");
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
