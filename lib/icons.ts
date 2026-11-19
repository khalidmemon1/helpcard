/**
 * The little picture next to the name (instead of emojis). 24×24 paths, drawn by components/Icon.tsx (SVG) and by
 * lib/badgeArt.ts (canvas, via Path2D). `stroke` icons are lines, the rest are filled shapes.
 */
export const ICONS = {
  star: { label: "Star", d: "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" },
  heart: { label: "Heart", d: "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 5.3 3 1.7-1.9 3.2-3 5.3-3 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" },
  rocket: { label: "Rocket", d: "M12 2c3 2 5 5.5 5 9.5l2.5 3.5-1 4-3-2H8.5l-3 2-1-4L7 11.5C7 7.5 9 4 12 2zm0 6a2 2 0 1 0 0 4a2 2 0 1 0 0-4zM10 19h4l-2 3z" },
  paw: { label: "Paw", d: "M6.5 7a2 2.6 0 1 0 4 0a2 2.6 0 1 0-4 0M13.5 7a2 2.6 0 1 0 4 0a2 2.6 0 1 0-4 0M3 12a1.8 2.3 0 1 0 3.6 0a1.8 2.3 0 1 0-3.6 0M17.4 12a1.8 2.3 0 1 0 3.6 0a1.8 2.3 0 1 0-3.6 0M12 12c-3 0-6 4.2-6 6.6 0 1.6 1.4 2.4 3 2.4 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.6 0 3-.8 3-2.4 0-2.4-3-6.6-6-6.6z" },
  leaf: { label: "Leaf", d: "M20 4C11 4 5 8.5 5 15c0 1.6.4 3 1.1 4.2C7.5 15 10.5 11.6 15 9.5c-3.8 2.6-6.4 6-7.6 10.1 1.2.6 2.6.9 4.1.9C18 20.5 20 13 20 4z" },
  bolt: { label: "Bolt", d: "M13.5 2L4 13.5h6.5L9.5 22 20 9.5h-6.6z" },
  sun: { label: "Sun", stroke: true, d: "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" },
  moon: { label: "Moon", d: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" },
  music: { label: "Music", d: "M9 18.5a3 3 0 1 1-2-2.83V5l12-2.5v12a3 3 0 1 1-2-2.83V6.9L9 8.6z" },
  shield: { label: "Shield", d: "M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z" },
  ball: { label: "Ball", stroke: true, d: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M3.5 9.5c3 1 5 3.5 5.5 8.5M20.5 9.5c-3 1-5 3.5-5.5 8.5M7 4.5c2 2 7 2 10 0" },
  smile: { label: "Smile", stroke: true, d: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M8.5 14.5c1.8 2 5.2 2 7 0M9 9.5v.5M15 9.5v.5" },
} as const;
export type IconId = keyof typeof ICONS;
export const ICON_IDS = Object.keys(ICONS) as IconId[];
export const isIcon = (v: unknown): v is IconId => typeof v === "string" && v in ICONS;

/** The medical cross used as HelpCard's mark. */
export const CROSS = "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z";

/** Phone handset, for call buttons. */
export const PHONE = "M6.6 2.5h3l1.5 4.5-2.2 1.6a12 12 0 0 0 6.5 6.5l1.6-2.2 4.5 1.5v3a2 2 0 0 1-2 2A17.5 17.5 0 0 1 4.6 4.5a2 2 0 0 1 2-2z";
