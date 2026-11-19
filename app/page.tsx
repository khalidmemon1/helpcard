"use client";

import { useEffect, useState } from "react";
import { BadgeCard, Sticker, WalletCard, useBadgeArt } from "@/components/CardFace";
import { Cross, Icon } from "@/components/Icon";
import { Lanyard } from "@/components/Lanyard";
import { Lanyard3D } from "@/components/Lanyard3D";
import { ICONS, ICON_IDS } from "@/lib/icons";
import { SITE } from "@/lib/site";
import { BLOOD, MAX, THEMES, decodeCard, emptyCard, encodeCard, type Card, type Contact, type ThemeId } from "@/lib/card";

type Format = "badge" | "wallet" | "sticker";
const FORMATS: [Format, string][] = [["badge", "Badge"], ["wallet", "Wallet card"], ["sticker", "Sticker"]];
const FORMAT_HELP: Record<Format, string> = {
  badge: "For a lanyard or bag tag. Print, cut out both sides and glue them back to back.",
  wallet: "Fits a wallet or a school ID holder.",
  sticker: "For a helmet, school bag or water bottle. Prints two per page.",
};

/** The card on the hero's lanyard until you type your own name (then it shows yours, live). */
const SAMPLE: Card = {
  ...emptyCard(),
  name: "Aarav Shah",
  age: "8",
  blood: "B+",
  allergies: "Peanuts",
  conditions: "Asthma",
  medicines: "Inhaler in the front pocket of the bag",
  contacts: [{ name: "Priya Shah", relation: "Mom", phone: "+91 98765 43210" }],
  theme: "space",
  avatar: "rocket",
};

