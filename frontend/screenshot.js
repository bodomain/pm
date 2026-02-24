import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.addInitScript(() => {
    window.localStorage.setItem("isAuthenticated", "true");
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Click 'Add a card'
  await page.click('text=Add a card');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'add-card-clicked.png' });
  
  await page.fill('input[placeholder="Card title"]', 'My test title');
  await page.fill('textarea[placeholder="Details"]', 'My test details');
  
  await page.screenshot({ path: 'add-card-filled.png' });
  
  await page.click('text=Add card');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'add-card-submitted.png' });
  
  await browser.close();
})();
