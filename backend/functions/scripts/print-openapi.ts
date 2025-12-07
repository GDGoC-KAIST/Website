import swaggerJsdoc from "swagger-jsdoc";
import {openApiOptions} from "../src/docs/openapi.ts";

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

const spec = swaggerJsdoc(openApiOptions);
const stableSpec = sortKeys(spec);
console.log(JSON.stringify(stableSpec, null, 2));
