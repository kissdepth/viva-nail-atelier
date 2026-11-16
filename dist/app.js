(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const whatsapp = text => `https://wa.me/79952055505?text=${encodeURIComponent(text)}`;
  const source = 'https://yandex.ru/maps/org/viva/160516354574/gallery/';

  const photos = [
    { file: 'photo-01.jpg', name: 'Фисташковое настроение', alt: 'Фисташковый маникюр квадратной формы' },
    { file: 'photo-02.jpg', name: 'Тот самый френч', alt: 'Классический французский маникюр на розовой базе' },
    { file: 'photo-03.jpg', name: 'Розовый кварц', alt: 'Нежно-розовый маникюр с глянцевым покрытием' },
    { file: 'photo-04.jpg', name: 'Ближе к природе', alt: 'Зелёное покрытие на коротких ногтях' },
    { file: 'photo-05.jpg', name: 'Лёгкий шаг', alt: 'Педикюр с нежным розовым покрытием' },
    { file: 'photo-06.jpg', name: 'Молочный минимализм', alt: 'Молочное покрытие на коротких ногтях' },
    { file: 'photo-07.jpg', name: 'Пудровая нежность', alt: 'Педикюр в пудровом оттенке' },
    { file: 'photo-08.jpg', name: 'Идеальная линия', alt: 'Белый френч на квадратных ногтях' },
    { file: 'photo-09.jpg', name: 'Розовый выходной', alt: 'Педикюр с розовым покрытием' },
    { file: 'photo-10.jpg', name: 'Кофе с молоком', alt: 'Маникюр в оттенке кофе с молоком' }
  ];
  const moods = {
    soft: { word: 'нежной.', name: ['Розовый', 'кварц'], photo: 2, palette: ['#d99dac', '#e7bdc1', '#f0dfd9'], paletteLabel: 'Розовый, пудровый, молочный', description: 'Полупрозрачный розовый и мягкий глянец. Для дней, когда хочется бережности к себе.' },
    classic: { word: 'безупречной.', name: ['Тот самый', 'френч'], photo: 1, palette: ['#c99585', '#e1bcb2', '#faf8f3'], paletteLabel: 'Нюд, розовая база, белый', description: 'Тонкая белая линия и естественная база. Любимая классика, которая подходит к любым планам.' },
    nature: { word: 'на своей волне.', name: ['Ближе', 'к природе'], photo: 3, palette: ['#49652c', '#a2aa7b', '#e1e3cc'], paletteLabel: 'Зелёный, фисташковый, светло-оливковый', description: 'Сочный зелёный на короткой форме. Маленький цветовой акцент для вашего большого настроения.' },
    minimal: { word: 'собой.', name: ['Молочный', 'минимализм'], photo: 5, palette: ['#eae4d6', '#d5c2b1', '#c2a08d'], paletteLabel: 'Молочный, бежевый, тёплый нюд', description: 'Чистая форма и мягкий молочный оттенок. Когда одной красивой детали достаточно.' }
  };

  $$('.mood-option').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.mood;
    const mood = moods[key];
    $$('.mood-option').forEach(option => {
      const active = option === button;
      option.classList.toggle('is-active', active);
      option.setAttribute('aria-pressed', String(active));
    });
    $('.mood-studio').dataset.mood = key;
    $('#mood-heading-word').textContent = mood.word;
    const image = $('#mood-photo');
    image.src = `assets/${photos[mood.photo].file}`;
    image.alt = photos[mood.photo].alt + ' — работа ВИВА';
    const title = $('#mood-name');
    title.replaceChildren(document.createTextNode(mood.name[0]), document.createElement('br'), document.createTextNode(mood.name[1]));
    $('#mood-description').textContent = mood.description;
    const palette = $('#mood-palette');
    palette.replaceChildren(...mood.palette.map(color => {
      const swatch = document.createElement('i');
      swatch.style.background = color;
      return swatch;
    }));
    palette.setAttribute('aria-label', 'Палитра: ' + mood.paletteLabel);
    $('#mood-request').href = whatsapp(`Здравствуйте! Мне понравился маникюр «${mood.name.join(' ')}» на сайте ВИВА. Хочу обсудить похожий дизайн и записаться. Примеры работ: ${source}`);
  }));

  let activeFilter = 'all';
  let expanded = false;
  function updateGallery() {
    const cards = $$('.work-card');
    const matching = cards.filter(card => activeFilter === 'all' || card.dataset.kind === activeFilter);
    cards.forEach(card => {
      const position = matching.indexOf(card);
      card.hidden = position < 0 || (!expanded && position >= 4);
    });
    const shown = Math.min(matching.length, expanded ? matching.length : 4);
    $('#gallery-count').textContent = `ПОКАЗАНО ${shown} ИЗ ${matching.length}`;
    const more = $('#show-more');
    more.hidden = matching.length <= 4;
    more.setAttribute('aria-expanded', String(expanded));
    more.replaceChildren(document.createTextNode(expanded ? 'Оставить избранное ' : 'Ещё немного красоты '));
    const sign = document.createElement('span');
    sign.textContent = expanded ? '−' : '+';
    more.append(sign);
  }
  $$('.filter-group button').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    expanded = false;
    $$('.filter-group button').forEach(option => {
      option.classList.toggle('is-active', option === button);
      option.setAttribute('aria-pressed', String(option === button));
    });
    updateGallery();
  }));
  $('#show-more').addEventListener('click', () => {
    expanded = !expanded;
    updateGallery();
    if (!expanded) $('#works').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
  updateGallery();

  const services = {
    manicure: [
      ['Маникюр без покрытия', 'Комбинированная обработка и SPA-уход', '1 400 ₽'],
      ['Комплекс с покрытием', 'Снятие, маникюр, укрепление и гель-лак Luxio / Beautix', '2 700 ₽'],
      ['Японский маникюр', 'Уход и полировка натуральных ногтей', '1 900 ₽'],
      ['Маникюр с обычным лаком', 'Обработка и покрытие лаком Beautix', '1 800 ₽'],
      ['Наращивание + маникюр', 'Маникюр, моделирование и покрытие гель-лаком', 'от 4 000 ₽'],
      ['Мужской маникюр', 'Комбинированная обработка и массаж рук', '1 600 ₽']
    ],
    pedicure: [
      ['Педикюр + гель-лак', 'Аппаратный уход за стопами и покрытие', '3 500 ₽'],
      ['Педикюр KANE без покрытия', 'Обработка ногтей и кожи стоп', '2 700 ₽'],
      ['Педикюр «Пальчики» + гель-лак', 'Обработка пальчиков и покрытие Luxio / Beautix', '2 700 ₽'],
      ['Японский педикюр', 'Уход и полировка натуральных ногтей', '3 200 ₽'],
      ['Мужской педикюр', 'Аппаратный уход с профессиональными средствами KANE', '3 200 ₽'],
      ['Подологический педикюр', 'Индивидуальный уход за проблемной стопой', 'от 3 200 ₽']
    ],
    beauty: [
      ['Коррекция бровей', 'Работа с формой с помощью пинцета или воска', '800 ₽'],
      ['Коррекция и окрашивание бровей', 'Форма, цвет и ботокс для бровей', '1 600 ₽'],
      ['Долговременная укладка бровей', 'Укладка, коррекция и окрашивание', '2 500 ₽'],
      ['Ламинирование ресниц', 'Ламинирование и ботокс для ресниц', '2 500 ₽']
    ]
  };
  function selectServiceTab(button, focus = false) {
    $$('.service-tabs button').forEach(tab => {
      tab.setAttribute('aria-selected', String(tab === button));
      tab.tabIndex = tab === button ? 0 : -1;
    });
    const panel = $('#service-panel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.replaceChildren(...services[button.dataset.serviceTab].map(([name, description, price]) => {
      const row = document.createElement('div');
      row.className = 'service-row';
      const copy = document.createElement('div');
      const title = document.createElement('h3');
      title.className = 'service-name';
      title.textContent = name;
      const detail = document.createElement('p');
      detail.className = 'service-description';
      detail.textContent = description;
      copy.append(title, detail);
      const amount = document.createElement('span');
      amount.className = 'service-price';
      amount.textContent = price;
      const link = document.createElement('a');
      link.className = 'service-book';
      link.href = whatsapp(`Здравствуйте! Хочу записаться на услугу «${name}». Подскажите, пожалуйста, свободное время и актуальную стоимость.`);
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', `Записаться: ${name}, ${price} — обсудить в WhatsApp`);
      link.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#icon-arrow"/></svg>';
      row.append(copy, amount, link);
      return row;
    }));
    if (focus) button.focus();
  }
  $$('.service-tabs button').forEach((button, index, tabs) => {
    button.addEventListener('click', () => selectServiceTab(button));
    button.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') target = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs[tabs.length - 1];
      if (target) { event.preventDefault(); selectServiceTab(target, true); }
    });
  });
  selectServiceTab($('.service-tabs button'));

  const dialog = $('#photo-dialog');
  let currentPhoto = 0;
  let returnFocus;
  let lightboxSet = [];
  function renderPhoto() {
    const photo = photos[currentPhoto];
    const image = $('#lightbox-photo');
    image.src = `assets/${photo.file}`;
    image.alt = photo.alt + ' — работа ВИВА';
    $('#lightbox-title').textContent = photo.name;
    const position = lightboxSet.indexOf(currentPhoto);
    $('#lightbox-index').textContent = ` · ${position + 1} / ${lightboxSet.length}`;
    const download = $('#lightbox-download');
    download.href = `assets/${photo.file}`;
    download.download = `viva-${photo.file}`;
    $('#lightbox-request').href = whatsapp(`Здравствуйте! Мне понравился дизайн «${photo.name}» на сайте ВИВА. Хочу такой маникюр / педикюр. Подскажите, пожалуйста, свободное время. Фото работы: ${new URL('assets/' + photo.file, location.href).href}`);
    $('.lightbox-prev').hidden = lightboxSet.length < 2;
    $('.lightbox-next').hidden = lightboxSet.length < 2;
  }
  function stepPhoto(direction) {
    const index = lightboxSet.indexOf(currentPhoto);
    currentPhoto = lightboxSet[(index + direction + lightboxSet.length) % lightboxSet.length];
    renderPhoto();
  }
  $$('[data-photo]').forEach(button => button.addEventListener('click', () => {
    currentPhoto = Number(button.dataset.photo);
    lightboxSet = button.classList.contains('work-card')
      ? $$('.work-card').filter(card => !card.hidden).map(card => Number(card.dataset.photo))
      : $$('.work-card').map(card => Number(card.dataset.photo));
    returnFocus = button;
    renderPhoto();
    dialog.showModal();
    document.body.classList.add('modal-open');
  }));
  $('.lightbox-close').addEventListener('click', () => dialog.close());
  $('.lightbox-prev').addEventListener('click', () => stepPhoto(-1));
  $('.lightbox-next').addEventListener('click', () => stepPhoto(1));
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }});
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); returnFocus?.focus({ preventScroll: true }); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); stepPhoto(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); stepPhoto(1); }
  });

  const menu = $('.menu-toggle');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Открыть меню');
    $('#navigation').classList.remove('is-open');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    $('#navigation').classList.toggle('is-open', open);
  });
  $$('#navigation a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
  matchMedia('(min-width: 701px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  $('#year').textContent = String(new Date().getFullYear());
})();
