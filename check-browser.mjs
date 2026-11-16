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
    document.querySelector('[data-mood="nature"].mood-option').click();
    out.moodChangesPhoto=document.querySelector('#mood-photo').src.endsWith('photo-04.jpg')&&document.querySelector('#mood-heading-word').textContent==='на своей волне.';
    out.moodUpdatesMessage=decodeURIComponent(document.querySelector('#mood-request').href).includes('Ближе к природе');
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
    out.pedicureServices=document.querySelectorAll('.service-row').length===6&&document.querySelector('.service-name').textContent==='Педикюр + гель-лак';
    document.querySelector('[data-service-tab="beauty"]').click();
    out.beautyServices=document.querySelectorAll('.service-row').length===4&&document.querySelector('.service-name').textContent==='Коррекция бровей';
    out.serviceMessage=decodeURIComponent(document.querySelector('.service-book').href).includes('Коррекция бровей');
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
    out.lightboxMessage=decodeURIComponent(document.querySelector('#lightbox-request').href).includes('Фисташковое настроение');
    document.querySelector('.lightbox-close').click();
    out.lightboxClose=!document.querySelector('#photo-dialog').open;
    out.bookingLinks=[...document.querySelectorAll('.header-book,.hero-actions .button,.contact-copy>.button,.mobile-booking .button')].every(a=>a.href==='https://n1183817.yclients.ru/');
    out.contactLinks=document.querySelector('.contact-phone').href==='tel:+79952055505';
    out.validAnchors=[...document.querySelectorAll('a[href^="#"]')].every(a=>!!document.querySelector(a.getAttribute('href')));
    return out;
  })())`));
  for (const [name, value] of Object.entries(checks)) assert(value, name);
  await settle();
  assert(await evaluate(`!document.body.classList.contains('modal-open')`), 'Closing gallery restores scrolling');
  for (const width of [1440,1280,1024,960,850,768,700,600,430,390,375,320]) {
    await send('browsingContext.setViewport', { context, viewport: { width, height: width <= 700 ? 844 : 1050 }, devicePixelRatio: 1 });
    await evaluate(`window.scrollTo({top:0,behavior:'instant'});true`);
    await settle();
    const fits = await evaluate(`document.documentElement.scrollWidth<=innerWidth`);
    if (!fits) {
      console.log(await evaluate(`JSON.stringify({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.right>innerWidth+1&&!e.closest('.word-ribbon')}).map(e=>({tag:e.tagName,class:e.className.baseVal??e.className,right:e.getBoundingClientRect().right})).slice(0,18)})`));
      await screenshot('/tmp/viva-overflow.png');
    }
    assert(fits, 'No horizontal overflow at '+width+'px');
    if (width === 390) {
      await screenshot('/tmp/viva-mobile.png');
      assert(await evaluate(`(()=>{const b=document.querySelector('.menu-toggle');b.click();const open=b.getAttribute('aria-expanded')==='true'&&document.querySelector('#navigation').classList.contains('is-open');document.querySelector('#navigation a').click();return open&&b.getAttribute('aria-expanded')==='false'})()`), 'Mobile navigation');
      assert(await evaluate(`getComputedStyle(document.querySelector('.mobile-booking')).display!=='none'`), 'Mobile booking bar');
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
