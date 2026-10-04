#!/usr/bin/env python3
"""Generate the cut-paper art used by the web app and the Flutter app.

One source of truth for both apps. Every shape is a single-colour silhouette;
each app tints it with a design token at runtime, so dark mode needs no second
art set.

Output:
  src/components/paper/art.ts                                   (web, SVG path data)
  ../360-flatmates/lib/features/shared/presentation/paper/paper_art.dart (Flutter, op-codes)

Run: python3 scripts/generate-paper-art.py
"""

from __future__ import annotations

import math
import random
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB_OUT = ROOT / "src/components/paper/art.ts"
DART_OUT = ROOT.parent / "360-flatmates/lib/features/shared/presentation/paper/paper_art.dart"

# Op-codes shared with the Dart decoder: 0 moveTo, 1 lineTo, 2 cubicTo, 3 close.
M, L, C, Z = 0, 1, 2, 3


class Shape:
    def __init__(self, w: float, h: float, even_odd: bool = False):
        self.w, self.h, self.even_odd = w, h, even_odd
        self.ops: list[tuple] = []

    def move(self, x, y):
        self.ops.append((M, x, y))

    def line(self, x, y):
        self.ops.append((L, x, y))

    def cubic(self, x1, y1, x2, y2, x, y):
        self.ops.append((C, x1, y1, x2, y2, x, y))

    def close(self):
        self.ops.append((Z,))

    # -- primitives --------------------------------------------------------
    def poly(self, pts):
        self.move(*pts[0])
        for p in pts[1:]:
            self.line(*p)
        self.close()

    def rect(self, x, y, w, h, rnd: random.Random | None = None, j=0.6):
        """Rectangle with hand-cut corners (tiny corner jitter)."""
        jit = (lambda: rnd.uniform(-j, j)) if rnd else (lambda: 0.0)
        self.poly([
            (x + jit(), y + jit()),
            (x + w + jit(), y + jit()),
            (x + w + jit(), y + h + jit()),
            (x + jit(), y + h + jit()),
        ])

    def circle(self, cx, cy, r, ccw=False):
        k = 0.5523 * r
        if not ccw:
            self.move(cx + r, cy)
            self.cubic(cx + r, cy + k, cx + k, cy + r, cx, cy + r)
            self.cubic(cx - k, cy + r, cx - r, cy + k, cx - r, cy)
            self.cubic(cx - r, cy - k, cx - k, cy - r, cx, cy - r)
            self.cubic(cx + k, cy - r, cx + r, cy - k, cx + r, cy)
        else:
            self.move(cx + r, cy)
            self.cubic(cx + r, cy - k, cx + k, cy - r, cx, cy - r)
            self.cubic(cx - k, cy - r, cx - r, cy - k, cx - r, cy)
            self.cubic(cx - r, cy + k, cx - k, cy + r, cx, cy + r)
            self.cubic(cx + k, cy + r, cx + r, cy + k, cx + r, cy)
        self.close()

    def smooth_closed_bottom(self, pts):
        """Catmull-Rom curve through pts, then down to the bottom edge."""
        self.move(pts[0][0], pts[0][1])
        for i in range(len(pts) - 1):
            p0 = pts[i - 1] if i > 0 else pts[i]
            p1, p2 = pts[i], pts[i + 1]
            p3 = pts[i + 2] if i + 2 < len(pts) else p2
            c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
            c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
            self.cubic(*c1, *c2, *p2)
        self.line(self.w, self.h)
        self.line(0, self.h)
        self.close()

    # -- output ------------------------------------------------------------
    def svg_d(self) -> str:
        out = []
        for op in self.ops:
            code, *v = op
            v = [f"{n:.1f}".rstrip("0").rstrip(".") for n in v]
            out.append({M: "M", L: "L", C: "C", Z: "Z"}[code] + " ".join(v))
        return "".join(out)

    def dart_ops(self) -> str:
        flat = []
        for op in self.ops:
            flat.append(str(op[0]))
            flat += [f"{n:.1f}" for n in op[1:]]
        return ",".join(flat)


