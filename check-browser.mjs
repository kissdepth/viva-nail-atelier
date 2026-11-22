import { writeFileSync } from 'node:fs';

const socket = new WebSocket('ws://127.0.0.1:9224/session');
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let nextId = 0;
let context;
const waiting = new Map();
const errors = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'log.entryAdded' && message.params.level === 'error') errors.push(message.params.text);
  const pending = waiting.get(message.id);
  if (!pending) return;
  waiting.delete(message.id);
  if (message.type === 'error') pending.reject(new Error(JSON.stringify(message)));
  else pending.resolve(message.result);
});
function send(method, params) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('script.evaluate', { expression, target: { context }, awaitPromise: true });
  if (result.type === 'exception') throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
function assert(value, description) {
  if (!value) throw new Error(description);
  console.log('PASS ' + description);
}
async function screenshot(path, origin = 'viewport') {
  const result = await send('browsingContext.captureScreenshot', { context, origin });
  writeFileSync(path, Buffer.from(result.data, 'base64'));
}
async function settle() {
  await evaluate(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))`);
}
try {
  await send('session.new', { capabilities: { alwaysMatch: { acceptInsecureCerts: true } } });
  await send('session.subscribe', { events: ['log.entryAdded'] });
  ({ context } = await send('browsingContext.create', { type: 'tab' }));
  await send('browsingContext.setViewport', { context, viewport: { width: 1440, height: 1050 }, devicePixelRatio: 1 });
  await send('browsingContext.navigate', { context, url: 'http://127.0.0.1:8081/', wait: 'complete' });
  await evaluate(`(async()=>{await document.fonts.ready;return true})()`);
  assert(await evaluate(`document.fonts.check('400 30px Cormorant','Вива Ёж')&&document.fonts.check('italic 400 30px Cormorant','в ваших руках')&&document.fonts.check('400 14px Golos','Вива Ёж')`), 'Local Cyrillic fonts');
  await screenshot('/tmp/viva-desktop.png');
  const checks = JSON.parse(await evaluate(`JSON.stringify((()=>{
    const out={};
    const visible=()=>[...document.querySelectorAll('.work-card')].filter(c=>!c.hidden);
    out.initialGallery=visible().length===4;
    out.sectionOrder=[...document.querySelectorAll('main > section')].map(el=>el.id||el.classList[0]).join(',')==='cover,services,mood,works,reviews,questions,contacts';
    const reviewIds=[...document.querySelectorAll('.map-review a')].map(link=>new URL(link.href).searchParams.get('reviews[reviewId]'));
    out.reviewLinks=reviewIds.length===6&&reviewIds.every(Boolean)&&new Set(reviewIds).size===6;
    const mark=document.querySelector('.studio-mark img');
    out.studioLogo=mark.naturalWidth===216&&mark.naturalHeight===211&&mark.src.endsWith('/viva-logo-web.png');
    out.staticCatalog=document.querySelectorAll('.service-row').length===19;
    out.seoHeading=document.querySelectorAll('h1').length===1&&document.querySelector('h1').textContent.includes('Маникюр | Педикюр | Брови Адлер')&&document.querySelector('h1').getBoundingClientRect().height>0;
    out.canonical=document.querySelector('link[rel="canonical"]').href==='https://kissdepth.github.io/viva-nail-atelier/';
    out.structuredData=JSON.parse(document.querySelector('#business-schema').textContent)['@graph'].some(n=>n['@type']==='NailSalon'&&n.telephone==='+79952055505');
    document.querySelector('[data-mood="nature"].mood-option').click();
    out.moodChangesPhoto=document.querySelector('#mood-photo').src.endsWith('photo-04.jpg')&&document.querySelector('#mood-heading-word').textContent==='на своей волне.';
    out.moodBooking=document.querySelector('#mood-request').href==='https://n1183817.yclients.ru/';
    out.responsiveMood=document.querySelector('#mood-photo').srcset.includes('photo-04-480.webp');
    out.moodUpdatesTheme=document.querySelector('.mood-studio').dataset.mood==='nature';
    out.moodAria=[...document.querySelectorAll('.mood-option')].filter(b=>b.getAttribute('aria-pressed')==='true').length===1;
    document.querySelector('.mood-option[data-mood="soft"]').click();
    document.querySelector('#show-more').click();
    out.expandGallery=visible().length===8;
    document.querySelector('[data-filter="pedicure"]').click();
    out.pedicureFilter=visible().length===2&&visible().every(c=>c.dataset.kind==='pedicure')&&document.querySelector('#show-more').hidden;
    document.querySelector('[data-filter="manicure"]').click();
    out.manicureFilter=visible().length===4;
    document.querySelector('#show-more').click();
    out.expandFilteredGallery=visible().length===6;
    document.querySelector('[data-filter="all"]').click();
    document.querySelector('[data-service-tab="pedicure"]').click();
    out.pedicureServices=document.querySelectorAll('[data-service-panel]:not([hidden]) .service-row').length===5&&document.querySelector('[data-service-panel]:not([hidden]) .service-name').textContent==='Педикюр без покрытия';
    document.querySelector('[data-service-tab="beauty"]').click();
    out.beautyServices=document.querySelectorAll('[data-service-panel]:not([hidden]) .service-row').length===2&&document.querySelector('[data-service-panel]:not([hidden]) .service-name').textContent==='Коррекция и окрашивание бровей';
    out.serviceBooking=[...document.querySelectorAll('.service-row .service-book')].length===19&&[...document.querySelectorAll('.service-row .service-book')].every(a=>a.href==='https://n1183817.yclients.ru/');
    document.querySelector('[data-service-tab="podology"]').click();
    const podology=document.querySelector('[data-service-panel="podology"]');
    out.podologyCatalog=!podology.hidden&&podology.querySelectorAll('.service-row').length===7;
    const prices=[...podology.querySelectorAll('.service-price')].map(el=>el.textContent.replaceAll(' ',' '));
    out.priceRanges=prices.includes('500–1 000 ₽')&&prices.includes('1 000–2 000 ₽')&&prices.includes('от 4 000 ₽');
    document.querySelector('[data-service-tab="beauty"]').click();
    document.querySelector('[data-service-tab="beauty"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    out.keyboardTabs=document.querySelector('#tab-manicure').getAttribute('aria-selected')==='true'&&document.querySelector('#service-panel').getAttribute('aria-labelledby')==='tab-manicure';
    document.querySelector('.work-card').click();
    out.lightboxOpen=document.querySelector('#photo-dialog').open&&document.body.classList.contains('modal-open');
    out.referenceDownload=document.querySelector('#lightbox-download').download==='viva-photo-01.jpg';
    const first=document.querySelector('#lightbox-photo').src;
    document.querySelector('.lightbox-next').click();
    out.lightboxNext=document.querySelector('#lightbox-photo').src!==first;
    document.querySelector('.lightbox-prev').click();
    out.lightboxPrevious=document.querySelector('#lightbox-photo').src===first;
    out.lightboxBooking=document.querySelector('#lightbox-request').href==='https://n1183817.yclients.ru/';
    document.querySelector('.lightbox-close').click();
    out.lightboxClose=!document.querySelector('#photo-dialog').open;
    out.bookingLinks=[...document.querySelectorAll('.header-book,.welcome-offer .button,.contact-copy>.button')].every(a=>a.href==='https://n1183817.yclients.ru/');
    const faq=document.querySelector('.faq-list details');
    faq.querySelector('summary').click();
    out.faq=faq.open&&faq.textContent.includes('Ульянова, 17');
    faq.open=false;
    document.querySelector('[data-service-shortcut="pedicure"]').click();
    out.faqServiceShortcut=document.querySelector('#tab-pedicure').getAttribute('aria-selected')==='true'&&!document.querySelector('#service-panel-pedicure').hidden;
    document.querySelector('#tab-manicure').click();
    out.contactLinks=document.querySelector('.contact-phone').href==='tel:+79952055505';
    out.validAnchors=[...document.querySelectorAll('a[href^="#"]')].every(a=>!!document.querySelector(a.getAttribute('href')));
    return out;
  })())`));
  for (const [name, value] of Object.entries(checks)) assert(value, name);
  await settle();
  assert(await evaluate(`!document.body.classList.contains('modal-open')`), 'Closing gallery restores scrolling');
  for (const width of [1920,1440,1280,1024,981,980,960,941,940,850,768,701,700,600,561,560,430,390,375,320]) {
    await send('browsingContext.setViewport', { context, viewport: { width, height: width <= 700 ? 844 : 1050 }, devicePixelRatio: 1 });
    await evaluate(`window.scrollTo({top:0,behavior:'instant'});true`);
    await settle();
    const fits = await evaluate(`document.documentElement.scrollWidth<=innerWidth`);
    if (!fits) {
      console.log(await evaluate(`JSON.stringify({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.right>innerWidth+1&&!e.closest('.word-ribbon')}).map(e=>({tag:e.tagName,class:e.className.baseVal??e.className,right:e.getBoundingClientRect().right})).slice(0,18)})`));
      await screenshot('/tmp/viva-overflow.png');
    }
    assert(fits, 'No horizontal overflow at '+width+'px');
    const layout = await evaluate(`(async () => {
      const photo = document.querySelector('#mood-photo');
      photo.loading = 'eager';
      for (const option of document.querySelectorAll('.mood-option')) {
        option.click();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await photo.decode();
        if (getComputedStyle(photo).objectFit !== 'contain') return false;
        const bounds = photo.getBoundingClientRect();
        const holder = photo.parentElement.getBoundingClientRect();
        if (bounds.left < holder.left - 1 || bounds.right > holder.right + 1 ||
            bounds.bottom > holder.bottom + 1 || bounds.top < holder.top - 1) return false;
        if (innerWidth <= 560 && bounds.width < innerWidth * .7) return false;
      }
      document.querySelector('.mood-option').click();
      return true;
    })()`);
    assert(layout, 'Complete photos for all four moods at '+width+'px');
    if (width === 390 || width === 1440) {
      const reachedTop = await evaluate(`(async () => {
        const link = document.querySelector('.back-top');
        link.scrollIntoView({behavior: 'instant', block: 'center'});
        if (window.scrollY <= innerHeight) return 'footer unreachable '+window.scrollY;
        link.click();
        const deadline = performance.now() + 3000;
        while (window.scrollY > 1 && performance.now() < deadline) {
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        return window.scrollY <= 1 || JSON.stringify({ scrollY, hash: location.hash, target:document.getElementById('top').outerHTML.slice(0,80), dest:document.getElementById('top').getBoundingClientRect().top });
      })()`);
      assert(reachedTop === true, 'Footer returns to the top at '+width+'px: '+reachedTop);
    }
    if (width === 390) {
      await screenshot('/tmp/viva-mobile.png');
      await evaluate(`document.querySelector('.mood-photo').scrollIntoView({behavior:'instant',block:'center'});true`);
      await settle();
      await screenshot('/tmp/viva-mood-mobile.png');
      await evaluate(`window.scrollTo({top:0,behavior:'instant'});true`);
      assert(await evaluate(`(()=>{const b=document.querySelector('.menu-toggle');b.click();const open=b.getAttribute('aria-expanded')==='true'&&document.querySelector('#navigation').classList.contains('is-open');document.querySelector('#navigation a').click();return open&&b.getAttribute('aria-expanded')==='false'})()`), 'Mobile navigation');
      assert(await evaluate(`document.querySelector('.header-book').getBoundingClientRect().height >= 38`), 'Mobile header booking');
      await evaluate(`window.scrollTo({top:0,behavior:'instant'});true`);
    }
    if (width === 768) await screenshot('/tmp/viva-tablet.png');
  }
  await send('browsingContext.setViewport', { context, viewport: { width: 1440, height: 1050 }, devicePixelRatio: 1 });
  await evaluate(`(async()=>{document.querySelectorAll('img').forEach(img=>img.loading='eager');await Promise.all([...document.images].filter(img=>img.src).map(img=>img.decode().catch(()=>{})));window.scrollTo({top:0,behavior:'instant'});return true;})()`);
  assert(await evaluate(`[...document.images].filter(img=>img.id!=='lightbox-photo').every(img=>img.complete&&img.naturalWidth>0)`), 'Every photograph loads');
  await screenshot('/tmp/viva-full.png', 'document');
  assert(errors.length===0, 'No browser errors: '+errors.join('; '));
  console.log('Browser verification complete.');
} finally {
  await send('session.end', {}).catch(()=>{});
  socket.close();
}
