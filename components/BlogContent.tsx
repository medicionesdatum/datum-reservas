import { Fragment, type ReactNode } from "react";

type ContentBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

export function BlogContent({ content }: { content: string }) {
  const blocks = parseContent(content);

  return (
    <div className="blog-article-content">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "heading") {
          return block.level === 2 ? (
            <h2 key={key}>{renderInline(block.text)}</h2>
          ) : (
            <h3 key={key}>{renderInline(block.text)}</h3>
          );
        }

        if (block.type === "quote") {
          return <blockquote key={key}>{renderInline(block.text)}</blockquote>;
        }

        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </List>
          );
        }

        return <p key={key}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}

function parseContent(content: string): ContentBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ContentBlock[] = [];
  let paragraph: string[] = [];

  function flushParagraph() {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith("## ") || line.startsWith("### ")) {
      flushParagraph();
      const level = line.startsWith("### ") ? 3 : 2;
      blocks.push({ type: "heading", level, text: line.replace(/^#{2,3}\s+/, "") });
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      blocks.push({ type: "quote", text: line.slice(2).trim() });
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)/);
    const ordered = line.match(/^\d+\.\s+(.+)/);
    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const items: string[] = [];

      while (index < lines.length) {
        const current = lines[index].trim();
        const match = isOrdered
          ? current.match(/^\d+\.\s+(.+)/)
          : current.match(/^[-*]\s+(.+)/);
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }

      index -= 1;
      blocks.push({ type: "list", ordered: isOrdered, items });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

function renderInline(text: string): ReactNode {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return <strong key={index}>{segment.slice(2, -2)}</strong>;
    }
    return <Fragment key={index}>{segment}</Fragment>;
  });
}
