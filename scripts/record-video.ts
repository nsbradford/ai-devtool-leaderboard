#!/usr/bin/env tsx
/**
 * Records a video of using the AI Code Review Adoption Tracker dashboard.
 * Run: pnpm dev (in another terminal) then pnpm run record-video
 */

import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const VIDEO_DIR = path.join(process.cwd(), 'docs', 'media', 'videos');

async function main() {
  // Ensure video output directory exists
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for page to settle
    await new Promise((r) => setTimeout(r, 2000));

    // Simulate exploring: scroll down
    await page.evaluate(() => window.scrollBy(0, 200));
    await new Promise((r) => setTimeout(r, 800));

    // Try to click theme toggle
    const themeToggle = page.locator('button[aria-label*="theme"], button[title*="theme"], [data-state]').first();
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click();
      await new Promise((r) => setTimeout(r, 600));
    }

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 500));

    // Try toggling weekly/monthly if visible
    const weeklyMonthly = page.locator('button:has-text("Weekly"), button:has-text("Monthly")').first();
    if (await weeklyMonthly.isVisible().catch(() => false)) {
      await weeklyMonthly.click();
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.log('Recording complete. Closing browser...');
  } finally {
    const video = page.video();
    await context.close();
    if (video) {
      try {
        const videoPath = await video.path();
        const destPath = path.join(VIDEO_DIR, 'codebase-exploration.webm');
        if (videoPath && fs.existsSync(videoPath)) {
          fs.renameSync(videoPath, destPath);
          console.log('Video saved to', destPath);
        }
      } catch (e) {
        console.warn('Could not save video:', e);
      }
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
