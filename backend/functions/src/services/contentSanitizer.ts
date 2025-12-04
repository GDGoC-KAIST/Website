import type {TipTapDoc, TipTapNode, TipTapMark} from "../types/tiptap";

const SAFE_PROTOCOLS = ["http:", "https:"];
const imageAttrAllow = new Set(["src", "alt", "title"]);
const codeBlockAttrAllow = new Set(["language"]);
const headingAttrAllow = new Set(["level"]);
const orderedListAttrAllow = new Set(["start"]);

export function sanitizeContent(doc: TipTapDoc): TipTapDoc {
  return {
    type: "doc",
    content: doc.content ? doc.content.map(sanitizeNode).filter(Boolean) as TipTapNode[] : [],
  };
}

function sanitizeNode(node: TipTapNode): TipTapNode {
  switch (node.type) {
    case "paragraph":
    case "bulletList":
    case "listItem":
      return {
        ...node,
        content: node.content ? node.content.map(sanitizeNode).filter(Boolean) as TipTapNode[] : undefined,
      };
    case "heading":
      return {
        ...node,
        attrs: sanitizeAttrs(node.attrs, headingAttrAllow),
        content: node.content ? node.content.map(sanitizeNode).filter(Boolean) as TipTapNode[] : undefined,
      };
    case "orderedList":
      return {
        ...node,
        attrs: sanitizeAttrs(node.attrs, orderedListAttrAllow),
        content: node.content ? node.content.map(sanitizeNode).filter(Boolean) as TipTapNode[] : undefined,
      };
    case "codeBlock":
      return {
        ...node,
        attrs: sanitizeAttrs(node.attrs, codeBlockAttrAllow),
        content: node.content ? node.content.map(sanitizeNode).filter(Boolean) as TipTapNode[] : undefined,
      };
    case "image":
      return {
        ...node,
        attrs: sanitizeImageAttrs(node.attrs),
      };
    case "text": {
      const marks = node.marks
        ? (node.marks.map(sanitizeMark).filter(Boolean) as TipTapMark[])
        : undefined;
      return {
        ...node,
        marks: marks && marks.length > 0 ? marks : undefined,
      };
    }
    case "hardBreak":
      return node;
    default:
      return node;
  }
}

function sanitizeMark(mark: TipTapMark): TipTapMark | null {
  if (mark.type === "link") {
    const attrs = sanitizeLinkAttrs(mark.attrs);
    if (!attrs || !attrs.href) {
      return null;
    }
    return {
      type: "link",
      attrs,
    };
  }
  return mark;
}

function sanitizeLinkAttrs(attrs?: {href?: string; target?: string}) {
  if (!attrs) return undefined;
  const clean: Record<string, string> = {};
  if (attrs.href) {
    const url = safeUrl(attrs.href);
    if (url) {
      clean.href = url;
    }
  }
  if (attrs.target) {
    clean.target = attrs.target;
  }
  return Object.keys(clean).length ? clean : undefined;
}

function sanitizeImageAttrs(attrs?: {src?: string; alt?: string; title?: string}) {
  if (!attrs) return undefined;
  const clean: Record<string, string> = {};
  for (const key of imageAttrAllow) {
    const value = (attrs as Record<string, string | undefined>)[key];
    if (key === "src" && value) {
      const url = safeUrl(value);
      if (url) {
        clean.src = url;
      }
      continue;
    }
    if (value) clean[key] = value;
  }
  return Object.keys(clean).length ? clean : undefined;
}

function sanitizeAttrs(
  attrs: Record<string, unknown> | undefined,
  allowed: Set<string>
): Record<string, unknown> | undefined {
  if (!attrs) return undefined;
  const clean: Record<string, unknown> = {};
  for (const key of allowed) {
    if (attrs[key] !== undefined) {
      clean[key] = attrs[key];
    }
  }
  return Object.keys(clean).length ? clean : undefined;
}

function safeUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (SAFE_PROTOCOLS.includes(url.protocol)) {
      return value;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
