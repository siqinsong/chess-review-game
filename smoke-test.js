const { chromium } = require("playwright");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  await page.goto("http://127.0.0.1:4173", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await page.locator("#start-btn").click();
  await page.waitForTimeout(150);

  const board = page.locator("#board");
  const box = await board.boundingBox();
  if (!box) throw new Error("board not found");

  const square = box.width / 8;
  const clickSquare = async (fileIndex, rank) => {
    const x = box.x + square * (fileIndex + 0.5);
    const y = box.y + square * (8 - rank + 0.5);
    await page.mouse.click(x, y);
    await page.waitForTimeout(120);
  };

  await clickSquare(4, 2);
  await clickSquare(4, 4);
  await page.waitForTimeout(500);

  const liveState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));

  await page.locator("#move-list li").first().click();
  await page.waitForTimeout(150);
  const reviewLabel = await page.locator("#review-mode-text").textContent();

  await page.locator("#resume-live-btn").click();
  await page.waitForTimeout(150);
  const resumeLabel = await page.locator("#review-mode-text").textContent();

  await page.locator("#undo-btn").click();
  await page.waitForTimeout(150);
  const undoState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));

  await page.locator("#mode-select").selectOption("local");
  await page.waitForTimeout(150);
  await page.locator("#start-btn").click();
  await page.waitForTimeout(150);
  const localState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));

  console.log(JSON.stringify({ liveState, reviewLabel, resumeLabel, undoState, localState }, null, 2));
  await page.screenshot({ path: "output/smoke-full.png", fullPage: true });
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
