# Origin animation renderer

This standalone tool renders animation HTML clips frame by frame with Playwright, then encodes the frames into an MP4 with FFmpeg. It does not change the Antara website's dependencies or scripts.

## Requirements

- Node.js 20 or newer
- FFmpeg available on `PATH`
- Playwright Chromium (install with `npx playwright install chromium`)

## Setup

From this directory:

```bash
npm install
npx playwright install chromium
```

Save standalone animation HTML files in `clips/`. A clip should expose its render area as `#fr` and a restart control as `#rp`; an optional light-theme control can use `data-t="1"`.

## Render

Run commands from this directory:

```bash
npm run render -- clips/origin-point.html out/origin-point-dark.mp4 15 60
npm run render -- clips/origin-point.html out/origin-point-light.mp4 15 60 light
```

The duration defaults to 15 seconds, the frame rate to 60 FPS, and the output to `out/video.mp4`. Six-second logo stings can be rendered by replacing `15` with `6`. Frames are captured at three times the clip's CSS size; for a 360×640 render area, the output is 1080×1920.

Generated PNG frames are written to `frames/` and replaced on the next render. MP4s go in `out/`. Both generated folders are excluded from Git.

Before rendering, apply any clip-specific changes (for example, increasing the particle cap or replacing placeholder number values) in the HTML file.
