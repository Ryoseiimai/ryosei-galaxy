const puppeteer = require('puppeteer-core');

function rectsOverlap(a, b) {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

async function checkAt(page, times, W) {
  const results = [];
  for (const t of times) {
    await new Promise(r => setTimeout(r, t.delta));
    const data = await page.evaluate(() => {
      function rect(sel) {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const stage = document.getElementById('stage').getBoundingClientRect();
        return { x: r.left - stage.left, y: r.top - stage.top, w: r.width, h: r.height };
      }
      return {
        labelRects: window.__RG_DEBUG.labelRects,
        promoBtn: rect('#promoBtn'),
        tickerWrap: rect('.ticker-wrap'),
        hudTop: rect('.hud-top'),
        scrollHint: rect('#scrollHint'),
        hudActions: rect('.hud-actions')
      };
    });
    const excludeZones = [data.promoBtn, data.tickerWrap, data.hudTop, data.scrollHint, data.hudActions].filter(Boolean);
    const labelVsLabel = [];
    const labelVsUi = [];
    const outOfViewport = [];
    for (let i = 0; i < data.labelRects.length; i++) {
      const r = data.labelRects[i];
      if (r.x < 8 - 0.5 || (r.x + r.w) > (W - 8 + 0.5)) outOfViewport.push({dept:r.dept, x:r.x, right:r.x+r.w});
      for (let j = i + 1; j < data.labelRects.length; j++) {
        if (rectsOverlap(data.labelRects[i], data.labelRects[j])) labelVsLabel.push([data.labelRects[i].dept, data.labelRects[j].dept]);
      }
      for (const z of excludeZones) {
        if (rectsOverlap(data.labelRects[i], z)) labelVsUi.push(data.labelRects[i].dept);
      }
    }
    results.push({ atSec: t.atSec, labelVsLabel, labelVsUi, outOfViewport });
  }
  return results;
}

(async () => {
  const executablePath = '/Users/ryoseiworld/.cache/puppeteer/chrome-headless-shell/mac_arm-148.0.7778.97/chrome-headless-shell-mac-arm64/chrome-headless-shell';
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const url = 'http://localhost:8931/index.html';
  const errors = [];
  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  const times = [5,10,15,20,25,30].map((s,i,arr) => ({ atSec:s, delta: i===0 ? s*1000 : (s-arr[i-1])*1000 }));

  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  const desktopResults = await checkAt(page, times, 1280);
  await page.screenshot({ path: '/Users/ryoseiworld/dev/2026-08-31-ryosei-galaxy/shots/v2_desktop.png' });

  console.log('=== DESKTOP (6時点) ===');
  desktopResults.forEach(r => console.log(`  ${r.atSec}s: overlap=${r.labelVsLabel.length} ui=${r.labelVsUi.length} outOfViewport=${r.outOfViewport.length}`,
    r.labelVsLabel.length?JSON.stringify(r.labelVsLabel):'', r.outOfViewport.length?JSON.stringify(r.outOfViewport):''));

  await page.setViewport({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'load', timeout: 30000 });
  const mobileResults = await checkAt(page, times, 390);
  await page.screenshot({ path: '/Users/ryoseiworld/dev/2026-08-31-ryosei-galaxy/shots/v2_mobile.png' });

  console.log('=== MOBILE (6時点) ===');
  mobileResults.forEach(r => console.log(`  ${r.atSec}s: overlap=${r.labelVsLabel.length} ui=${r.labelVsUi.length} outOfViewport=${r.outOfViewport.length}`,
    r.labelVsLabel.length?JSON.stringify(r.labelVsLabel):'', r.outOfViewport.length?JSON.stringify(r.outOfViewport):''));

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  console.log('CONSOLE ERRORS:', JSON.stringify(errors));
  console.log('MOBILE overflow:', JSON.stringify(overflow));

  const allOk = [...desktopResults, ...mobileResults].every(r => r.labelVsLabel.length===0 && r.labelVsUi.length===0 && r.outOfViewport.length===0) && errors.length===0;
  console.log('OVERALL OK (overlap0 + outOfViewport0, 6 time points x 2 viewports):', allOk);

  await browser.close();
})().catch(e => { console.error('ERROR', e); process.exit(1); });
