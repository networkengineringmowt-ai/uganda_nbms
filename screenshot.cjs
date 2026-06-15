const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to 1080p
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Navigating to app...');
  await page.goto('https://priscananjehe1996.github.io/uganda_bms/', { waitUntil: 'networkidle0' });
  
  // Type password
  console.log('Typing password...');
  await page.type('.input-group input', 'bms');
  await page.keyboard.press('Enter');
  
  // Wait for the UI to load
  await new Promise(r => setTimeout(r, 1500)); // give it time to render the high contrast theme
  
  console.log('Taking screenshot...');
  const screenshotPath = 'C:\\Users\\Kas\\.gemini\\antigravity\\brain\\48231e91-f602-48d7-b5d2-8148b87fa14e\\capture_ui_preview.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  console.log('Done.');
  await browser.close();
})();
