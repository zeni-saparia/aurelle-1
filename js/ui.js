// Shared UI helpers: escaping, formatting, icons, toasts, product card markup, reveal-on-scroll.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const money = n => fmt.format(Number(n) || 0);
export const date = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const qs = (s, r = document) => r.querySelector(s);
export const qsa = (s, r = document) => [...r.querySelectorAll(s)];
export const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const P = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M5 12h14M12 5v14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="M20 6 9 17l-5-5"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-1.7 2.7M6.6 6.6A13 13 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/>',
  filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3Z"/>',
};
export const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
export const stars = (r = 0) => `<span class="stars" role="img" aria-label="${Number(r).toFixed(1)} out of 5">${[1, 2, 3, 4, 5].map(i =>
  `<svg viewBox="0 0 24 24" class="${i <= Math.round(r) ? '' : 'off'}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>`).join('')}</span>`;

/** Inline SVG placeholder used when an image URL fails to load. */
export const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#EDE6DB"/><text x="200" y="258" font-family="Georgia,serif" font-size="30" letter-spacing="8" text-anchor="middle" fill="#B4A18E">AURELLE</text></svg>');
document.addEventListener('error', e => { if (e.target.tagName === 'IMG' && e.target.src !== FALLBACK) e.target.src = FALLBACK; }, true);

export function toast(msg, type = 'ok') {
  let box = qs('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.append(box); }
  const t = document.createElement('div'); t.className = 'toast ' + (type === 'error' ? 'error' : ''); t.textContent = msg;
  box.append(t); setTimeout(() => t.remove(), 3800);
}

export const priceHtml = p => p.sale_price
  ? `<span class="price"><span class="now">${money(p.sale_price)}</span><s>${money(p.price)}</s></span>`
  : `<span class="price"><span class="now">${money(p.price)}</span></span>`;

export function badges(p) {
  const out = [];
  if (p.sale_price) out.push('<span class="tag sale">Sale</span>');
  if (p.stock < 1) out.push('<span class="tag">Sold out</span>');
  else if (p.is_bestseller) out.push('<span class="tag">Bestseller</span>');
  else if (Date.now() - new Date(p.created_at) < 14 * 864e5) out.push('<span class="tag">New</span>');
  return out.join('');
}

export function productCard(p, wished = false) {
  const img = p.image || FALLBACK;
  return `<article class="card" data-id="${p.id}">
    <div class="media"><a href="/product.html?slug=${esc(p.slug)}" aria-label="${esc(p.name)}"><img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" width="400" height="500"></a>
      <div class="tags">${badges(p)}</div>
      <button class="wish" data-wish="${p.id}" aria-pressed="${wished}" aria-label="Save ${esc(p.name)} to wishlist">${icon('heart')}</button>
      <div class="actions"><button class="btn light sm" data-add="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>${p.stock < 1 ? 'Sold out' : 'Add to cart'}</button><button class="btn light sm" data-quick="${p.slug}" aria-label="Quick view">${icon('eye')}</button></div></div>
    <div class="meta"><div class="cat">${esc(p.category?.name || '')}</div><h3><a href="/product.html?slug=${esc(p.slug)}">${esc(p.name)}</a></h3>
      ${priceHtml(p)}${p.rating_count ? ` <span class="muted" style="font-size:12.5px">${stars(p.rating_avg)} (${p.rating_count})</span>` : ''}</div></article>`;
}

export const skeletons = (n = 8) => Array.from({ length: n }, () => '<div class="sk-card"><div class="media skeleton"></div><div class="sk-line skeleton"></div><div class="sk-line skeleton" style="width:40%"></div></div>').join('');

export function reveal(root = document) {
  const els = qsa('.reveal:not(.in)', root);
  if (!('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('in'));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  els.forEach(e => io.observe(e));
}

export function buttonBusy(btn, busy, label) {
  if (!btn) return;
  if (busy) { btn.dataset.label = btn.textContent; btn.disabled = true; if (label) btn.textContent = label; }
  else { btn.disabled = false; btn.textContent = btn.dataset.label || btn.textContent; }
}

export const COLLECTIONS = {
  'brass-heritage': 'Brass Heritage', 'festive-glow': 'Festive Glow',
  'botanical-boho': 'Botanical & Boho', 'modern-living': 'Modern Living',
};
