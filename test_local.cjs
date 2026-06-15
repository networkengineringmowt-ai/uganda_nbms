const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  try {
    await page.goto('http://localhost:5173/uganda_bms/', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'test@unra.go.ug');
    await page.type('input[type="password"]', 'admin');
    await page.click('button');
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Navigating tabs...');
    // We can evaluate some clicks here, or just click all menu items.
    const buttons = await page.$$('button, a');
    for(let b of buttons) {
      try {
        await b.click();
        await new Promise(r => setTimeout(r, 500));
      } catch(e) {}
    }
    console.log('Finished clicking tabs.');
  } catch(e) {
    console.log('Error:', e);
  }
  await browser.close();
})();
