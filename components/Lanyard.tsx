"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A badge hanging from a strap at the top of the screen. Grab it and it follows the pointer around the strap's
 * top point; let go and a damped spring swings it back. A small idle sway keeps it alive. Reduced motion → still.
 * Drawn entirely in CSS/SVG (strap, ring, clip): no image files.
 */
export function Lanyard({ children, strap = 210 }: { children: ReactNode; strap?: number }) {
  const rig = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rig.current;
    if (!el) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let angle = still ? 0 : 0.18; // radians; starts a little off-centre so it swings in
    let vel = 0;
    let dragging = false;
    let grab = 0; // angle offset between the pointer and the badge when grabbed
    let last = performance.now();
    let raf = 0;

    const pivot = () => {
      const r = el.parentElement!.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top };
    };
    const pointerAngle = (e: PointerEvent) => {
      const p = pivot();
      return Math.atan2(-(e.clientX - p.x), Math.max(40, e.clientY - p.y)); // negative: CSS rotate is clockwise
    };
    const clamp = (a: number) => Math.max(-1.1, Math.min(1.1, a));

    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      if (!dragging && !still) {
        const sway = Math.sin(now / 1400) * 0.012; // idle breathing
        const acc = -26 * (angle - sway) - 2.6 * vel; // spring + damping
        vel += acc * dt;
        angle += vel * dt;
      }
      // a little 3D turn while it swings: the card catches the light like a real badge
      el.style.transform = `rotate(${-angle}rad) rotateY(${clamp(vel * 0.25) * 30}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const down = (e: PointerEvent) => {
      if (still) return;
      dragging = true;
      grab = angle - pointerAngle(e);
      el.setPointerCapture(e.pointerId);
      el.classList.add("grabbing");
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const next = clamp(pointerAngle(e) + grab);
      vel = (next - angle) / 0.016;
      angle = next;
    };
    const up = () => {
      dragging = false;
      el.classList.remove("grabbing");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div className="lanyard">
      <div className="lanyard-rig" ref={rig}>
        <div className="strap" style={{ height: strap }} />
        <Clip />
        <div className="lanyard-badge">{children}</div>
      </div>
    </div>
  );
}

/** Metal D-ring and swivel hook. */
function Clip() {
  return (
    <svg className="clip" viewBox="0 0 120 150" aria-hidden="true">
      <defs>
        <linearGradient id="metal" x1="0" x2="1">
          <stop offset="0" stopColor="#8b8f96" />
          <stop offset=".35" stopColor="#f4f5f7" />
          <stop offset=".6" stopColor="#a9adb3" />
          <stop offset="1" stopColor="#5d6168" />
        </linearGradient>
      </defs>
      {/* strap end cap */}
      <rect x="34" y="0" width="52" height="14" rx="2" fill="#b9bcc1" />
      <rect x="34" y="11" width="52" height="3" fill="#7f838a" />
      {/* D-ring */}
      <path d="M26 22 H94 Q100 22 97 30 L68 70 Q60 80 52 70 L23 30 Q20 22 26 22 Z" fill="none" stroke="url(#metal)" strokeWidth="9" strokeLinejoin="round" />
      {/* swivel + hook */}
      <rect x="53" y="72" width="14" height="16" rx="4" fill="url(#metal)" />
      <path d="M60 88 v18 a14 14 0 1 1 -14 14" fill="none" stroke="url(#metal)" strokeWidth="7" strokeLinecap="round" />
      <path d="M60 104 l10 -8" stroke="url(#metal)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
