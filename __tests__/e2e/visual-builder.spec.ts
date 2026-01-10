// Playwright E2E

import { test, expect } from '@playwright/test';

test('visual build flow', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('tab=visual');
  await page.locator('[data-drag=agent]').dragTo('[data-canvas]');
  await page.click('Generate');
  await expect(page.locator('[data-output]')).toBeVisible();
});