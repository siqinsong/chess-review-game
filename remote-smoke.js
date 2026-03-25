const { chromium } = require("playwright");

async function clickSquare(page, fileIndex, rank) {
  const board = page.locator("#board");
  const box = await board.boundingBox();
  if (!box) throw new Error("board not found");
  const square = box.width / 8;
  const x = box.x + square * (fileIndex + 0.5);
  const y = box.y + square * (8 - rank + 0.5);
  await page.mouse.click(x, y);
  await page.waitForTimeout(150);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const contextA = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const contextB = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto("http://127.0.0.1:4173", { waitUntil: "domcontentloaded" });
  await pageB.goto("http://127.0.0.1:4173", { waitUntil: "domcontentloaded" });
  await pageA.locator("#mode-select").selectOption("remote");
  await pageB.locator("#mode-select").selectOption("remote");
  await pageA.waitForTimeout(200);
  await pageB.waitForTimeout(200);

  await pageA.locator("#create-room-btn").click();
  await pageA.waitForTimeout(400);
  const roomCode = (await pageA.locator("#remote-room-text").textContent()).trim();

  await pageB.locator("#room-code-input").fill(roomCode);
  await pageB.locator("#join-room-btn").click();
  await pageB.waitForTimeout(700);
  await pageA.waitForTimeout(700);

  await clickSquare(pageA, 4, 2);
  await clickSquare(pageA, 4, 4);
  await pageA.waitForTimeout(500);
  await pageB.waitForTimeout(500);

  await clickSquare(pageB, 4, 7);
  await clickSquare(pageB, 4, 5);
  await pageA.waitForTimeout(500);
  await pageB.waitForTimeout(500);

  const stateA = JSON.parse(await pageA.evaluate(() => window.render_game_to_text()));
  const stateB = JSON.parse(await pageB.evaluate(() => window.render_game_to_text()));

  console.log(JSON.stringify({ roomCode, stateA, stateB }, null, 2));
  await pageA.screenshot({ path: "output/remote-a.png", fullPage: true });
  await pageB.screenshot({ path: "output/remote-b.png", fullPage: true });
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
