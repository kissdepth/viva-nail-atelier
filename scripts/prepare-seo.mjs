import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(readFileSync(resolve(root, 'content/seo.json'), 'utf8'));
const indexPath = resolve(root, 'dist/index.html');
let html = readFileSync(indexPath, 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const url = config.url;
const business = config.business;
const asset = path => new URL(path, url).href;
const panelId = key => key === 'manicure' ? 'service-panel' : `service-panel-${key}`;
const rubles = new Intl.NumberFormat('ru-RU');
function priceText(service) {
  const minimum = rubles.format(service.price);
  if (service.maxPrice) return `${minimum}–${rubles.format(service.maxPrice)} ₽`;
  return `${service.from ? 'от ' : ''}${minimum} ₽`;
}
function calendarUrl(serviceId) {
  const calendar = new URL('company/1085300/personal/select-time', business.booking);
  calendar.searchParams.set('o', `m-1s${serviceId}`);
  return calendar.href;
}
function renderService(service) {
  const price = priceText(service);
  const name = escape(service.name);
  const heading = `<h4 class="service-name">${name}</h4>`;
  const description = service.description ? `<p class="service-description">${escape(service.description)}</p>` : '';
  const priceTag = `<span class="service-price">${price}</span>`;
  if (service.bookingOptions || service.bookingNote) {
    const choices = service.bookingOptions
      ? service.bookingOptions.map(option => `<a href="${calendarUrl(option.bookingId)}" target="_blank" rel="noopener" aria-label="${name} — ${escape(option.label)}">${escape(option.label)}</a>`).join('')
      : `<a href="${escape(business.booking)}" target="_blank" rel="noopener">${escape(service.bookingNote)}</a>`;
    return `          <div class="service-row with-options"><div>${heading}${description}<div class="booking-options">${choices}</div></div>${priceTag}</div>`;
  }
  if (!service.bookingId) throw new Error(`Missing booking destination for ${service.name}`);
  const link = `<a class="service-book" href="${calendarUrl(service.bookingId)}" target="_blank" rel="noopener" aria-label="Выбрать дату — ${name}, ${price}"><svg class="icon" aria-hidden="true"><use href="#icon-arrow"/></svg></a>`;
  return `          <div class="service-row"><div>${heading}${description}</div>${priceTag}${link}</div>`;
}
function region(name, content) {
  const pattern = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`);
  if (!pattern.test(html)) throw new Error(`Missing source region: ${name}`);
  html = html.replace(pattern, `<!-- ${name}:start -->\n${content}\n<!-- ${name}:end -->`);
}

region('seo-head', `  <title>${escape(config.title)}</title>
  <meta name="description" content="${escape(config.description)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:title" content="${escape(config.title)}">
  <meta property="og:description" content="${escape(config.description)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="ВИВА — ногтевая студия в Адлере">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${asset('assets/photo-03.jpg')}">
  <meta property="og:image:alt" content="Розовый маникюр — работа мастеров студии ВИВА в Адлере">
  <meta property="og:image:width" content="1039">
  <meta property="og:image:height" content="1280">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(config.title)}">
  <meta name="twitter:description" content="${escape(config.description)}">
  <meta name="twitter:image" content="${asset('assets/photo-03.jpg')}">
  <meta name="twitter:image:alt" content="Розовый маникюр студии ВИВА в Адлере">
  <link rel="preload" as="image" href="assets/photo-03-960.webp" imagesrcset="assets/photo-03-480.webp 480w, assets/photo-03-960.webp 960w" imagesizes="(max-width: 560px) 61vw, (max-width: 980px) 35vw, min(34vw, 435px)" fetchpriority="high">`);

region('service-panels', config.services.map(group => `        <div id="${panelId(group.key)}" class="service-panel" data-service-panel="${group.key}" role="tabpanel" aria-labelledby="tab-${group.key}" tabindex="0">
          <h3 class="service-category-heading">${escape(group.name)} в Адлере</h3>
${group.note ? `          <p class="promo-terms">${escape(group.note)}</p>\n` : ''}${group.items.map(renderService).join('\n')}
        </div>`).join('\n'));

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite', '@id': url + '#website', url,
      name: 'ВИВА — ногтевая студия в Адлере', alternateName: 'VIVA',
      inLanguage: 'ru-RU', publisher: { '@id': url + '#salon' }
    },
    {
      '@type': 'WebPage', '@id': url + '#webpage', url, name: config.title,
      description: config.description, inLanguage: 'ru-RU',
      isPartOf: { '@id': url + '#website' }, mainEntity: { '@id': url + '#salon' },
      primaryImageOfPage: { '@id': url + '#primaryimage' }
    },
    {
      '@type': 'ImageObject', '@id': url + '#primaryimage',
      contentUrl: asset('assets/photo-03.jpg'), width: 1039, height: 1280,
      caption: 'Розовый маникюр — работа студии ВИВА в Адлере'
    },
    {
      '@type': 'NailSalon', '@id': url + '#salon', name: business.name,
      alternateName: business.alternateName, logo: asset('assets/viva-logo.png'), url, description: config.description,
      telephone: business.telephone,
      image: [asset('assets/photo-03.jpg'), asset('assets/photo-13.jpg'), asset('assets/photo-14.jpg')],
      address: {
        '@type': 'PostalAddress', streetAddress: business.streetAddress,
        addressLocality: business.addressLocality, addressRegion: business.addressRegion,
        postalCode: business.postalCode, addressCountry: business.addressCountry
      },
      geo: { '@type': 'GeoCoordinates', latitude: business.latitude, longitude: business.longitude },
      hasMap: business.map, sameAs: business.sameAs,
      openingHoursSpecification: [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => 'https://schema.org/' + day),
        opens: business.opens, closes: business.closes
      }],
      areaServed: [{ '@type': 'Place', name: 'Адлер, Сочи' }],
      currenciesAccepted: 'RUB', paymentAccepted: 'Наличные, банковские карты, СБП',
      hasOfferCatalog: { '@id': url + '#services' },
      potentialAction: { '@type': 'ReserveAction', target: business.booking }
    },
    {
      '@type': 'OfferCatalog', '@id': url + '#services', name: 'Услуги и цены студии ВИВА в Адлере',
      itemListElement: config.services.map(group => ({
        '@type': 'OfferCatalog', name: group.name,
        itemListElement: group.items.map(service => ({
          '@type': 'Offer', url: url + '#services', priceCurrency: 'RUB',
          ...(service.from || service.maxPrice
            ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: service.price, ...(service.maxPrice ? { maxPrice: service.maxPrice } : {}), priceCurrency: 'RUB' } }
            : { price: String(service.price) }),
          itemOffered: {
            '@type': 'Service', name: service.name, description: service.description,
            serviceType: group.name, provider: { '@id': url + '#salon' }, areaServed: 'Адлер, Сочи'
          }
        }))
      }))
    }
  ]
};
region('structured-data', `  <script type="application/ld+json" id="business-schema">\n${JSON.stringify(graph, null, 2).replace(/</g, '\\u003c')}\n  </script>`);
writeFileSync(indexPath, html);
writeFileSync(resolve(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${url}sitemap.xml\n`);
writeFileSync(resolve(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${url}</loc>\n    <lastmod>${config.modified}</lastmod>\n  </url>\n</urlset>\n`);
console.log(`SEO assets prepared: ${config.services.reduce((total, group) => total + group.items.length, 0)} services in static HTML, structured data, robots.txt and sitemap.xml.`);
