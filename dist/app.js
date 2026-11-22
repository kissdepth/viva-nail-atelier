(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

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
    const stem = photos[mood.photo].file.replace('.jpg', '');
    const maxWidth = mood.photo === 5 ? 830 : 960;
    image.srcset = `assets/${stem}-480.webp 480w, assets/${stem}-960.webp ${maxWidth}w`;
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

  const servicePanels = $$('[data-service-panel]');
  document.documentElement.classList.add('has-js');
  function selectServiceTab(button, focus = false) {
    $$('.service-tabs button').forEach(tab => {
      tab.setAttribute('aria-selected', String(tab === button));
      tab.tabIndex = tab === button ? 0 : -1;
    });
    servicePanels.forEach(panel => {
      panel.hidden = panel.dataset.servicePanel !== button.dataset.serviceTab;
    });
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
  $$('[data-service-shortcut]').forEach(link => link.addEventListener('click', () => {
    const tab = $(`[data-service-tab="${link.dataset.serviceShortcut}"]`);
    if (tab) selectServiceTab(tab);
  }));

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
