import { Fragment } from "react";

// Renders the Lexical document of a CMS page. Only the node types the editor
// offers are rendered (paragraphs, H2 and H3, bold, italic, links, lists and
// quotes); anything else falls back to its text. Nothing is passed through as
// raw HTML, and link addresses are checked, so stored content cannot inject
// markup or script into the page.

type LexicalNode = {
  type?: string;
  text?: string;
  format?: number | string;
  tag?: string;
  listType?: string;
  fields?: { url?: string; linkType?: string; newTab?: boolean };
  children?: LexicalNode[];
};

const BOLD = 1;
const ITALIC = 2;

/** Internal paths, https, mailto and tel links only. */
function safeHref(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const href = url.trim();
  if (/^\/(?!\/)/.test(href)) return href;
  if (/^(https:\/\/|mailto:|tel:)\S+$/i.test(href)) return href;
  return null;
}

function Children({ nodes }: { nodes?: LexicalNode[] }) {
  return (nodes ?? []).map((node, i) => <Node key={i} node={node} />);
}

function Node({ node }: { node: LexicalNode }) {
  switch (node.type) {
    case "text": {
      const format = typeof node.format === "number" ? node.format : 0;
      let content: React.ReactNode = node.text ?? "";
      if (format & ITALIC) content = <em>{content}</em>;
      if (format & BOLD) content = <strong>{content}</strong>;
      return <>{content}</>;
    }
    case "linebreak":
      return <br />;
    case "paragraph":
      return (
        <p>
          <Children nodes={node.children} />
        </p>
      );
    case "heading": {
      const Tag = node.tag === "h3" ? "h3" : "h2";
      return (
        <Tag>
          <Children nodes={node.children} />
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote>
          <Children nodes={node.children} />
        </blockquote>
      );
    case "list": {
      const Tag = node.listType === "number" ? "ol" : "ul";
      return (
        <Tag>
          <Children nodes={node.children} />
        </Tag>
      );
    }
    case "listitem":
      return (
        <li>
          <Children nodes={node.children} />
        </li>
      );
    case "link": {
      const href = safeHref(node.fields?.url);
      if (!href) return <Children nodes={node.children} />;
      const external = node.fields?.newTab === true;
      return (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          <Children nodes={node.children} />
        </a>
      );
    }
    default:
      return <Children nodes={node.children} />;
  }
}

export function RichText({ data }: { data: unknown }) {
  const root = (data as { root?: LexicalNode } | null)?.root;
  if (!root?.children?.length) return null;
  return (
    <Fragment>
      <Children nodes={root.children} />
    </Fragment>
  );
}
