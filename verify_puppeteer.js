const puppeteer = require('puppeteer-core');

(async () => {
  const executablePath = '/Users/ryoseiworld/.cache/puppeteer/chrome-headless-shell/mac_arm-148.0.7778.97/chrome-headless-shell-mac-arm64/chrome-headless-shell';
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const url = 'https://ryoseiimai.github.io/ryosei-galaxy/';

  // Desktop
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.screenshot({ path: '/Users/ryoseiworld/dev/2026-08-31-ryosei-galaxy/shots/live_desktop.png', fullPage: true });

  const heroText = await page.evaluate(() => document.body.innerText.includes('RYOSEI GALAXY'));
  const cardCount = await page.evaluate(() => document.querySelectorAll('h3').length);
  const video = await page.evaluate(() => {
    const v = document.querySelector('video');
    return v ? { readyState: v.readyState, duration: v.duration, src: v.currentSrc } : null;
  });

  console.log('DESKTOP hero includes RYOSEI GALAXY:', heroText);
  console.log('DESKTOP card(h3) count:', cardCount);
  console.log('DESKTOP video:', JSON.stringify(video));

  // Mobile
  await page.setViewport({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
  await page.screenshot({ path: '/Users/ryoseiworld/dev/2026-08-31-ryosei-galaxy/shots/live_mobile.png', fullPage: true });
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  console.log('MOBILE overflow:', JSON.stringify(overflow));

  await browser.close();
})().catch(e => { console.error('ERROR', e); process.exit(1); });
