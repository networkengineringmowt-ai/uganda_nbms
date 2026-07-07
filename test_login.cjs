const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  try {
    await page.goto('https://priscananjehe1996.github.io/uganda_bms/', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('input[type="email"]', 'test@unra.go.ug');
    await page.type('input[type="password"]', 'admin');
    await page.click('button');
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: 'd:/OneDrive/Bridge stuff/uganda_bms/screenshot_dashboard.png' });
    console.log('Logged in and took screenshot.');
  } catch(e) {
    console.log('Error:', e);
  }
  await browser.close();
})();
