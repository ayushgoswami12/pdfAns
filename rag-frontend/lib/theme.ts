// Shared design tokens for the ScholarAI light/violet UI.
// Import these instead of hardcoding hexes so the whole app stays in sync.

export const ACCENT = "#7C5CFC";
export const ACCENT_SOFT = "#6D46EA";
export const ACCENT_GRADIENT = "linear-gradient(135deg, #9C8CFF 0%, #6D46EA 100%)";

// Secondary "light lavender" chip used for a few surface-level actions
// (Share Session, item-count pills) — distinct from the violet brand accent
// so it doesn't compete with primary CTAs. Seen in the Sources mockup.
export const LAVENDER_CHIP = "bg-[#E7E4FF] text-[#2B2470] hover:bg-[#DCD8FF]";

// Neutral badge for status labels (PROCESSED, N SOURCES ACTIVE).
export const NEUTRAL_BADGE = "bg-gray-50 border border-gray-300 text-gray-700";

export const ICON_BTN =
  "flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed";

export const PANEL_BTN =
  "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 backdrop-blur-sm text-gray-700 text-[13px] font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";

export const CARD =
  "bg-gray-50/80 border border-gray-200 rounded-3xl";