import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/uganda_bms/', { waitUntil: 'networkidle0' });
  
  // Wait a moment for animations
  await new Promise(r => setTimeout(r, 1000));
  
  const screenshotPath = path.join('C:\\Users\\Kas\\.gemini\\antigravity\\brain\\48231e91-f602-48d7-b5d2-8148b87fa14e', 'light_mode_dashboard.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to', screenshotPath);
  
  await browser.close();
  process.exit(0);
})();
