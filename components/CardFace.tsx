"use client";

import { useEffect, useState } from "react";
import { renderSVG } from "uqr";
import { Cross, Icon } from "@/components/Icon";
import { drawBadge } from "@/lib/badgeArt";
import { WORDS, type Card } from "@/lib/card";

/** The QR as an inline SVG. ECC "M" keeps it readable when a sticker gets a bit scratched. */
function Qr({ url }: { url: string }) {
  return <div className="qr" dangerouslySetInnerHTML={{ __html: renderSVG(url || " ", { ecc: "M", border: 2 }) }} />;
}

/** Wallet-card size (85.6 × 54 mm): prints at real size. */
export function WalletCard({ card, url }: { card: Card; url: string }) {
  const w = WORDS[card.lang];
  const first = card.contacts.find((c) => c.phone.trim());
  return (
    <div className={`wallet t-${card.theme}`}>
      <div className="wallet-top">
        <span className="badge"><Cross className="icon-inline" /> EMERGENCY · आपातकाल</span>
      </div>
      <div className="wallet-body">
        <div className="wallet-info">
          <Icon id={card.avatar} className="avatar" />
          <strong className="wallet-name">{card.name || "Your name"}</strong>
          {card.age && <span className="wallet-small">{w.age}: {card.age}</span>}
          {card.blood && <span className="blood">{w.blood}: <b>{card.blood}</b></span>}
          {first && (
            <span className="wallet-small">
              {w.call} {first.relation || first.name}: <b>{first.phone}</b>
            </span>
          )}
        </div>
        <div className="wallet-qr">
          <Qr url={url} />
          <span>{w.scan}</span>
        </div>
      </div>
    </div>
  );
}

export type BadgeArt = { front: string; back: string } | null;

/**
 * Draws the badge's two sides once (lib/badgeArt.ts: the same pictures as the 3D card in the hero) and turns them
 * into image URLs off the main thread (toBlob), so the preview and the print sheet share one copy.
 */
export function useBadgeArt(card: Card, url: string, photo: HTMLImageElement | null): BadgeArt {
  const [art, setArt] = useState<BadgeArt>(null);
  useEffect(() => {
    let live = true;
    const id = setTimeout(async () => {
      const [f, b] = await Promise.all([drawBadge(card, url, photo, "front"), drawBadge(card, url, photo, "back")]);
      const toUrl = (c: HTMLCanvasElement) => new Promise<string>((ok) => c.toBlob((blob) => ok(URL.createObjectURL(blob!)), "image/png"));
      const next = { front: await toUrl(f), back: await toUrl(b) };
      if (!live) return [next.front, next.back].forEach(URL.revokeObjectURL);
      setArt((prev) => {
        if (prev) [prev.front, prev.back].forEach(URL.revokeObjectURL);
        return next;
      });
    }, 150);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [card, url, photo]);
  return art;
}

/** Lanyard badge (54 × 85.6 mm), front and back. Print, cut out both and glue them back to back (or use a holder). */
export function BadgeCard({ art }: { art: BadgeArt }) {
  return (
    <div className="badge-pair">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {art ? <img className="badge-img" src={art.front} alt="Badge, front" /> : <div className="badge-img" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {art ? <img className="badge-img" src={art.back} alt="Badge, back with the QR code" /> : <div className="badge-img" />}
    </div>
  );
}

/** Round sticker (40 mm) for a helmet, school bag or water bottle. */
export function Sticker({ card, url }: { card: Card; url: string }) {
  return (
    <div className={`sticker t-${card.theme}`}>
      <span className="sticker-text"><Cross className="icon-inline" /> SCAN IN EMERGENCY</span>
      <Qr url={url} />
      <span className="sticker-text"><Icon id={card.avatar} className="icon-inline" /> {card.name || "Your name"}</span>
    </div>
  );
}
