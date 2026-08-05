// FILE: components/MarkdownLite.tsx
"use client";

import type { ReactNode } from "react";

// A deliberately small Markdown renderer for chat answers — handles what
// the model actually produces (bold, headings, bullet/numbered lists,
// inline code) without pulling in react-markdown as a dependency. Not a
// general-purpose Markdown engine; if the model starts using tables or
// blockquotes regularly, extend this rather than reach for a library.

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Handles **bold** and `inline code` within a single line/segment.
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i++}`} className="font-bold text-gray-900">
          {match[2]}
        </strong>
      );
    } else if (match[3] !== undefined) {
      nodes.push(
        <code key={`${keyPrefix}-c-${i++}`} className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[13px] font-mono">
          {match[3]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

interface ListItem {
  text: string;
  indent: number;
}

function renderList(items: ListItem[], ordered: boolean, keyPrefix: string): ReactNode {
  // Groups by indent depth so "  - sub point" under "- Main point" nests
  // as a second <ul> inside the parent <li>, matching typical LLM output.
  const Tag = ordered ? "ol" : "ul";
  const topLevel: { item: ListItem; children: ListItem[] }[] = [];

  items.forEach((item) => {
    if (item.indent === 0 || topLevel.length === 0) {
      topLevel.push({ item, children: [] });
    } else {
      topLevel[topLevel.length - 1].children.push(item);
    }
  });

  return (
    <Tag className={`${ordered ? "list-decimal" : "list-disc"} pl-5 space-y-1 my-2`}>
      {topLevel.map(({ item, children }, i) => (
        <li key={`${keyPrefix}-li-${i}`} className="text-[14.5px] leading-relaxed text-gray-900">
          {renderInline(item.text, `${keyPrefix}-${i}`)}
          {children.length > 0 && (
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {children.map((child, j) => (
                <li key={`${keyPrefix}-li-${i}-${j}`} className="text-[14px] leading-relaxed text-gray-700">
                  {renderInline(child.text, `${keyPrefix}-${i}-${j}`)}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </Tag>
  );
}

export default function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Headings: # / ## / ### / ####
    const headingMatch = line.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizeClass =
        level === 1 ? "text-[18px] mt-4 mb-1.5" : level === 2 ? "text-[16.5px] mt-3.5 mb-1.5" : "text-[15px] mt-3 mb-1";
      blocks.push(
        <p key={key++} className={`font-bold text-gray-900 ${sizeClass}`}>
          {renderInline(headingMatch[2], `h${key}`)}
        </p>
      );
      i++;
      continue;
    }

    // Bullet list block
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)/);
    if (bulletMatch) {
      const items: ListItem[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)[-*]\s+(.*)/);
        if (!m) break;
        items.push({ text: m[2], indent: m[1].length >= 4 ? 1 : 0 });
        i++;
      }
      blocks.push(<div key={key++}>{renderList(items, false, `ul${key}`)}</div>);
      continue;
    }

    // Numbered list block
    const numberedMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (numberedMatch) {
      const items: ListItem[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)\d+\.\s+(.*)/);
        if (!m) break;
        items.push({ text: m[2], indent: m[1].length >= 4 ? 1 : 0 });
        i++;
      }
      blocks.push(<div key={key++}>{renderList(items, true, `ol${key}`)}</div>);
      continue;
    }

    // Plain paragraph — collect consecutive non-blank, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^(\s*)[-*]\s+/) &&
      !lines[i].match(/^(\s*)\d+\.\s+/) &&
      !lines[i].match(/^#{1,4}\s+/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="text-[14.5px] leading-relaxed text-gray-900 my-1.5">
        {renderInline(paraLines.join(" "), `p${key}`)}
      </p>
    );
  }

  return <div className="space-y-0.5">{blocks}</div>;
}