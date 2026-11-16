const { chromium } = require('playwright');
const fs = require('fs');
const files = fs.readdirSync(process.argv[2]).filter(f => f.endsWith('.html'));
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const issues = [], leaks = {};
  for (const [vn, vp] of [['desktop', { viewport: { width: 1366, height: 900 } }], ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
    const ctx = await b.newContext(vp); const q = files.slice();
    await Promise.all(Array.from({ length: 4 }, async () => { while (q.length) { const f = q.shift(); const p = await ctx.newPage(); const errs = [], bad = [];
      p.on('pageerror', e => errs.push(e.message.slice(0, 150))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 150)); });
      p.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/404.html')) bad.push(r.status() + ' ' + r.url()); });
      try {
        await p.goto('http://localhost:8772/' + f, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(800);
        const r = await p.evaluate(() => {
          const W = document.documentElement.clientWidth, over = document.documentElement.scrollWidth > W + 1;
          document.querySelectorAll('details').forEach(d => d.open = true);
          const txt = document.body.innerText.split('\n').concat([...document.querySelectorAll('[aria-label],[title],[placeholder],img[alt]')].map(e => e.getAttribute('aria-label') || e.getAttribute('title') || e.getAttribute('placeholder') || e.getAttribute('alt') || ''));
          const tw = /[ğĞşŞıİ]|\b(ve|bir|için|ile|değil|sayfa\w*|bölüm\w*|okuyun|devam\w*|tarih|ara|kapat|ayarlar|menü)\b/i;
          // Buttons and links cut off at the right edge: #app hides its overflow, so the page itself never scrolls sideways
          const scrolls = e => { for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) if (/auto|scroll/.test(getComputedStyle(x).overflowX)) return true; return false; };
          const clipped = [...document.querySelectorAll('a,button,input,select')].filter(e => { const b = e.getBoundingClientRect(); return b.width && b.height && b.right > W + 1 && b.left < W && !e.closest('[hidden]') && getComputedStyle(e).visibility !== 'hidden' && !scrolls(e); }).slice(0, 3).map(e => e.getAttribute('aria-label') || e.textContent.trim().slice(0, 30) || e.tagName);
          return { over, clipped, title: document.title, lang: document.documentElement.lang, leaks: txt.map(s => s.trim()).filter(s => s && tw.test(s)) };
        });
        if (r.over) issues.push(vn + ' OVERFLOW ' + f);
        if (r.clipped.length) issues.push(vn + ' CLIPPED ' + f + ' ' + r.clipped.join(' | '));
        if (r.lang !== 'en') issues.push(vn + ' LANG ' + r.lang + ' ' + f);
        r.leaks.forEach(l => { (leaks[l] = leaks[l] || new Set()).add(f); });
      } catch (e) { issues.push(vn + ' ERR ' + f + ' ' + e.message.slice(0, 80)); }
      if (errs.length) issues.push(vn + ' JS ' + f + ' ' + errs.join(' | '));
      if (bad.length) issues.push(vn + ' HTTP ' + f + ' ' + bad.slice(0, 3).join(' | '));
      await p.close(); } }));
    await ctx.close();
  }
  console.log(issues.length ? issues.join('\n') : 'no issues');
  console.log('--- possible Turkish:');
  Object.entries(leaks).sort((a, b) => b[1].size - a[1].size).slice(0, 40).forEach(([l, s]) => console.log(s.size, l.slice(0, 140), '|', [...s].slice(0, 2).join(',')));
  await b.close();
})();
