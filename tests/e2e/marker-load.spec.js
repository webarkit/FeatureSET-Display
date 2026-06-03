import { test, expect } from '@playwright/test';

// End-to-end smoke test: load example_es6.html, wait for the wasm
// runtime to fetch + decode the pinball marker, then verify the
// canvas has actually been painted (non-empty pixel data).
test('example_es6.html loads the pinball marker and renders the canvas', async ({ page }) => {
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/example/example_es6.html');

  // ARFset.display() inserts <canvas id="iSet"> and dispatches 'imageEv'
  // once the marker has been drawn. Wait for the canvas to appear and
  // for the event to fire.
  const canvas = page.locator('#iSet');
  await canvas.waitFor({ state: 'attached', timeout: 30_000 });

  await page.waitForFunction(() => {
    return new Promise((resolve) => {
      // imageEv may have already fired between locator wait and here.
      const c = document.getElementById('iSet');
      if (c && c.width > 0 && c.height > 0) return resolve(true);
      document.addEventListener('imageEv', () => resolve(true), { once: true });
    });
  }, undefined, { timeout: 30_000 });

  const dimensions = await canvas.evaluate((el) => ({ w: el.width, h: el.height }));
  expect(dimensions.w).toBeGreaterThan(0);
  expect(dimensions.h).toBeGreaterThan(0);

  // Sample a few pixels: at least one must be non-black, confirming the
  // marker image was actually painted (not just a blank canvas).
  const hasContent = await canvas.evaluate((el) => {
    const ctx = el.getContext('2d');
    const data = ctx.getImageData(0, 0, el.width, el.height).data;
    // step coarsely to keep this fast for big markers
    for (let i = 0; i < data.length; i += 4 * 100) {
      if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) return true;
    }
    return false;
  });
  expect(hasContent).toBe(true);

  expect(consoleErrors, `unexpected errors: ${consoleErrors.join(' | ')}`).toEqual([]);
});
