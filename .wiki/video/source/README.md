# Wiki video source

This directory holds the editable HyperFrames composition, narration script, and scene definitions for the 360 Flatmates wiki overview video at `../overview.mp4`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The HyperFrames composition (11 scenes, 1280x720, 143s). Edit this to change visuals. |
| `scenes.json` | Scene-by-scene narration, archetype, and duration. |
| `script.txt` | The full narration script as plain text (fed to TTS). |
| `package.json` | Workspace-local deps: `hyperframes`, `ffmpeg-static`, `ffprobe-static`. |
| `hyperframes.json` | Render config (fps, quality, output path). |
| `meta.json` | Composition metadata (width, height, fps, duration). |
| `videoOverview.json` | Final video metadata (status, size, duration, warnings). |
| `assets/narration.mp3` | TTS narration audio (en-US-AriaNeural via edge-tts). |
| `assets/narration.vtt` | Word-level captions from TTS. |
| `assets/web-*.png` | Screenshots embedded in the composition. |

## How to re-render after edits

```bash
cd .wiki/video/source

# 1. Install deps (first time only)
npm install

# 2. Lint the composition
npx hyperframes lint .

# 3. Render the visual-only video (medium quality)
npx hyperframes render . -o out/visual.mp4 --fps 24 --quality medium --no-browser-gpu

# 4. Regenerate narration if script.txt changed
edge-tts --voice en-US-AriaNeural --rate "+0%" \
  --text "$(cat script.txt | tr '\n' ' ')" \
  --write-media assets/narration.mp3 \
  --write-subtitles assets/narration.vtt

# 5. Mux video + audio
ffmpeg -y -i out/visual.mp4 -i assets/narration.mp3 \
  -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ar 48000 -movflags +faststart -shortest \
  ../overview.mp4

# 6. Copy captions
cp assets/narration.vtt ../captions.en.vtt

# 7. Generate a poster frame
ffmpeg -y -ss 00:00:08 -i out/visual.mp4 -frames:v 1 -update 1 \
  -vf "scale=1280:720" ../overview-poster.png
```

Or from the repo root:

```bash
npm run wiki:render-video
```

## Font rendering

The composition loads project fonts (Fraunces, Inter, JetBrains Mono, Instrument Serif) via Google Fonts CDN in `index.html`. No local font installation is needed. If the CDN is unreachable during rendering, HyperFrames will fall back to system fonts.

## Branding

The composition uses 360 Flatmates design tokens (terracotta `#C96442`, Fraunces/Inter/JetBrains Mono typography, warm paper surfaces). See `DESIGN.md` at the repo root for the canonical token values.

## Prerequisites

- Node.js 22+
- HyperFrames 0.4.44+ (`npm install` handles this)
- FFmpeg and ffprobe on PATH
- `edge-tts` Python package for narration (`pip install edge-tts`)
- Google Chrome (HyperFrames uses it for frame capture)
