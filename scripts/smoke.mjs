import { chromium } from "playwright";

const errs = [];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("console", (m) => {
  if (m.type() === "error") errs.push("CONSOLE: " + m.text());
});
page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));

await page.goto("http://localhost:4173/TOEIC-7000/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

// Home should render day + 今日任務
const hasMission = await page.getByText("今日任務").count();
console.log("今日任務 present:", hasMission > 0);

// Start today's mission
await page.getByText("開始今日任務").click();
await page.waitForTimeout(400);

// Flashcard: flip then mark known
await page.getByText("翻面看意思").click();
await page.waitForTimeout(700);
await page.getByText("記住了").click();
await page.waitForTimeout(400);

// next card flip+known
const flip2 = await page.getByText("翻面看意思").count();
console.log("second flashcard present:", flip2 > 0);
if (flip2) {
  await page.getByText("翻面看意思").click();
  await page.waitForTimeout(600);
  await page.getByText("記住了").click();
  await page.waitForTimeout(400);
}
await page.screenshot({ path: "scripts/raw/shot-session.png" });

// Close session via ✕
await page.getByRole("button", { name: "關閉" }).click().catch(() => {});
await page.waitForTimeout(300);

// Visit other tabs (nav buttons contain emoji + label)
for (const t of ["單字庫", "成就", "設定"]) {
  await page.getByRole("button", { name: new RegExp(t) }).first().click();
  await page.waitForTimeout(350);
}
await page.screenshot({ path: "scripts/raw/shot-settings.png" });

// Browse search + multiple-choice practice sanity
await page.getByRole("button", { name: /單字庫/ }).first().click();
await page.waitForTimeout(300);
await page.getByPlaceholder("搜尋英文或中文…").fill("abandon");
await page.waitForTimeout(300);
console.log("search hit abandon:", (await page.getByText("遺棄；中止").count()) > 0);

// Back home
await page.getByRole("button", { name: /今日/ }).first().click();
await page.waitForTimeout(300);
const learned = await page.getByText(/已學單字/).count();
console.log("home stats present:", learned > 0);
await page.screenshot({ path: "scripts/raw/shot-home.png" });

await browser.close();
console.log("ERRORS:", errs.length);
for (const e of errs) console.log("  " + e);
process.exit(errs.length ? 1 : 0);
