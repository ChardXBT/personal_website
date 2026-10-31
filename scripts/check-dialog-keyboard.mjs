import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { startPortfolioServer } from "./serve.mjs";

const require = createRequire(import.meta.url);
// Use a separately installed Playwright; the published site has no dependencies.
const { chromium, firefox, webkit } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const server = await startPortfolioServer({ port: 0 });
const origin = "http://127.0.0.1:" + server.address().port;

try {
  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await engine.launch({ headless: true });
    try {
      for (const id of ["appraisals", "data-collection"]) {
        const page = await browser.newPage({ reducedMotion: "reduce" });
        await page.goto(origin + "/#project=" + id);
        const back = page.locator("[data-detail-close]");
        await page.waitForFunction(() => document.activeElement?.hasAttribute("data-detail-close"));
        const controls = page.locator("#project-detail button, #project-detail a[href]");
        const count = await controls.count();
        for (const direction of ["Tab", "Shift+Tab"]) {
          for (let index = 1; index <= count; index += 1) {
            await page.keyboard.press(direction);
            const expected = direction === "Tab" ? index % count : (count - index) % count;
            assert.equal(await controls.nth(expected).evaluate((element) => element === document.activeElement), true,
              name + ": " + id + " must cycle every control with " + direction);
          }
        }
        await page.keyboard.press("Escape");
        await back.waitFor({ state: "hidden" });
        assert.equal(await page.evaluate(() => document.activeElement.dataset.project), id,
          name + ": Escape must return focus to the project row");
        assert.equal(new URL(page.url()).hash, "");
        await page.close();
      }
      console.log(name + ": dialog keyboard regression passed");
    } finally {
      await browser.close();
    }
  }
} finally {
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
}
