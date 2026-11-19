"""HelpCard logo v2: badge symbol + General Sans 500 wordmark as outlines, in brand colours."""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import os

HERE = os.path.dirname(os.path.abspath(__file__))
NAVY, INK, PAGE, WHITE = "#22336e", "#000000", "#d6d8dc", "#ffffff"

# ---- symbol (256 grid): card, lanyard slot, plus. More air than v1. ----
CARD = "M92 20H164A28 28 0 0 1 192 48V208A28 28 0 0 1 164 236H92A28 28 0 0 1 64 208V48A28 28 0 0 1 92 20Z"
SLOT = "M114 42H142A6 6 0 0 1 142 54H114A6 6 0 0 1 114 42Z"
PLUS = "M112 104h32v28h28v32h-28v28h-32v-28h-28v-32h28z"


def symbol(card_fill, cut_fill=None):
    """cut_fill None = slot and plus are real holes (one-colour use)."""
    if cut_fill is None:
        return f'<path fill="{card_fill}" fill-rule="evenodd" d="{CARD} {SLOT} {PLUS}"/>'
    return f'<path fill="{card_fill}" d="{CARD}"/><path fill="{cut_fill}" d="{SLOT} {PLUS}"/>'


# ---- wordmark: "HelpCard" outlined from General Sans 500, tracking -1.5% ----
font = TTFont(os.path.join(HERE, "..", "framer-assets", "SB2OEB6IKZPRR6JT4GFJ2TFT6HBB6AZN.woff2"))
gs, cmap, upm = font.getGlyphSet(), font.getBestCmap(), font["head"].unitsPerEm
cap = font["OS/2"].sCapHeight or 700


def wordmark(text, cap_px, x0, baseline):
    s = cap_px / cap
    pen = SVGPathPen(gs)
    x = 0
    for ch in text:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x0 + x * s, baseline)))
        x += gs[g].width - 0.015 * upm
    return pen.getCommands(), (x * s)


def svg(w, h, body, bg=None, title="HelpCard"):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><title>{title}</title>{rect}{body}</svg>\n'


def write(name, content):
    open(os.path.join(HERE, name), "w", encoding="utf-8").write(content)


# symbol files
write("symbol-black.svg", svg(256, 256, symbol(INK)))
write("symbol-navy.svg", svg(256, 256, symbol(NAVY, WHITE)))
write("symbol-white.svg", svg(256, 256, symbol(WHITE, NAVY), bg=NAVY))

# horizontal lockup: symbol 256 tall, gap 64, cap height = plus height (88) * 1.0 → aligned to the plus
CAP = 96
d, wlen = wordmark("HelpCard", CAP, 256 + 56, 128 + CAP / 2 + 6)
W = int(256 + 56 + wlen + 40)
write("lockup-black.svg", svg(W, 256, symbol(INK) + f'<path fill="{INK}" d="{d}"/>'))
write("lockup-color.svg", svg(W, 256, symbol(NAVY, WHITE) + f'<path fill="{INK}" d="{d}"/>'))
write("lockup-on-navy.svg", svg(W, 256, symbol(WHITE, NAVY) + f'<path fill="{WHITE}" d="{d}"/>', bg=NAVY))
write("lockup-on-page.svg", svg(W, 256, symbol(NAVY, WHITE) + f'<path fill="{INK}" d="{d}"/>', bg=PAGE))
print("lockup width", W)
