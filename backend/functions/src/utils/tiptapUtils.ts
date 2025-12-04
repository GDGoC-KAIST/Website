import type {TipTapDoc, TipTapNode} from "../types/tiptap";

export function extractPlainText(doc: TipTapDoc): string {
  return traverse(doc).join("\n").slice(0, 20_000);
}

export function generateExcerpt(doc: TipTapDoc, length = 300): string {
  const text = extractPlainText(doc);
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

export function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = words / 200;
  return Math.max(15, Math.round(minutes * 60));
}

export function canonicalStringify(obj: unknown): string {
  return JSON.stringify(sortKeys(obj));
}

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  if (obj && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    Object.keys(obj as Record<string, unknown>)
      .sort()
      .forEach((key) => {
        sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
      });
    return sorted;
  }
  return obj;
}

function traverse(node: TipTapDoc | TipTapNode): string[] {
  if (!node) return [];
  switch (node.type) {
    case "doc":
    case "paragraph":
    case "heading":
    case "listItem":
    case "bulletList":
    case "orderedList":
    case "codeBlock":
      return flatten((node as {content?: TipTapNode[]}).content);
    case "text":
      return [node.text];
    case "hardBreak":
      return [""];
    default:
      return flatten((node as {content?: TipTapNode[]}).content);
  }
}

function flatten(content?: TipTapNode[]): string[] {
  if (!content) return [];
  const lines: string[] = [];
  for (const child of content) {
    lines.push(...traverse(child));
  }
  return lines;
}
