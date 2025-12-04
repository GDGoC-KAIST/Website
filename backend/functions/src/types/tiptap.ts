export interface TipTapDoc {
  type: "doc";
  content: TipTapNode[];
}

export type TipTapNode =
  | ParagraphNode
  | HeadingNode
  | TextNode
  | HardBreakNode
  | BulletListNode
  | OrderedListNode
  | ListItemNode
  | CodeBlockNode
  | ImageNode;

export interface ParagraphNode {
  type: "paragraph";
  content?: TipTapNode[];
}

export interface HeadingNode {
  type: "heading";
  attrs?: {
    level?: number;
  };
  content?: TipTapNode[];
}

export interface TextNode {
  type: "text";
  text: string;
  marks?: TipTapMark[];
}

export interface HardBreakNode {
  type: "hardBreak";
}

export interface BulletListNode {
  type: "bulletList";
  content?: TipTapNode[];
}

export interface OrderedListNode {
  type: "orderedList";
  attrs?: {
    start?: number;
  };
  content?: TipTapNode[];
}

export interface ListItemNode {
  type: "listItem";
  content?: TipTapNode[];
}

export interface CodeBlockNode {
  type: "codeBlock";
  attrs?: {
    language?: string;
  };
  content?: TipTapNode[];
}

export interface ImageNode {
  type: "image";
  attrs?: {
    src?: string;
    alt?: string;
    title?: string;
  };
}

export type TipTapMark = LinkMark | BoldMark | ItalicMark | CodeMark;

export interface LinkMark {
  type: "link";
  attrs?: {
    href?: string;
    target?: string;
  };
}

export interface BoldMark {
  type: "bold";
}

export interface ItalicMark {
  type: "italic";
}

export interface CodeMark {
  type: "code";
}
