const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const executablePath = '/Users/ryoseiworld/.cache/puppeteer/chrome-headless-shell/mac_arm-148.0.7778.97/chrome-headless-shell-mac-arm64/chrome-headless-shell';
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('https://ryoseiimai.github.io/ryosei-galaxy/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const bandVisible = await page.evaluate(() => {
    const el = document.getElementById('liveBand');
    return el ? el.classList.contains('is-visible') : 'NO_ELEMENT';
  });
  const statsText = await page.evaluate(() => {
    const el = document.getElementById('liveStats');
    return el ? el.innerText : 'NO_ELEMENT';
  });
  const feedCount = await page.evaluate(() => document.querySelectorAll('#liveFeedList li').length);
  const feedTexts = await page.evaluate(() => Array.from(document.querySelectorAll('#liveFeedList li')).map(li => li.innerText));
  const activeNow = await page.evaluate(() => {
    const el = document.getElementById('iraiTodayBadge');
    return el ? el.textContent : 'NO_ELEMENT';
  });

  // horizontal scroll check at 390px
  const scrollCheck = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));

  console.log('band visible:', bandVisible);
  console.log('stats text:', statsText);
  console.log('feed item count:', feedCount);
  console.log('feed items:', JSON.stringify(feedTexts, null, 2));
  console.log('badge:', activeNow);
  console.log('scrollCheck (390px):', JSON.stringify(scrollCheck));

  // scroll live band into view then viewport screenshot
  const liveBandHandle = await page.$('#liveBand');
  if (liveBandHandle) {
    await liveBandHandle.scrollIntoView();
    await new Promise(r => setTimeout(r, 300));
  }
  await page.screenshot({ path: path.join(__dirname, 'shots', 'live_band.png'), fullPage: false });

  await page.screenshot({ path: path.join(__dirname, 'shots', 'live_full.png'), fullPage: true });

  await browser.close();
})();
