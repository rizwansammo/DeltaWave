import type { Page } from "@/payload-types";
import type { PrivacyBlock, PrivacyInline } from "./pages-approved";

// Builds the Lexical document that Payload's rich text editor stores, from
// the simple block list the approved privacy notice is written in. Used by
// the seed and by the markup test, so what is seeded is what the page renders.

type LexicalNode = Record<string, unknown>;

const textNode = (text: string): LexicalNode => ({
  type: "text",
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  text,
  version: 1,
});

const block = (type: string, children: LexicalNode[], extra: LexicalNode = {}): LexicalNode => ({
  type,
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  version: 1,
  ...extra,
});

const inline = (part: PrivacyInline): LexicalNode => {
  if (typeof part === "string") return textNode(part);
  if ("br" in part) return { type: "linebreak", version: 1 };
  return block("link", [textNode(part.text)], {
    version: 3,
    fields: { linkType: "custom", newTab: false, url: part.href },
  });
};

export function toLexical(blocks: PrivacyBlock[]): NonNullable<Page["body"]> {
  return {
    root: block(
      "root",
      blocks.map((item) =>
        "h2" in item
          ? block("heading", [textNode(item.h2)], { tag: "h2" })
          : block("paragraph", item.p.map(inline), { textFormat: 0, textStyle: "" }),
      ),
    ),
  } as NonNullable<Page["body"]>;
}
