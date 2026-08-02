// Shared icon set. Kept as thin inline SVGs (no icon-library dependency)
// so these drop into any Next.js project without an extra install.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string; width?: number; height?: number };

const base = (props: IconProps) => ({
  xmlns: "http://www.w3.org/2000/svg",
  width: props.width ?? 18,
  height: props.height ?? 18,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: props.className ?? "",
  "aria-hidden": true as const,
});

export function IconDiamond(props: IconProps) {
  return (
    <svg {...base(props)} strokeWidth={2.5}>
      <path d="M2 12L12 2l10 10-10 10Z" />
    </svg>
  );
}
export function IconClose(props: IconProps) {
  return (
    <svg {...base({ width: 20, height: 20, ...props })}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
export function IconPlus(props: IconProps) {
  return (
    <svg {...base({ width: 18, height: 18, ...props })} strokeWidth={2.5}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
export function IconChevronDown(props: IconProps) {
  return (
    <svg {...base({ width: 14, height: 14, ...props })} strokeWidth={2.5}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base({ width: 14, height: 14, ...props })} strokeWidth={2.5}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}
export function IconFile(props: IconProps) {
  return (
    <svg {...base({ width: 16, height: 16, ...props })}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
export function IconTrash(props: IconProps) {
  return (
    <svg {...base({ width: 14, height: 14, ...props })}>
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
export function IconMessage(props: IconProps) {
  return (
    <svg {...base({ width: 16, height: 16, ...props })}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
export function IconUpload(props: IconProps) {
  return (
    <svg {...base({ width: 16, height: 16, ...props })}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
export function IconUploadCloud(props: IconProps) {
  return (
    <svg {...base({ width: 20, height: 20, ...props })}>
      <path d="M16 16l-4-4-4 4" /><path d="M12 12v9" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}
export function IconClip(props: IconProps) {
  return (
    <svg {...base({ width: 20, height: 20, ...props })}>
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
export function IconSend(props: IconProps) {
  return (
    <svg {...base({ width: 18, height: 18, ...props })} strokeWidth={2.5}>
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
export function IconMenu(props: IconProps) {
  return (
    <svg {...base({ width: 20, height: 20, ...props })} strokeWidth={2.5}>
      <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
export function IconHome(props: IconProps) {
  return (
    <svg {...base({ width: 18, height: 18, ...props })}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
export function IconSettings(props: IconProps) {
  return (
    <svg {...base({ width: 18, height: 18, ...props })}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
export function IconSearch(props: IconProps) {
  return (
    <svg {...base({ width: 16, height: 16, ...props })}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
export function IconLink(props: IconProps) {
  return (
    <svg {...base({ width: 16, height: 16, ...props })}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
export function IconLock(props: IconProps) {
  return (
    <svg {...base({ width: 16, height: 16, ...props })}>
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
export function IconActivity(props: IconProps) {
  // Stand-in for "kinetic" motion — a runner glyph reads ambiguous at 16px,
  // an activity/motion pulse communicates "in motion" more reliably.
  return (
    <svg {...base({ width: 16, height: 16, ...props })}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
export function IconCalculator(props: IconProps) {
  return (
    <svg {...base({ width: 16, height: 16, ...props })}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="11" x2="8" y2="11" /><line x1="12" y1="11" x2="12" y2="11" /><line x1="16" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="8" y2="15" /><line x1="12" y1="15" x2="12" y2="15" /><line x1="16" y1="15" x2="16" y2="15" />
      <line x1="8" y1="19" x2="8" y2="19" /><line x1="12" y1="19" x2="12" y2="19" /><line x1="16" y1="19" x2="16" y2="19" />
    </svg>
  );
}
export function IconThumbsUp(props: IconProps) {
  return (
    <svg {...base({ width: 15, height: 15, ...props })}>
      <path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}
export function IconThumbsDown(props: IconProps) {
  return (
    <svg {...base({ width: 15, height: 15, ...props })}>
      <path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  );
}
export function IconCopy(props: IconProps) {
  return (
    <svg {...base({ width: 15, height: 15, ...props })}>
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
export function IconShare(props: IconProps) {
  return (
    <svg {...base({ width: 15, height: 15, ...props })}>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
export function IconBell(props: IconProps) {
  return (
    <svg {...base({ width: 17, height: 17, ...props })}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
export function IconMic(props: IconProps) {
  return (
    <svg {...base({ width: 17, height: 17, ...props })}>
      <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}
export function IconGlobe(props: IconProps) {
  return (
    <svg {...base({ width: 13, height: 13, ...props })}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
export function IconNotepad(props: IconProps) {
  return (
    <svg {...base({ width: 13, height: 13, ...props })}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}
export function IconMoreHorizontal(props: IconProps) {
  return (
    <svg {...base({ width: 16, height: 16, ...props })}>
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  );
}
export function IconHelp(props: IconProps) {
  return (
    <svg {...base({ width: 15, height: 15, ...props })}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12" y2="17" />
    </svg>
  );
}
export function IconWipe(props: IconProps) {
  return (
    <svg {...base({ width: 13, height: 13, ...props })}>
      <path d="M15.14 3a2 2 0 0 1 2.83 0l2.03 2.03a2 2 0 0 1 0 2.83L8.66 19.2a2 2 0 0 1-1.41.59H4v-3.25a2 2 0 0 1 .59-1.41Z" />
      <line x1="13" y1="5" x2="19" y2="11" />
    </svg>
  );
}