export default function Maker() {
  const [card, setCard] = useState<Card>(emptyCard);
  // optional photo for the badge: stays in this browser, never uploaded, never in the QR or the link
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const pickPhoto = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const img = new Image();
    img.onload = () => setPhoto(img);
    img.src = URL.createObjectURL(file);
  };
  const [code, setCode] = useState("");
  const [sampleCode, setSampleCode] = useState("");
  useEffect(() => {
    encodeCard(SAMPLE).then(setSampleCode);
  }, []);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");
  const [format, setFormat] = useState<Format>("badge");
  const [sheet, setSheet] = useState(false); // phone: preview sheet open

  // an edit link (/#…) opens the card it was made from
  useEffect(() => {
    setOrigin(location.origin);
    const h = location.hash.slice(1);
    if (h) decodeCard(h).then((c) => c && setCard(c));
  }, []);

  // pack the card into the link whenever it changes (the latest change wins)
  useEffect(() => {
    let live = true;
    encodeCard(card).then((c) => live && setCode(c));
    return () => {
      live = false;
    };
  }, [card]);

  const url = code ? `${SITE}/c#${code}` : ""; // what the QR holds
  const previewUrl = code ? `${origin}/c#${code}` : ""; // the same page on this server (works locally too)
  const set = <K extends keyof Card>(k: K, v: Card[K]) => setCard((c) => ({ ...c, [k]: v }));
  const setContact = (i: number, k: keyof Contact, v: string) =>
    setCard((c) => ({ ...c, contacts: c.contacts.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
  const copy = async (text: string, what: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(""), 1800);
  };
  const ready = card.name.trim() && card.contacts.some((c) => c.phone.trim());
  const shareText = `I made a free emergency QR card: blood group, allergies and who to call, in one scan. Nothing is stored online. Make one for your family: ${SITE}`;

  const art = useBadgeArt(card, url, photo); // drawn once, used by the preview and the print sheet
  const mine = card.name.trim() !== "";
  const heroCard = mine ? card : SAMPLE;
  const heroUrl = mine ? url : sampleCode ? `${SITE}/c#${sampleCode}` : "";

  return (
    <>
    <section className="hero">
      <a className="logo" href="#"><Cross className="icon-inline" /> HelpCard</a>
      <div className="hero-stage">
        <Lanyard3D
          card={heroCard}
          url={heroUrl}
          photo={mine ? photo : null}
          fallback={
            <Lanyard>
              <WalletCard card={heroCard} url={heroUrl} />
            </Lanyard>
          }
        />
      </div>
      <div className="hero-copy">
        <h1>A free emergency card, in one scan</h1>
        <p className="lead">
          Blood group, allergies, medicines and who to call, for anyone who finds you. Nothing is stored online:
          everything is inside the QR code.
        </p>
        <a className="primary" href="#make">Make your card</a>
      </div>
      <span className="drag-hint" aria-hidden="true">Drag the card · tap to flip</span>
    </section>

    <main className="maker" id="make">
      <h2 className="maker-title">Make your card</h2>
      <p className="hint maker-sub">Four short steps. It takes a minute and it&apos;s free.</p>

      <div className="editor">
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <Step n={1} title="About the person">
            <Field label="Full name" value={card.name} max={MAX.short} onChange={(v) => set("name", v)} placeholder="e.g. Aarav Shah" autoComplete="name" />
            <div className="row">
              <Field label="Age" optional value={card.age} max={12} onChange={(v) => set("age", v)} placeholder="e.g. 8" inputMode="numeric" />
              <label className="field">
                <span className="field-label">Blood group</span>
                <select value={card.blood} onChange={(e) => set("blood", e.target.value)}>
                  {BLOOD.map((b) => (
                    <option key={b} value={b}>{b || "Not sure"}</option>
                  ))}
                </select>
              </label>
            </div>
          </Step>

          <Step n={2} title="Health" hint="Only what a helper needs to know. Leave anything blank.">
            <Field label="Allergies" optional value={card.allergies} max={MAX.long} onChange={(v) => set("allergies", v)} placeholder="e.g. Peanuts, penicillin" area />
            <Field label="Medical conditions" optional value={card.conditions} max={MAX.long} onChange={(v) => set("conditions", v)} placeholder="e.g. Asthma" area />
            <Field label="Medicines" optional value={card.medicines} max={MAX.long} onChange={(v) => set("medicines", v)} placeholder="e.g. Inhaler in the front pocket of the bag" area />
            <Field label="Anything else" optional value={card.notes} max={MAX.long} onChange={(v) => set("notes", v)} placeholder="e.g. Speaks Gujarati and English" area />
          </Step>

          <Step n={3} title="Who to call" hint="At least one phone number. The first one is printed on the card.">
            {card.contacts.map((c, i) => (
              <div className="contact" key={i}>
                <div className="contact-head">
                  <span>Contact {i + 1}</span>
                  {i > 0 && (
                    <button type="button" className="link" onClick={() => set("contacts", card.contacts.filter((_, j) => j !== i))}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="row">
                  <Field label="Name" value={c.name} max={MAX.short} onChange={(v) => setContact(i, "name", v)} placeholder="e.g. Priya Shah" />
                  <Field label="Relation" value={c.relation} max={20} onChange={(v) => setContact(i, "relation", v)} placeholder="e.g. Mom" />
                </div>
                <Field label="Phone" value={c.phone} max={20} onChange={(v) => setContact(i, "phone", v)} placeholder="e.g. +91 98765 43210" type="tel" inputMode="tel" autoComplete="tel" />
              </div>
            ))}
            {card.contacts.length < MAX.contacts && (
              <button type="button" className="add" onClick={() => set("contacts", [...card.contacts, { name: "", relation: "", phone: "" }])}>
                + Add another contact
              </button>
            )}
            <div className="row">
              <Field label="Doctor" optional value={card.doctor.name} max={MAX.short} onChange={(v) => set("doctor", { ...card.doctor, name: v })} placeholder="e.g. Dr. Mehta" />
              <Field label="Doctor's phone" optional value={card.doctor.phone} max={20} onChange={(v) => set("doctor", { ...card.doctor, phone: v })} placeholder="e.g. +91 …" type="tel" inputMode="tel" />
            </div>
          </Step>

          <Step n={4} title="Make it yours">
            <div className="field">
              <span className="field-label">Theme</span>
              <div className="chips">
                {(Object.keys(THEMES) as ThemeId[]).map((t) => (
                  <button type="button" key={t} className={`chip theme-chip t-${t}`} aria-pressed={card.theme === t} onClick={() => set("theme", t)}>
                    {THEMES[t].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="field-label">Icon</span>
              <div className="chips">
                {ICON_IDS.map((id) => (
                  <button type="button" key={id} className="chip icon-chip" aria-pressed={card.avatar === id} aria-label={ICONS[id].label} title={ICONS[id].label} onClick={() => set("avatar", id)}>
                    <Icon id={id} />
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="field-label">Photo on the badge <em>optional</em></span>
              <div className="chips">
                <label className="chip file-chip">
                  {photo ? "Change photo" : "Add a photo"}
                  <input type="file" accept="image/*" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                </label>
                {photo && (
                  <button type="button" className="chip" onClick={() => setPhoto(null)}>Remove</button>
                )}
              </div>
              <span className="field-help">Stays on this device. It isn&apos;t uploaded or put in the QR code.</span>
            </div>
            <div className="field">
              <span className="field-label">Language of the scanned page</span>
              <div className="segmented">
                <button type="button" aria-pressed={card.lang === "en"} onClick={() => set("lang", "en")}>English</button>
                <button type="button" aria-pressed={card.lang === "hi"} onClick={() => set("lang", "hi")}>हिन्दी</button>
              </div>
            </div>
          </Step>

          <aside className="tips">
            <strong>Making one for a child?</strong>
            <ul>
              <li>Don&apos;t add a home address or school name. A phone number is enough.</li>
              <li>Anyone who scans the card can read it, so only write what a helper needs.</li>
              <li>Show your child the card and tell them when to show it to an adult.</li>
            </ul>
          </aside>
        </form>

        {/* desktop: sticky panel beside the form · phone: a sheet that opens from the bottom bar */}
        <aside className={`preview${sheet ? " open" : ""}`} aria-label="Preview">
          <div className="preview-head">
            <div className="segmented" role="tablist" aria-label="Format">
              {FORMATS.map(([id, label]) => (
                <button type="button" role="tab" key={id} aria-selected={format === id} aria-pressed={format === id} onClick={() => setFormat(id)}>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="sheet-close" aria-label="Close preview" onClick={() => setSheet(false)}>✕</button>
          </div>
          <div className={`preview-stage fmt-${format}`}>
            {format === "badge" && <BadgeCard art={art} />}
            {format === "wallet" && <WalletCard card={card} url={url} />}
            {format === "sticker" && <Sticker card={card} url={url} />}
          </div>
          <p className="field-help center">{FORMAT_HELP[format]}</p>
          <div className="actions stack">
            <button type="button" className="primary" disabled={!ready} onClick={() => print()}>
              Print all formats
            </button>
            <div className="actions">
              <a className={`secondary${ready ? "" : " off"}`} href={ready ? previewUrl : undefined} target="_blank" rel="noreferrer">
                Helper&apos;s view
              </a>
              <button type="button" className="secondary" disabled={!code} onClick={() => copy(`${SITE}/#${code}`, "edit")}>
                {copied === "edit" ? "Copied" : "Copy edit link"}
              </button>
            </div>
          </div>
          {!ready && <p className="field-help center">Add a name and one phone number to print.</p>}
        </aside>
      </div>

      {/* phone: always-visible bar */}
      <div className="mobile-bar">
        <button type="button" className="secondary" onClick={() => setSheet(true)}>Preview</button>
        <button type="button" className="primary" disabled={!ready} onClick={() => print()}>Print</button>
      </div>

      {/* what actually prints: every format, real size (hidden on screen) */}
      <div className="print-sheet" aria-hidden="true">
        <WalletCard card={card} url={url} />
        <BadgeCard art={art} />
        <div className="stickers">
          <Sticker card={card} url={url} />
          <Sticker card={card} url={url} />
        </div>
      </div>

      <section className="aware">
        <h2>Why carry one?</h2>
        <div className="aware-grid">
          <div>
            <b>Help comes faster</b>
            <p>In an accident, the people around you are strangers. A card tells them who to call and what to watch out for.</p>
          </div>
          <div>
            <b>Kids can&apos;t always explain</b>
            <p>A scared child may not remember a phone number or an allergy. The card speaks for them.</p>
          </div>
          <div>
            <b>Your data stays yours</b>
            <p>There&apos;s no account and no database. The information is inside the QR code and nowhere else.</p>
          </div>
        </div>
        <div className="actions">
          <a className="primary" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
            Share on WhatsApp
          </a>
          <button type="button" className="secondary" onClick={() => copy(SITE, "site")}>
            {copied === "site" ? "Copied" : "Copy link to this site"}
          </button>
        </div>
        <p className="hint center">Teachers: print one for every child in your class, and talk about when to show it.</p>
      </section>

      <footer className="foot">
        HelpCard is free. It is not a medical service: in an emergency in India, call 112. Check the card&apos;s details
        yourself, and make a new one when they change.
      </footer>
    </main>
    </>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="step">
      <legend>
        <span className="step-n">{n}</span> {title}
      </legend>
      {hint && <p className="field-help">{hint}</p>}
      {children}
    </fieldset>
  );
}

function Field(props: {
  label: string;
  value: string;
  max: number;
  onChange: (v: string) => void;
  placeholder?: string;
  area?: boolean;
  type?: string;
  optional?: boolean;
  inputMode?: "text" | "numeric" | "tel";
  autoComplete?: string;
}) {
  const common = {
    value: props.value,
    maxLength: props.max,
    placeholder: props.placeholder,
    autoComplete: props.autoComplete ?? "off",
    onChange: (e: { target: { value: string } }) => props.onChange(e.target.value),
  };
  return (
    <label className="field">
      <span className="field-label">
        {props.label} {props.optional && <em>optional</em>}
      </span>
      {props.area ? <textarea rows={2} {...common} /> : <input type={props.type ?? "text"} inputMode={props.inputMode} {...common} />}
    </label>
  );
}
