// Shop + category browsing. Every filter maps to a real API query parameter and is mirrored in the URL.
import { api } from '../api.js';
import { mountLayout, syncWishButtons } from '../layout.js';
import { state, remember } from '../store.js';
import { esc, qs, qsa, productCard, skeletons, debounce, COLLECTIONS, FALLBACK } from '../ui.js';

mountLayout('/shop.html');
const url = new URL(location.href);
const F = { category: url.searchParams.get('category') || '', collection: url.searchParams.get('collection') || '',
  price_min: url.searchParams.get('price_min') || '', price_max: url.searchParams.get('price_max') || '', in_stock: url.searchParams.get('in_stock') || '',
  bestseller: url.searchParams.get('bestseller') || '', featured: url.searchParams.get('featured') || '', new: url.searchParams.get('new') || '', sort: url.searchParams.get('sort') || 'newest' };
let page = 1, loaded = 0, total = 0, cats = [], seq = 0;

const grid = qs('#grid'), more = qs('#more');
qs('#sort').value = F.sort;

function syncUrl() {
  const p = new URLSearchParams(); for (const [k, v] of Object.entries(F)) if (v && !(k === 'sort' && v === 'newest')) p.set(k, v);
  history.replaceState(null, '', location.pathname + ([...p].length ? '?' + p : ''));
}

function renderHead() {
  const c = cats.find(x => x.slug === F.category);
  const title = c ? c.name : F.collection ? (COLLECTIONS[F.collection] || 'Collection') : F.bestseller ? 'Bestsellers' : 'Shop';
  document.title = title + ' — AURELLE';
  qs('#title').textContent = title; qs('#crumb').textContent = title;
  qs('#subtitle').textContent = c ? c.description : F.collection ? 'An edited point of view, ready to bring home.' : 'Everything in the collection, filtered your way.';
  qs('#banner').innerHTML = c ? `<div class="banner"><img src="${esc(c.image_url || FALLBACK)}" alt=""><div class="wrap"><h2>${esc(c.name)}</h2><p style="margin:6px 0 0">${c.product_count} pieces</p></div></div>` : '';
}

function renderFilters() {
  const chk = (k, label) => `<label><input type="checkbox" data-f="${k}" ${F[k] ? 'checked' : ''}> ${label}</label>`;
  qs('#filters').innerHTML = `<div><h4>Category</h4><label><input type="radio" name="cat" value="" ${!F.category ? 'checked' : ''}> All</label>
    ${cats.map(c => `<label><input type="radio" name="cat" value="${esc(c.slug)}" ${F.category === c.slug ? 'checked' : ''}> ${esc(c.name)} <span class="muted">(${c.product_count})</span></label>`).join('')}</div>
    <div><h4>Price (₹)</h4><div class="price-row"><input type="number" min="0" id="pmin" placeholder="Min" value="${esc(F.price_min)}" aria-label="Minimum price" style="height:40px;border:1px solid var(--line);padding:0 8px;background:var(--ivory)"><span>–</span><input type="number" min="0" id="pmax" placeholder="Max" value="${esc(F.price_max)}" aria-label="Maximum price" style="height:40px;border:1px solid var(--line);padding:0 8px;background:var(--ivory)"></div></div>
    <div><h4>Show</h4>${chk('in_stock', 'In stock only')}${chk('bestseller', 'Bestsellers')}${chk('new', 'New arrivals')}${chk('featured', 'Featured')}</div>
    <button class="btn ghost sm" id="clear">Clear all filters</button>`;
}

async function load(reset) {
  const my = ++seq;
  if (reset) { page = 1; loaded = 0; grid.innerHTML = skeletons(8); more.hidden = true; }
  more.disabled = true;
  try {
    const r = await api('/products', { query: { ...F, page, per_page: 12 } });
    if (my !== seq) return;
    remember(r.items); total = r.total;
    if (reset) grid.innerHTML = '';
    grid.insertAdjacentHTML('beforeend', r.items.map(p => productCard(p, state.wish.has(p.id))).join(''));
    loaded += r.items.length;
    qs('#count').textContent = `${total} ${total === 1 ? 'piece' : 'pieces'}`;
    if (!total) grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Nothing matches yet</h3><p>Try removing a filter or browsing another category.</p><button class="btn ghost" id="clear2">Clear filters</button></div>`;
    more.hidden = loaded >= total; syncWishButtons();
  } catch (e) { if (my === seq) grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>We couldn’t load products</h3><p>${esc(e.message)}</p></div>`; }
  more.disabled = false;
}
const refresh = () => { syncUrl(); renderHead(); load(true); };
const clear = () => { Object.keys(F).forEach(k => F[k] = k === 'sort' ? 'newest' : ''); qs('#sort').value = 'newest'; renderFilters(); refresh(); };

document.addEventListener('click', e => { if (e.target.id === 'clear' || e.target.id === 'clear2') clear(); });
qs('#filters').addEventListener('change', e => {
  if (e.target.name === 'cat') { F.category = e.target.value; F.collection = ''; }
  else if (e.target.dataset.f) F[e.target.dataset.f] = e.target.checked ? '1' : '';
  else if (e.target.id === 'pmin') F.price_min = e.target.value; else if (e.target.id === 'pmax') F.price_max = e.target.value;
  refresh(); closeF();
});
qs('#sort').addEventListener('change', e => { F.sort = e.target.value; refresh(); });
more.addEventListener('click', () => { page++; load(false); });
const closeF = () => { qs('#filters').classList.remove('open'); qs('#fscrim').classList.remove('open'); };
qs('#ftoggle').addEventListener('click', () => { qs('#filters').classList.add('open'); qs('#fscrim').classList.add('open'); });
qs('#fscrim').addEventListener('click', closeF);

(async () => {
  try { cats = (await api('/categories')).items; } catch { /* filters degrade gracefully */ }
  renderFilters(); renderHead(); load(true);
})();
