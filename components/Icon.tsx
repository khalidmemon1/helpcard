import { CROSS, ICONS, PHONE, type IconId } from "@/lib/icons";

/** One of the card icons (lib/icons.ts), in the current text colour. */
export function Icon({ id, className = "icon" }: { id: IconId; className?: string }) {
  const icon = ICONS[id] ?? ICONS.star;
  const line = "stroke" in icon && icon.stroke;
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={icon.d} fill={line ? "none" : "currentColor"} stroke={line ? "currentColor" : "none"} strokeWidth={line ? 2 : 0} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Cross({ className = "icon" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={CROSS} fill="currentColor" />
    </svg>
  );
}

export function Phone({ className = "icon-inline" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PHONE} fill="currentColor" />
    </svg>
  );
}
