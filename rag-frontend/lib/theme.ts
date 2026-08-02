// Shared design tokens for the ScholarAI dark/lime UI.
// Import these instead of hardcoding hexes so the whole app stays in sync.

export const ACCENT = "#D7FF3F";
export const ACCENT_SOFT = "#B9E62E";
export const ACCENT_GRADIENT = "linear-gradient(135deg, #E4FF6E 0%, #B9E62E 100%)";

// Secondary "light lavender" chip used for a few surface-level actions
// (Share Session, item-count pills) — distinct from the lime brand accent
// so it doesn't compete with primary CTAs. Seen in the Sources mockup.
export const LAVENDER_CHIP = "bg-[#E7E4FF] text-[#2B2470] hover:bg-[#DCD8FF]";

// Neutral dark badge for status labels (PROCESSED, N SOURCES ACTIVE).
export const NEUTRAL_BADGE = "bg-zinc-900 border border-zinc-700 text-gray-300";

export const ICON_BTN =
  "flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed";

export const PANEL_BTN =
  "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm text-gray-300 text-[13px] font-medium transition-all duration-200 hover:bg-zinc-900 hover:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";

export const CARD =
  "bg-zinc-900/70 border border-zinc-800 rounded-3xl";