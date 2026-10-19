// Usage: npm run render -- clips/name.html out/name.mp4 [seconds] [fps] [light]
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const [, , input, output = 'out/video.mp4', secs = '15', fpsArg = '60', theme] = process.argv;
const duration = Number.parseFloat(secs);
const fps = Number.parseInt(fpsArg, 10);
const scale = 3;

if (!input) {
  console.error('Usage: npm run render -- clips/name.html [out/name.mp4] [seconds] [fps] [light]');
  process.exit(1);
}

if (!Number.isFinite(duration) || duration <= 0 || !Number.isInteger(fps) || fps <= 0) {
  console.error('Duration and FPS must be positive numbers.');
  process.exit(1);
}

const inputPath = path.resolve(input);
const outputPath = path.resolve(output);
if (!fs.existsSync(inputPath)) {
  console.error(`Input clip not found: ${inputPath}`);
  process.exit(1);
}

const framesDir = path.resolve('frames');

(async () => {
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 800, height: 1400 },
      deviceScaleFactor: scale,
    });

    await page.addInitScript(() => {
      let now = 1;
      const queue = [];
      performance.now = () => now;
      window.requestAnimationFrame = callback => {
        queue.push(callback);
        return queue.length;
      };
      window.__step = ms => {
        now = ms + 1;
        queue.splice(0).forEach(callback => callback(now));
      };
    });

    await page.goto(pathToFileURL(inputPath).href);
    await page.addStyleTag({ content: '#fr{border-radius:0!important;transition:none!important}' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);

    if (theme === 'light' && await page.$('[data-t="1"]')) {
      await page.click('[data-t="1"]');
    }
    await page.click('#rp');

    const frame = await page.$('#fr');
    if (!frame) {
      throw new Error('Clip must contain an element with id="fr".');
    }

    const total = Math.round(duration * fps);
    for (let i = 0; i < total; i++) {
      const time = (i * 1000) / fps;
      await page.evaluate(t => {
        document.getAnimations().forEach(animation => {
          animation.pause();
          animation.currentTime = t;
        });
        window.__step(t);
      }, time);
      await frame.screenshot({
        path: path.join(framesDir, `f${String(i).padStart(5, '0')}.png`),
      });
      if (i % fps === 0) {
        console.log(`Rendered ${i / fps}s of ${duration}s`);
      }
    }
  } finally {
    await browser.close();
  }

  execFileSync('ffmpeg', [
    '-y',
    '-framerate', String(fps),
    '-i', path.join(framesDir, 'f%05d.png'),
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '14',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputPath,
  ], { stdio: 'inherit' });
  console.log('Done:', outputPath);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
