const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  await page.goto('https://priscananjehe1996.github.io/uganda_bms/', { waitUntil: 'networkidle2' });
  
  // Login as admin
  try {
    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', 'admin');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(3000);
    console.log("Logged in successfully. Navigating tabs...");
    
    // Check map tab
    const mapTab = await page.$('.horiz-nav-link:nth-child(2)'); // GIS Map
    if(mapTab) {
       await mapTab.click();
       await page.waitForTimeout(3000);
    }
    
  } catch(e) {
    console.log('Error during test:', e.message);
  }
  
  await page.screenshot({path: 'live_test.png', fullPage: true});
  await browser.close();
})();