def hills(w, h, base, waves, step, seed, jitter=1.2):
    rnd = random.Random(seed)
    s = Shape(w, h)
    pts = []
    x = 0.0
    while x <= w + 0.01:
        y = base + sum(a * math.sin(x / p + ph) for a, p, ph in waves) + rnd.uniform(-jitter, jitter)
        pts.append((round(x, 1), y))
        x += step
    s.smooth_closed_bottom(pts)
    return s


def skyline(w, h, seed=7, hscale=1.0, gaps=(0, 0, 6, 10), start=0.0, windows=True, ground=None):
    """Rooftop town: flat roofs, water tanks, stair boxes, one chhatri dome.

    Windows and doors are holes (even-odd), so the page shows through.
    """
    rnd = random.Random(seed)
    s = Shape(w, h, even_odd=True)
    win = Shape(w, h)  # the same window rects, filled: drawn behind to light them
    ground = h if ground is None else ground
    x = start
    idx = seed
    specs = [
        # (width, height, tank, stairbox, dome)
        (70, 96, True, False, False), (58, 128, False, True, False), (90, 84, True, False, False),
        (64, 150, True, True, False), (82, 104, False, False, True), (54, 76, True, False, False),
        (76, 138, False, True, False), (96, 92, True, False, False), (60, 118, True, False, False),
        (84, 160, False, True, False), (70, 88, True, False, False), (58, 124, False, False, False),
        (92, 100, True, True, False), (66, 142, True, False, False), (80, 82, False, False, False),
    ]
    while x < w:
        bw, bh, tank, stair, dome = specs[idx % len(specs)]
        bh = bh * hscale
        bw = min(bw, w - x)
        top = ground - bh
        s.rect(x, top, bw + 0.8, bh, rnd)
        # parapet step on the roof edge
        s.rect(x + 3, top - 5, bw - 6, 5.5, rnd, 0.3)
        if tank and bw > 40:
            tx = x + bw * rnd.uniform(0.18, 0.55)
            s.rect(tx + 2, top - 13, 3, 9, rnd, 0.2)          # stand leg
            s.rect(tx + 13, top - 13, 3, 9, rnd, 0.2)
            s.rect(tx, top - 29, 18, 17, rnd, 0.3)           # tank body
            s.rect(tx + 5, top - 32, 8, 3.5, rnd, 0.2)       # lid
        if stair and bw > 40:
            sx = x + bw - 26
            s.rect(sx, top - 24, 20, 20, rnd, 0.3)
        if dome:
            cx = x + bw / 2
            r = 17
            s.move(cx - r, top - 4)
            s.cubic(cx - r, top - 4 - r * 1.3, cx + r, top - 4 - r * 1.3, cx + r, top - 4)
            s.close()
            s.rect(cx - 1.2, top - 4 - r * 1.25, 2.4, 9, rnd, 0.1)  # finial
        # window holes: a loose grid, some lights "off" (filled)
        if not windows:
            x += bw + rnd.choice(gaps)
            idx += 1
            continue
        cols = max(1, int((bw - 16) // 18))
        rows = max(1, int((bh - 34) // 24))
        for r_ in range(rows):
            for c_ in range(cols):
                if rnd.random() < 0.28:
                    continue
                wx = x + 10 + c_ * 18
                wy = top + 12 + r_ * 24
                s.rect(wx, wy, 9, 12, rnd, 0.4)
                win.rect(wx - 0.5, wy - 0.5, 10, 13)
        if bw > 50 and rnd.random() < 0.6:
            s.rect(x + bw / 2 - 7, ground - 22, 14, 22.5, rnd, 0.3)  # door
        x += bw + rnd.choice(gaps)
        idx += 1
    return s, win


def peepal(w, h, cx, base, scale, seed=11):
    """Tree: trunk plus a canopy of overlapping discs (non-zero union)."""
    rnd = random.Random(seed)
    s = Shape(w, h)
    t = scale
    s.poly([(cx - 5 * t, base), (cx - 3 * t, base - 40 * t), (cx - 12 * t, base - 58 * t),
            (cx - 9 * t, base - 60 * t), (cx, base - 48 * t), (cx + 8 * t, base - 64 * t),
            (cx + 11 * t, base - 62 * t), (cx + 3 * t, base - 42 * t), (cx + 5 * t, base)])
    for dx, dy, r in [(-26, -70, 22), (0, -84, 28), (26, -72, 22), (-14, -96, 20), (16, -100, 19),
                      (-36, -58, 14), (38, -60, 14), (0, -62, 18)]:
        s.circle(cx + dx * t + rnd.uniform(-1, 1), base + dy * t + rnd.uniform(-1, 1), r * t)
    return s


def cloud(w, h, x, y, scale):
    s = Shape(w, h)
    t = scale
    for dx, dy, r in [(0, 0, 18), (22, -10, 24), (48, -4, 20), (68, 4, 14)]:
        s.circle(x + dx * t, y + dy * t, r * t)
    s.rect(x - 4 * t, y, 78 * t, 18 * t)
    return s


def sun(w, h, cx, cy, r, petals=18):
    """Marigold sun: a disc with a scalloped petal edge."""
    s = Shape(w, h)
    step = 2 * math.pi / petals
    s.move(cx + r, cy)
    for i in range(petals):
        a0, a1 = i * step, (i + 1) * step
        am = (a0 + a1) / 2
        ro = r * 1.16
        s.cubic(cx + ro * math.cos(a0 + step * 0.15), cy + ro * math.sin(a0 + step * 0.15),
                cx + ro * math.cos(am + step * 0.35), cy + ro * math.sin(am + step * 0.35),
                cx + r * math.cos(a1), cy + r * math.sin(a1))
    s.close()
    return s


def moon(w, h, cx, cy, r):
    """Crescent moon for the night scene: the outer disc minus an offset disc."""
    d = r * 0.55  # offset of the cutting disc (up and to the right)
    ox, oy = cx + d, cy - d * 0.45
    r2 = r * 0.86
    # Intersections of the two circles.
    dx, dy = ox - cx, oy - cy
    dist = math.hypot(dx, dy)
    a = (r * r - r2 * r2 + dist * dist) / (2 * dist)
    hh = math.sqrt(max(r * r - a * a, 0))
    mx, my = cx + a * dx / dist, cy + a * dy / dist
    p1 = (mx + hh * dy / dist, my - hh * dx / dist)
    p2 = (mx - hh * dy / dist, my + hh * dx / dist)
    path = (f"M{p1[0]:.2f} {p1[1]:.2f}A{r} {r} 0 1 0 {p2[0]:.2f} {p2[1]:.2f}"
            f"A{r2:.2f} {r2:.2f} 0 0 1 {p1[0]:.2f} {p1[1]:.2f}Z")
    return svg_path(path, w, h, even_odd=False)


def stars(w, h, pts, seed=17):
    """Four-point paper sparkles scattered over the night sky."""
    rnd = random.Random(seed)
    s = Shape(w, h)
    for x, y, r in pts:
        k = r * 0.28
        j = rnd.uniform(-0.2, 0.2)
        s.poly([(x, y - r), (x + k, y - k + j), (x + r, y), (x + k, y + k), (x, y + r), (x - k, y + k), (x - r, y), (x - k, y - k)])
    return s


def towers(w, h, seed=21, ground=None):
    """Glass-tower city (Gurugram): tall slabs with a tight grid of window holes."""
    rnd = random.Random(seed)
    s = Shape(w, h, even_odd=True)
    win = Shape(w, h)
    ground = h if ground is None else ground
    specs = [(44, 138), (28, 88), (52, 164), (36, 112), (58, 126), (32, 150), (46, 100), (38, 132), (54, 118)]
    x, i = 4.0, 0
    while x < w - 12:
        bw, bh = specs[i % len(specs)]
        bh *= rnd.uniform(0.92, 1.04)
        bw = min(bw, w - x)
        top = ground - bh
        s.rect(x, top, bw, bh + 0.5, rnd, 0.4)
        if i % 3 == 0 and bw > 30:
            s.rect(x + bw * 0.3, top - 10, bw * 0.4, 10.5, rnd, 0.2)  # rooftop crown
            s.rect(x + bw * 0.5 - 1, top - 22, 2, 12.5, rnd, 0.1)     # mast
        cols = max(1, int((bw - 8) // 9))
        rows = max(1, int((bh - 16) // 12))
        for r_ in range(rows):
            for c_ in range(cols):
                if rnd.random() < 0.34:
                    continue
                wx, wy = x + 5 + c_ * 9, top + 9 + r_ * 12
                s.rect(wx, wy, 5, 7, rnd, 0.2)
                win.rect(wx - 0.4, wy - 0.4, 5.8, 7.8)
        x += bw + rnd.choice((2, 4, 8, 14))
        i += 1
    return s, win


def torn_edge(seed=5, n=24):
    """One 120-unit torn-paper tile, normalised to 0..1 on both axes.

    Returned as points; each app repeats the tile along any edge length.
    First and last y match so tiles join without a seam.
    """
    rnd = random.Random(seed)
    ys = [rnd.uniform(0.15, 1.0) for _ in range(n)]
    ys[-1] = ys[0]
    return [(i / (n - 1), round(y, 3)) for i, y in enumerate(ys)]


# -- props (160 x 160) ------------------------------------------------------
def prop_house():
    rnd = random.Random(21)
    s = Shape(160, 160, even_odd=True)
    s.rect(28, 58, 104, 94, rnd)                 # body
    s.rect(24, 52, 112, 8, rnd, 0.3)             # roof slab
    s.rect(86, 30, 22, 20, rnd)                  # water tank
    s.rect(90, 26, 14, 5, rnd, 0.2)
    s.rect(88, 49, 3, 4, rnd, 0.1)
    s.rect(103, 49, 3, 4, rnd, 0.1)
    s.rect(38, 30, 26, 22, rnd)                  # stair box
    for wx, wy in [(40, 72), (72, 72), (104, 72), (40, 104), (104, 104)]:
        s.rect(wx, wy, 16, 20, rnd, 0.4)         # windows (holes)
    s.rect(70, 110, 20, 42.5, rnd, 0.3)          # door (hole)
    return s


def prop_chat():
    s = Shape(160, 160, even_odd=True)
    s.move(38, 30)
    s.line(122, 30)
    s.cubic(134, 30, 142, 38, 142, 50)
    s.line(142, 96)
    s.cubic(142, 108, 134, 116, 122, 116)
    s.line(70, 116)
    s.line(44, 138)
    s.line(50, 116)
    s.line(38, 116)
    s.cubic(26, 116, 18, 108, 18, 96)
    s.line(18, 50)
    s.cubic(18, 38, 26, 30, 38, 30)
    s.close()
    for cx in (52, 80, 108):
        s.circle(cx, 73, 7, ccw=True)
    return s


def prop_heart():
    s = Shape(160, 160)
    s.move(80, 140)
    s.cubic(46, 116, 16, 90, 16, 60)
    s.cubic(16, 36, 34, 22, 54, 22)
    s.cubic(66, 22, 75, 28, 80, 38)
    s.cubic(85, 28, 94, 22, 106, 22)
    s.cubic(126, 22, 144, 36, 144, 60)
    s.cubic(144, 90, 114, 116, 80, 140)
    s.close()
    return s


def prop_magnifier():
    s = Shape(160, 160, even_odd=True)
    s.circle(68, 66, 44)
    s.circle(68, 66, 30, ccw=True)
    # handle: rotated rectangle along 45 degrees
    a = math.radians(45)
    ux, uy = math.cos(a), math.sin(a)
    px, py = -uy, ux
    x0, y0 = 68 + 40 * ux, 66 + 40 * uy
    ln, hw = 58, 9
    s.poly([(x0 + px * hw, y0 + py * hw), (x0 + ux * ln + px * hw, y0 + uy * ln + py * hw),
            (x0 + ux * ln - px * hw, y0 + uy * ln - py * hw), (x0 - px * hw, y0 - py * hw)])
    return s


def prop_rain_cloud():
    s = Shape(160, 160)
    for dx, dy, r in [(46, 72, 24), (76, 56, 32), (110, 70, 26)]:
        s.circle(dx, dy, r)
    s.rect(26, 72, 110, 26)
    for dx in (48, 80, 112):
        s.move(dx, 110)
        s.cubic(dx + 7, 122, dx + 8, 128, dx, 134)
        s.cubic(dx - 8, 128, dx - 7, 122, dx, 110)
        s.close()
    return s


def prop_bell():
    s = Shape(160, 160)
    s.move(80, 20)
    s.cubic(88, 20, 92, 26, 92, 32)
    s.cubic(114, 38, 124, 58, 124, 84)
    s.line(124, 104)
    s.line(138, 120)
    s.line(22, 120)
    s.line(36, 104)
    s.line(36, 84)
    s.cubic(36, 58, 46, 38, 68, 32)
    s.cubic(68, 26, 72, 20, 80, 20)
    s.close()
    s.circle(80, 134, 12)
    return s


# -- SVG path parser (for hand-drawn icons) --------------------------------
def svg_path(d: str, w: float, h: float, even_odd: bool = True) -> Shape:
    """Parse an SVG path `d` (M L H V C S A Z, absolute or relative) into a
    Shape. Arcs become cubic curves, so the Dart decoder stays tiny."""
    import re as _re
    tokens = _re.findall(r"[MmLlHhVvCcSsAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?", d)
    s = Shape(w, h, even_odd=even_odd)
    i = 0
    cmd = ""
    x = y = sx = sy = 0.0
    last_c2 = None  # second control point of the previous cubic (for S)

    def num():
        nonlocal i
        v = float(tokens[i])
        i += 1
        return v

    def flag():
        # Arc flags may be packed ("10" = large-arc 1, sweep 0).
        nonlocal i
        t = tokens[i]
        if len(t) > 1 and t[0] in "01" and not t.startswith("0."):
            tokens[i] = t[1:]
            return float(t[0])
        i += 1
        return float(t)

    while i < len(tokens):
        if _re.match(r"[A-Za-z]", tokens[i]):
            cmd = tokens[i]
            i += 1
        rel = cmd.islower()
        c = cmd.upper()
        if c == "Z":
            s.close()
            x, y = sx, sy
            last_c2 = None
            continue
        if c == "M":
            nx, ny = num(), num()
            if rel:
                nx, ny = x + nx, y + ny
            s.move(nx, ny)
            x, y, sx, sy = nx, ny, nx, ny
            cmd = "l" if rel else "L"  # implicit lineto after moveto
            last_c2 = None
        elif c in "LHV":
            if c == "L":
                nx, ny = num(), num()
                if rel:
                    nx, ny = x + nx, y + ny
            elif c == "H":
                nx, ny = num(), y
                if rel:
                    nx = x + nx
            else:
                nx, ny = x, num()
                if rel:
                    ny = y + ny
            s.line(nx, ny)
            x, y = nx, ny
            last_c2 = None
        elif c in "CS":
            if c == "C":
                x1, y1 = num(), num()
                if rel:
                    x1, y1 = x + x1, y + y1
            else:
                x1, y1 = (2 * x - last_c2[0], 2 * y - last_c2[1]) if last_c2 else (x, y)
            x2, y2, nx, ny = num(), num(), num(), num()
            if rel:
                x2, y2, nx, ny = x + x2, y + y2, x + nx, y + ny
            s.cubic(x1, y1, x2, y2, nx, ny)
            last_c2 = (x2, y2)
            x, y = nx, ny
        elif c == "A":
            rx, ry, rot = num(), num(), num()
            large, sweep = flag(), flag()
            nx, ny = num(), num()
            if rel:
                nx, ny = x + nx, y + ny
            for seg in _arc_to_cubics(x, y, rx, ry, rot, large, sweep, nx, ny):
                s.cubic(*seg)
            x, y = nx, ny
            last_c2 = None
        else:
            raise ValueError(f"unsupported path command {cmd!r}")
    return s


def _arc_to_cubics(x1, y1, rx, ry, rot, large, sweep, x2, y2):
    """SVG endpoint arc to cubic Bezier segments (each <= 90 degrees)."""
    if rx == 0 or ry == 0:
        return [(x1, y1, x2, y2, x2, y2)]
    phi = math.radians(rot)
    cp, sp = math.cos(phi), math.sin(phi)
    dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
    x1p, y1p = cp * dx + sp * dy, -sp * dx + cp * dy
    rx, ry = abs(rx), abs(ry)
    lam = x1p ** 2 / rx ** 2 + y1p ** 2 / ry ** 2
    if lam > 1:
        rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
    num_ = rx ** 2 * ry ** 2 - rx ** 2 * y1p ** 2 - ry ** 2 * x1p ** 2
    den = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2
    co = math.sqrt(max(0.0, num_ / den)) * (-1 if large == sweep else 1)
    cxp, cyp = co * rx * y1p / ry, -co * ry * x1p / rx
    cx = cp * cxp - sp * cyp + (x1 + x2) / 2
    cy = sp * cxp + cp * cyp + (y1 + y2) / 2

    def ang(ux, uy, vx, vy):
        a = math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
        return a

    t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not sweep and dt > 0:
        dt -= 2 * math.pi
    elif sweep and dt < 0:
        dt += 2 * math.pi
    n = max(1, math.ceil(abs(dt) / (math.pi / 2)))
    step = dt / n
    k = 4 / 3 * math.tan(step / 4)
    out = []
    t = t1
    for _ in range(n):
        c1, s1 = math.cos(t), math.sin(t)
        c2, s2 = math.cos(t + step), math.sin(t + step)
        p1 = (c1 - k * s1, s1 + k * c1)
        p2 = (c2 + k * s2, s2 - k * c2)
        p3 = (c2, s2)
        pts = []
        for px, py in (p1, p2, p3):
            px, py = px * rx, py * ry
            pts += [cp * px - sp * py + cx, sp * px + cp * py + cy]
        out.append(tuple(pts))
        t += step
    return out


# Cut-paper nav icons on a 24 grid (DESIGN.md section 9). Holes are even-odd.
NAV_ICONS = {
    "navHome": "M14 2.5h4.5v3.2H14zM3 7.2h18.2v1.6H20V21.3H4V8.8H3zM7 11.2v3h3v-3zm7 0v3h3v-3zm-4 10.1h4v-5.1h-4z",
    "navExplore": "M2.5 5.2 8.6 3l6.8 2.4 6.1-2.2v15.6l-6.1 2.2-6.8-2.4-6.1 2.2zM15 9.3a2.3 2.3 0 1 0-4.6 0c0 1.7 2.3 4.3 2.3 4.3S15 11 15 9.3z",
    "navSwipe": "M4.2 6.9 12.6 4l4.9 14.3-8.4 2.9zM13.6 3.6l5.7 1.5c.9.2 1.4 1.1 1.2 2l-2.4 9.4z",
    "navHeart": "M12 21c-4.4-3.2-9-6.6-9-11.3C3 6.6 5.2 4.3 8 4.3c1.7 0 3.1.9 4 2.3.9-1.4 2.3-2.3 4-2.3 2.8 0 5 2.3 5 5.4 0 4.7-4.6 8.1-9 11.3z",
    "navPost": "M5 2.5h9.5L19.5 7.5V21.5H5zM14 3.5v4.5h4.5zM11.2 10.5v2.8H8.4v1.8h2.8v2.8H13v-2.8h2.8v-1.8H13v-2.8z",
    "navProfile": "M12 2.8a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6zM3.5 21.2c.4-4.6 4-7.6 8.5-7.6s8.1 3 8.5 7.6z",
    "navMore": "M3.4 3.6h7.3v7.2H3.2zM13.3 3.3h7.4v7.3h-7.3zM3.3 13.4h7.2v7.3H3.5zM13.4 13.3h7.3l-.1 7.4h-7.2z",
    "navSaved": "M6 2.8h12.2V21.4l-6.1-4.3-6.1 4.3z",
    "navChats": "M4.6 3.6h14.8c.9 0 1.6.7 1.6 1.6v10.2c0 .9-.7 1.6-1.6 1.6H11l-4.8 3.9.4-3.9h-2c-.9 0-1.6-.7-1.6-1.6V5.2c0-.9.7-1.6 1.6-1.6zM8.2 8.7h2.4v2.4H8.2zm5.2 0h2.4v2.4h-2.4z",
    "navDashboard": "M3.4 13.4h4.4v7.4H3.3zM9.8 8.3h4.4l.1 12.5H9.7zM16.3 3.4h4.4v17.4h-4.5z",
    "navVisits": "M3.2 5.2h17.6v16.2H3.2zM6.8 2.6h2.2v4.4H6.8zm8.2 0h2.2v4.4H15zM13.6 13.2v4.2h4.2v-4.2z",
    "navAlerts": "M12 2.6c.8 0 1.4.6 1.4 1.3 2.8.7 4.4 3 4.4 6.2v4.2l2 2.5H4.2l2-2.5v-4.2c0-3.2 1.6-5.5 4.4-6.2 0-.7.6-1.3 1.4-1.3zM9.8 18.4h4.4a2.2 2.2 0 0 1-4.4 0z",
    "navAppearance": "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2.2v13.6a6.8 6.8 0 0 0 0-13.6z",
}


def build():
    W, H = 1200, 360
    near_town, near_windows = skyline(W, H, 7, 0.62, (0, 0, 40, 120, 220), 20.0)
    gurugram, gurugram_windows = towers(480, 200, 21)
    bangalore, bangalore_windows = skyline(480, 200, 11, 0.5, (0, 6, 16, 34), 6.0)
    shapes = {
        "sun": sun(W, H, 960, 96, 46),
        "cloudA": cloud(W, H, 180, 110, 1.3),
        "cloudB": cloud(W, H, 700, 70, 0.9),
        "hillsFar": hills(W, H, 214, [(26, 170, 0.6), (12, 67, 1.3)], 24, 1),
        "hillsNear": hills(W, H, 262, [(20, 210, 2.1), (9, 53, 0.2)], 24, 2),
        "townFar": skyline(W, H, 3, 0.9, (0, 4, 8), 0.0, False, 300)[0],
        "townWindows": near_windows,
        "townNear": near_town,
        "tree": peepal(W, H, 1080, H, 1.35),
        # night: the moon takes the sun's place; stars in the upper sky
        "moon": moon(W, H, 960, 96, 40),
        # Stars stay out of the upper-left, where the closing line sits.
        "stars": stars(W, H, [(640, 120, 3), (700, 42, 4), (800, 40, 4), (870, 150, 3), (760, 170, 3),
                              (1100, 70, 5), (1160, 140, 3), (560, 170, 3), (1040, 150, 3)]),
        # 480 x 200 city postcards (landing + city pages)
        "cardHillsFar": hills(480, 200, 124, [(14, 110, 0.5), (6, 38, 1.2)], 16, 5, 0.8),
        "cardHillsNear": hills(480, 200, 158, [(10, 140, 2.2), (5, 31, 0.4)], 16, 6, 0.8),
        "cardSun": sun(480, 200, 400, 46, 18, 14),
        "gurugramTowers": gurugram,
        "gurugramWindows": gurugram_windows,
        "bangaloreTown": bangalore,
        "bangaloreWindows": bangalore_windows,
        "bangaloreTree": peepal(480, 200, 430, 200, 0.62, 13),
        # compact 320 x 200 scene for empty states
        "miniHillsFar": hills(320, 200, 128, [(12, 60, 0.4), (5, 23, 1.1)], 16, 3, 0.8),
        "miniHillsNear": hills(320, 200, 160, [(9, 70, 2.4), (4, 19, 0.3)], 16, 4, 0.8),
        "miniSun": sun(320, 200, 262, 50, 18, 14),
        "house": prop_house(),
        "chat": prop_chat(),
        "heart": prop_heart(),
        "magnifier": prop_magnifier(),
        "rainCloud": prop_rain_cloud(),
        "bell": prop_bell(),
    }
    for name, d in NAV_ICONS.items():
        icon = svg_path(d, 24, 24)
        icon.web_d = d  # web keeps the hand-written path
        shapes[name] = icon
    edge = torn_edge()

    header = "// GENERATED by scripts/generate-paper-art.py. Do not edit by hand.\n"
    ts = [header, "export interface PaperShape {\n  w: number;\n  h: number;\n  d: string;\n  evenOdd: boolean;\n}\n\n"]
    ts.append("export const paperArt = {\n")
    for name, s in shapes.items():
        ts.append(f"  {name}: {{ w: {s.w}, h: {s.h}, evenOdd: {'true' if s.even_odd else 'false'}, d: \"{getattr(s, 'web_d', None) or s.svg_d()}\" }},\n")
    ts.append("} satisfies Record<string, PaperShape>;\n\n")
    ts.append("export type PaperArtName = keyof typeof paperArt;\n\n")
    ts.append("/** One torn-edge tile, normalised 0..1. Repeat along an edge. */\n")
    ts.append("export const tornEdgeTile: ReadonlyArray<readonly [number, number]> = [\n  ")
    ts.append(", ".join(f"[{x:.3f}, {y}]" for x, y in edge))
    ts.append(",\n];\n")
    WEB_OUT.parent.mkdir(parents=True, exist_ok=True)
    WEB_OUT.write_text("".join(ts))

    dart = [header, "import 'dart:ui';\n\n",
            "/// A single-colour cut-paper silhouette. See `PaperShape.path`.\n",
            "class PaperShape {\n  const PaperShape(this.size, this.ops, {this.evenOdd = false});\n\n",
            "  final Size size;\n  final List<double> ops;\n  final bool evenOdd;\n\n",
            "  /// Decodes the op-codes: 0 moveTo, 1 lineTo, 2 cubicTo, 3 close.\n",
            "  Path path() {\n    final p = Path()\n      ..fillType = evenOdd ? PathFillType.evenOdd : PathFillType.nonZero;\n",
            "    var i = 0;\n    while (i < ops.length) {\n      switch (ops[i++].toInt()) {\n",
            "        case 0:\n          p.moveTo(ops[i], ops[i + 1]);\n          i += 2;\n",
            "        case 1:\n          p.lineTo(ops[i], ops[i + 1]);\n          i += 2;\n",
            "        case 2:\n          p.cubicTo(ops[i], ops[i + 1], ops[i + 2], ops[i + 3], ops[i + 4], ops[i + 5]);\n          i += 6;\n",
            "        default:\n          p.close();\n      }\n    }\n    return p;\n  }\n}\n\n",
            "abstract final class PaperArt {\n"]
    for name, s in shapes.items():
        eo = ", evenOdd: true" if s.even_odd else ""
        dart.append(f"  static const {name} = PaperShape(Size({s.w}, {s.h}), [{s.dart_ops()}]{eo});\n")
    dart.append("\n  /// One torn-edge tile, normalised 0..1 (x, y pairs). Repeat along an edge.\n")
    dart.append("  static const tornEdgeTile = <double>[" + ",".join(f"{x:.3f},{y}" for x, y in edge) + "];\n}\n")
    DART_OUT.parent.mkdir(parents=True, exist_ok=True)
    DART_OUT.write_text("".join(dart))
    # Match the mobile repo's `dart format` so a regenerate causes no diff noise.
    dart = shutil.which("dart")
    if dart:
        subprocess.run([dart, "format", str(DART_OUT)], check=False, capture_output=True)
    print(f"wrote {WEB_OUT.relative_to(ROOT)} and {DART_OUT}")


if __name__ == "__main__":
    build()
