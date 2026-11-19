import { isIcon, type IconId } from "./icons";

/**
 * One emergency card. It is never stored anywhere: the whole card is packed into the QR link's #fragment
 * (browsers don't send the fragment to the server), so the person who scans it reads it straight from the link.
 */
export type Contact = { name: string; relation: string; phone: string };
export type Card = {
  name: string;
  age: string;
  blood: string;
  allergies: string;
  conditions: string;
  medicines: string;
  notes: string;
  contacts: Contact[];
  doctor: Contact;
  lang: Lang;
  theme: ThemeId;
  avatar: IconId;
};

export const BLOOD = ["", "A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];
export const MAX = { short: 40, long: 140, contacts: 3 };

/** Colours mirror app/globals.css (.t-*); `sky` is the badge's background gradient, top → bottom (lib/badgeArt.ts). */
export const THEMES = {
  space: { label: "Space", ink: "#ffffff", accent: "#ffd166", sky: ["#4a6fb5", "#22336e", "#121a3d"] },
  dino: { label: "Dino", ink: "#1b4332", accent: "#2d6a4f", sky: ["#e9f8ec", "#c7ebd0", "#95d5b2"] },
  ocean: { label: "Ocean", ink: "#023e8a", accent: "#0077b6", sky: ["#e4f8fc", "#bfe9f5", "#90e0ef"] },
  rainbow: { label: "Rainbow", ink: "#3d2c5c", accent: "#ff006e", sky: ["#ffe1e1", "#f4ecff", "#d9f7ff"] },
  classic: { label: "Classic", ink: "#111111", accent: "#e5383b", sky: ["#ffffff", "#f6f6f6", "#ececec"] },
  calm: { label: "Calm", ink: "#1d3557", accent: "#457b9d", sky: ["#f3f8fd", "#e2edf8", "#cfe0f1"] },
} as const;
export type ThemeId = keyof typeof THEMES;

export const emptyCard = (): Card => ({
  name: "",
  age: "",
  blood: "",
  allergies: "",
  conditions: "",
  medicines: "",
  notes: "",
  contacts: [{ name: "", relation: "", phone: "" }],
  doctor: { name: "", relation: "", phone: "" },
  lang: "en",
  theme: "space",
  avatar: "star",
});

// ---- packing into the link: short keys → JSON → deflate-raw → base64url ------------------------------------------

type Packed = [string, string, string, string, string, string, string, [string, string, string][], [string, string], Lang, string, string];

const cut = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "");

function toPacked(c: Card): Packed {
  return [
    cut(c.name, MAX.short), cut(c.age, 12), cut(c.blood, 4),
    cut(c.allergies, MAX.long), cut(c.conditions, MAX.long), cut(c.medicines, MAX.long), cut(c.notes, MAX.long),
    c.contacts.filter((x) => x.phone.trim()).slice(0, MAX.contacts).map((x) => [cut(x.name, MAX.short), cut(x.relation, 20), cut(x.phone, 20)]),
    [cut(c.doctor.name, MAX.short), cut(c.doctor.phone, 20)],
    c.lang, c.theme, c.avatar,
  ];
}

function fromPacked(p: Packed): Card {
  const base = emptyCard();
  const [name, age, blood, allergies, conditions, medicines, notes, contacts, doctor, lang, theme, avatar] = p;
  return {
    name: cut(name, MAX.short), age: cut(age, 12), blood: BLOOD.includes(blood) ? blood : "",
    allergies: cut(allergies, MAX.long), conditions: cut(conditions, MAX.long), medicines: cut(medicines, MAX.long), notes: cut(notes, MAX.long),
    contacts: (Array.isArray(contacts) ? contacts : []).slice(0, MAX.contacts).map((x) => ({ name: cut(x?.[0], MAX.short), relation: cut(x?.[1], 20), phone: cut(x?.[2], 20) })),
    doctor: { name: cut(doctor?.[0], MAX.short), relation: "", phone: cut(doctor?.[1], 20) },
    lang: lang === "hi" ? "hi" : "en",
    theme: theme in THEMES ? (theme as ThemeId) : base.theme,
    avatar: isIcon(avatar) ? avatar : base.avatar, // older links had emojis: those fall back to the default icon
  };
}

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (ch) => ch.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  return new Uint8Array(await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream)).arrayBuffer());
}

export async function encodeCard(c: Card): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(toPacked(c)));
  return b64url(await pipe(json, new CompressionStream("deflate-raw")));
}

/** null when the link is broken or edited by hand */
export async function decodeCard(s: string): Promise<Card | null> {
  try {
    const json = await pipe(unb64url(s), new DecompressionStream("deflate-raw"));
    const p = JSON.parse(new TextDecoder().decode(json));
    return Array.isArray(p) ? fromPacked(p as Packed) : null;
  } catch {
    return null;
  }
}

/** Only digits and a leading + survive, so a tel: link can't become anything else. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

// ---- words on the scanned page and the card ------------------------------------------------------------------------

export type Lang = "en" | "hi";
export const WORDS = {
  en: {
    emergency: "Emergency",
    title: "Emergency information",
    scan: "Scan in an emergency",
    age: "Age",
    blood: "Blood group",
    allergies: "Allergies",
    conditions: "Medical conditions",
    medicines: "Medicines",
    notes: "Other information",
    contacts: "Emergency contacts",
    doctor: "Doctor",
    call: "Call",
    call112: "Call 112 (emergency services)",
    unchecked: "This information was written by the card's owner. Nobody has checked it.",
    broken: "This card's link is broken. Ask the person to make a new card.",
  },
  hi: {
    emergency: "आपातकाल",
    title: "आपातकालीन जानकारी",
    scan: "आपातकाल में स्कैन करें",
    age: "उम्र",
    blood: "रक्त समूह",
    allergies: "एलर्जी",
    conditions: "बीमारियाँ",
    medicines: "दवाइयाँ",
    notes: "अन्य जानकारी",
    contacts: "आपातकालीन संपर्क",
    doctor: "डॉक्टर",
    call: "कॉल करें",
    call112: "112 पर कॉल करें (आपातकालीन सेवा)",
    unchecked: "यह जानकारी कार्ड के मालिक ने लिखी है। किसी ने इसकी जाँच नहीं की है।",
    broken: "इस कार्ड का लिंक टूटा हुआ है। व्यक्ति से नया कार्ड बनाने को कहें।",
  },
} satisfies Record<Lang, Record<string, string>>;
