import { test, expect } from '@playwright/test';

/**
 * E2E test that records a video of using the AI Code Review Adoption Tracker.
 * Run with: pnpm run test:e2e:video
 * Video output: test-results/usage-demo-.../video.webm
 */
test('usage demo - explore dashboard', async ({ page }) => {
  test.setTimeout(60000);
  // Navigate to home page
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('AI Code Review');

  // Wait for chart to load (or error state)
  await page.waitForLoadState('networkidle');

  // Click theme toggle and switch to Dark mode
  const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
  if ((await themeToggle.count()) > 0) {
    await themeToggle.click();
    await page.waitForTimeout(400);
    const darkBtn = page.getByRole('button', { name: 'Dark' });
    if ((await darkBtn.count()) > 0) await darkBtn.click();
    await page.waitForTimeout(500);
  }

  // Click date preset "Last 90 days"
  const last90Days = page.getByRole('button', { name: 'Last 90 days' });
  if ((await last90Days.count()) > 0) {
    await last90Days.click();
    await page.waitForTimeout(600);
  }

  // Switch to 30-day window (WindowToggle shows "7-day" and "30-day")
  const day30Btn = page.getByRole('button', { name: '30-day window' });
  if ((await day30Btn.count()) > 0) {
    await day30Btn.click();
    await page.waitForTimeout(600);
  }

  // Scroll down to see rankings
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);

  // Scroll back up
  await page.evaluate(() => window.scrollBy(0, -400));
  await page.waitForTimeout(300);

  // Verify we're still on the dashboard
  await expect(page).toHaveURL(/localhost:3000/);
});
