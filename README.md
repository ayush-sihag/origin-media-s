# Origin Media

This repository contains Origin Media animation clips and a standalone frame-by-frame video renderer.

See [origin-renders/README.md](./origin-renders/README.md) for setup and rendering instructions. Clips are stored in `origin-renders/clips/`; rendered MP4s are saved in `origin-renders/out/`.

Example, run from `origin-renders/`:

```bash
npm install
npx playwright install chromium
npm run render -- clips/reel_preview.html out/reel_preview.mp4 15 60
```
