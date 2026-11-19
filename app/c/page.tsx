"use client";

import { useEffect, useState } from "react";
import { Icon, Phone } from "@/components/Icon";
import { WORDS, decodeCard, telHref, type Card, type Lang } from "@/lib/card";

/** What a helper sees after scanning: read from the link's #fragment, never from a server. */
export default function Scanned() {
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const read = () =>
      decodeCard(location.hash.slice(1)).then((c) => {
        setCard(c);
        if (c) setLang(c.lang);
      });
    read();
    // a second card opened in the same tab only changes the #fragment, which doesn't reload the page
    addEventListener("hashchange", read);
    return () => removeEventListener("hashchange", read);
  }, []);

  const w = WORDS[lang];
  if (card === undefined) return <main className="scan" />;
  if (!card)
    return (
      <main className="scan">
        <p className="scan-broken">{w.broken}</p>
        <a className="call big" href="tel:112">{w.call112}</a>
      </main>
    );

  const rows: [string, string][] = [
    [w.allergies, card.allergies],
    [w.conditions, card.conditions],
    [w.medicines, card.medicines],
    [w.notes, card.notes],
  ];
  return (
    <main className="scan">
      <div className="scan-top">
        <span>+ {w.title}</span>
        <button className="lang" onClick={() => setLang(lang === "en" ? "hi" : "en")}>
          {lang === "en" ? "हिन्दी" : "English"}
        </button>
      </div>

      <div className="scan-card">
        <div className="scan-who">
          <span className={`avatar big t-${card.theme}`}><Icon id={card.avatar} /></span>
          <div>
            <h1>{card.name}</h1>
            {card.age && <p>{w.age}: {card.age}</p>}
          </div>
        </div>
        {card.blood && (
          <p className="scan-blood">
            {w.blood} <b>{card.blood}</b>
          </p>
        )}
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div className="scan-row" key={k}>
            <span>{k}</span>
            <p>{v}</p>
          </div>
        ))}
      </div>

      <h2 className="scan-h">{w.contacts}</h2>
      <div className="scan-calls">
        {card.contacts.map((c, i) => (
          <a className="call" key={i} href={telHref(c.phone)}>
            <span>{[c.name, c.relation && `(${c.relation})`].filter(Boolean).join(" ") || c.phone}</span>
            <b><Phone /> {w.call} {c.phone}</b>
          </a>
        ))}
        {card.doctor.phone && (
          <a className="call" href={telHref(card.doctor.phone)}>
            <span>{w.doctor} {card.doctor.name}</span>
            <b><Phone /> {w.call} {card.doctor.phone}</b>
          </a>
        )}
        <a className="call big" href="tel:112"><Phone /> {w.call112}</a>
      </div>
      <p className="scan-note">{w.unchecked}</p>
    </main>
  );
}
