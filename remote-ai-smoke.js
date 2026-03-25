const { chromium } = require("playwright");

async function clickSquare(page, fileIndex, rank) {
  const board = page.locator("#board");
  const box = await board.boundingBox();
  if (!box) throw new Error("board not found");
  const square = box.width / 8;
  const x = box.x + square * (fileIndex + 0.5);
  const y = box.y + square * (8 - rank + 0.5);
  await page.mouse.click(x, y);
  await page.waitForTimeout(180);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto("http://127.0.0.1:4173", { waitUntil: "domcontentloaded" });
  await page.locator("#mode-select").selectOption("remote");
  await page.locator("#remote-room-type-select").selectOption("remote-ai");
  await page.waitForTimeout(250);
  await page.locator("#create-room-btn").click();
  await page.waitForTimeout(500);

  await clickSquare(page, 4, 2);
  await clickSquare(page, 4, 4);
  await page.waitForTimeout(1000);

  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  console.log(JSON.stringify(state, null, 2));
  await page.screenshot({ path: "output/remote-ai.png", fullPage: true });
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
