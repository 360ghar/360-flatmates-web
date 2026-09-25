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


def build():
    W, H = 1200, 360
    near_town, near_windows = skyline(W, H, 7, 0.62, (0, 0, 40, 120, 220), 20.0)
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
    edge = torn_edge()

    header = "// GENERATED by scripts/generate-paper-art.py. Do not edit by hand.\n"
    ts = [header, "export interface PaperShape {\n  w: number;\n  h: number;\n  d: string;\n  evenOdd: boolean;\n}\n\n"]
    ts.append("export const paperArt = {\n")
    for name, s in shapes.items():
        ts.append(f"  {name}: {{ w: {s.w}, h: {s.h}, evenOdd: {'true' if s.even_odd else 'false'}, d: \"{s.svg_d()}\" }},\n")
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
