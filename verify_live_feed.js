const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const executablePath = '/Users/ryoseiworld/.cache/puppeteer/chrome-headless-shell/mac_arm-148.0.7778.97/chrome-headless-shell-mac-arm64/chrome-headless-shell';
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1400 });
  await page.goto('http://127.0.0.1:8931/index.html', { waitUntil: 'networkidle0', timeout: 30000 });
  // wait a bit for fetch to resolve
  await new Promise(r => setTimeout(r, 1500));

  const bandVisible = await page.evaluate(() => document.getElementById('liveBand').classList.contains('is-visible'));
  const statsText = await page.evaluate(() => document.getElementById('liveStats').innerText);
  const feedCount = await page.evaluate(() => document.querySelectorAll('#liveFeedList li').length);
  const badgeText = await page.evaluate(() => document.getElementById('iraiTodayBadge').textContent);

  console.log('band visible:', bandVisible);
  console.log('stats text:', statsText);
  console.log('feed item count:', feedCount);
  console.log('irai badge:', badgeText);

  await page.screenshot({ path: path.join(__dirname, 'shots', 'live_feed.png'), fullPage: false });
  await browser.close();
})();
