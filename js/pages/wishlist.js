import { api } from '../api.js';
import { mountLayout } from '../layout.js';
import { state, remember, addToCart, toggleWish } from '../store.js';
import { esc, qs, priceHtml, FALLBACK, toast } from '../ui.js';

const box = qs('#wl');
mountLayout('').then(async () => {
  if (!state.user) { sessionStorage.setItem('aurelle.next', '/wishlist.html'); return location.href = '/login.html'; }
  await load();
});
async function load() {
  try {
    const { items } = await api('/wishlist'); remember(items);
    box.innerHTML = items.length ? `<div class="grid">${items.map(p => `<article class="card"><div class="media"><a href="/product.html?slug=${esc(p.slug)}"><img src="${esc(p.image || FALLBACK)}" alt="${esc(p.name)}" loading="lazy"></a></div>
      <div class="meta"><div class="cat">${esc(p.category?.name || '')}</div><h3>${esc(p.name)}</h3>${priceHtml(p)}<p style="margin:4px 0 12px;font-size:13px">${p.stock < 1 ? '<span class="sold-out">Sold out</span>' : '<span style="color:var(--ok)">In stock</span>'}</p>
      <div style="display:flex;gap:8px"><button class="btn sm" data-move="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>Move to cart</button><button class="btn ghost sm" data-del="${p.id}">Remove</button></div></div></article>`).join('')}</div>`
      : '<div class="empty"><h3>Nothing saved yet</h3><p>Tap the heart on any piece to keep it here.</p><a class="btn" href="/shop.html">Discover pieces</a></div>';
  } catch (e) { box.innerHTML = `<p class="warn">${esc(e.message)}</p>`; }
}
box.addEventListener('click', async e => {
  const mv = e.target.closest('[data-move]'), del = e.target.closest('[data-del]');
  try {
    if (mv) { const {known} = await import('../store.js'); if (await addToCart(known.get(mv.dataset.move), 1)) { await toggleWish(mv.dataset.move); load(); } }
    if (del) { await toggleWish(del.dataset.del); load(); }
  } catch (err) { toast(err.message, 'error'); }
});
