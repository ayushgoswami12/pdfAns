import { IconFile, IconLock, IconActivity, IconCalculator } from "./icons";

export type MessageBlock =
  | { type: "text"; text: string }
  | { type: "sources"; files: string[] }
  | { type: "label"; text: string }
  | { type: "cards"; items: { icon: "lock" | "activity"; title: string; body: string }[] }
  | { type: "formula"; tex: string }
  | { type: "quote"; text: string };

const cardIcon = { lock: IconLock, activity: IconActivity };

/**
 * Renders a rich assistant answer built from structured blocks — the
 * "Static Friction / Kinetic Friction" cards, the formula box, and the
 * italic source excerpt in the Physics 101 mockup aren't just prose, so
 * they need the backend (or a demo/history entry, as used here) to send
 * this shape rather than a plain string.
 *
 * The live streaming endpoint in this app currently returns raw text
 * chunks, so real answers render as a single `text` block — plain
 * paragraphs, same as before. Structured cards only appear where a
 * message is explicitly built with these blocks (see the "Physics 101"
 * demo history entry in app/chat/page.tsx). To get this UI on live
 * answers, the backend needs to emit this block shape instead of / in
 * addition to raw text.
 */
export default function MessageBlocks({ blocks }: { blocks: MessageBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        if (block.type === "text") {
          return (
            <p key={i} className="text-[15px] leading-relaxed text-gray-100 m-0">
              {block.text}
            </p>
          );
        }
        if (block.type === "sources") {
          return (
            <div key={i} className="flex flex-wrap gap-2">
              {block.files.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lime-400/10 text-lime-300 text-[11.5px] font-medium"
                >
                  <IconFile width={12} height={12} />
                  {f}
                </span>
              ))}
            </div>
          );
        }
        if (block.type === "label") {
          return (
            <span key={i} className="text-[11px] font-bold tracking-[0.1em] uppercase text-lime-400">
              {block.text}
            </span>
          );
        }
        if (block.type === "cards") {
          return (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {block.items.map((c, j) => {
                const Icon = cardIcon[c.icon];
                return (
                  <div key={j} className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-lime-400/10 text-lime-300 flex items-center justify-center">
                        <Icon width={13} height={13} />
                      </span>
                      <span className="text-[13.5px] font-bold text-white">{c.title}</span>
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-gray-400 m-0">{c.body}</p>
                  </div>
                );
              })}
            </div>
          );
        }
        if (block.type === "formula") {
          return (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-black/40 px-6 py-8 relative overflow-hidden">
              <IconCalculator width={40} height={40} className="absolute top-3 right-4 text-white/5" />
              <p className="text-center text-[26px] font-semibold text-white tracking-wide m-0">{block.tex}</p>
            </div>
          );
        }
        if (block.type === "quote") {
          return (
            <p key={i} className="text-[13px] italic text-gray-500 border-l-2 border-zinc-700 pl-4 leading-relaxed m-0">
              {block.text}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}