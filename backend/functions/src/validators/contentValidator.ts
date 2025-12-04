import {AppError} from "../utils/appError";
import type {TipTapDoc, TipTapNode, TipTapMark} from "../types/tiptap";

const MAX_BYTES = 200 * 1024;
const MAX_DEPTH = 10;

export function validateContent(payload: unknown): TipTapDoc {
  const serialized = JSON.stringify(payload ?? {});
  if (Buffer.byteLength(serialized, "utf8") > MAX_BYTES) {
    throw new AppError(400, "CONTENT_TOO_LARGE", "Content exceeds allowed size");
  }
  const doc = JSON.parse(serialized);
  assertDoc(doc);
  return doc;
}

function assertDoc(doc: any) {
  if (!doc || doc.type !== "doc" || !Array.isArray(doc.content) || doc.content.length === 0) {
    throw new AppError(400, "INVALID_CONTENT", "Invalid TipTap document");
  }
  doc.content = doc.content.map((node: any) => validateNode(node, 1));
}

function validateNode(node: any, depth: number): TipTapNode {
  if (depth > MAX_DEPTH) {
    throw new AppError(400, "CONTENT_TOO_DEEP", "Content nesting depth is too large");
  }
  if (!node || typeof node.type !== "string") {
    throw new AppError(400, "INVALID_CONTENT", "Invalid node");
  }
  switch (node.type) {
    case "paragraph":
    case "bulletList":
    case "listItem":
      return {
        type: node.type,
        content: node.content ? node.content.map((child: any) => validateNode(child, depth + 1)) : undefined,
      };
    case "heading":
      return {
        type: "heading",
        attrs: node.attrs && typeof node.attrs.level === "number" ? {level: clamp(node.attrs.level, 1, 6)} : undefined,
        content: node.content ? node.content.map((child: any) => validateNode(child, depth + 1)) : undefined,
      };
    case "orderedList":
      return {
        type: "orderedList",
        attrs: node.attrs && typeof node.attrs.start === "number" ? {start: Math.max(1, node.attrs.start)} : undefined,
        content: node.content ? node.content.map((child: any) => validateNode(child, depth + 1)) : undefined,
      };
    case "codeBlock":
      return {
        type: "codeBlock",
        attrs: node.attrs && typeof node.attrs.language === "string" ? {language: node.attrs.language} : undefined,
        content: node.content ? node.content.map((child: any) => validateNode(child, depth + 1)) : undefined,
      };
    case "image":
      return {
        type: "image",
        attrs: sanitizeStringAttrs(node.attrs, ["src", "alt", "title"]),
      };
    case "text":
      if (typeof node.text !== "string") {
        throw new AppError(400, "INVALID_CONTENT", "Text node missing text");
      }
      if (node.text.length > 20000) {
        throw new AppError(400, "INVALID_CONTENT", "Text node too long");
      }
      return {
        type: "text",
        text: node.text,
        marks: node.marks ? node.marks.map(parseMark) : undefined,
      };
    case "hardBreak":
      return {type: "hardBreak"};
    default:
      throw new AppError(400, "INVALID_CONTENT", `Unsupported node type "${node.type}"`);
  }
}

function parseMark(mark: any): TipTapMark {
  if (!mark || typeof mark.type !== "string") {
    throw new AppError(400, "INVALID_CONTENT", "Invalid mark");
  }
  if (mark.type === "link") {
    return {
      type: "link",
      attrs: sanitizeStringAttrs(mark.attrs, ["href", "target"]),
    };
  }
  if (mark.type === "bold" || mark.type === "italic" || mark.type === "code") {
    return {type: mark.type};
  }
  throw new AppError(400, "INVALID_CONTENT", `Unsupported mark "${mark.type}"`);
}

function sanitizeStringAttrs(attrs: any, allowed: string[]): Record<string, string> | undefined {
  if (!attrs || typeof attrs !== "object") return undefined;
  const clean: Record<string, string> = {};
  allowed.forEach((key) => {
    if (typeof attrs[key] === "string") {
      clean[key] = attrs[key];
    }
  });
  return Object.keys(clean).length ? clean : undefined;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
