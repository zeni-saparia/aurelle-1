import { api } from '../api.js';
import { mountLayout, syncWishButtons } from '../layout.js';
import { remember } from '../store.js';
import { esc, productCard, skeletons, FALLBACK, toast, reveal, qs } from '../ui.js';
import { state } from '../store.js';

mountLayout('/');

(async () => {
  qs('#best').innerHTML = skeletons(4);
  try {
    const [cats, best] = await Promise.all([api('/categories'), api('/products', { query: { bestseller: 1, per_page: 8, sort: 'popular' } })]);
    qs('#cats').innerHTML = cats.items.slice(0, 8).map(c => `<a class="cat-tile reveal" href="/shop.html?category=${esc(c.slug)}"><img src="${esc(c.image_url || FALLBACK)}" alt="" loading="lazy"><div><h3>${esc(c.name)}</h3><small>${c.product_count} pieces</small></div></a>`).join('');
    remember(best.items);
    qs('#best').innerHTML = best.items.map(p => productCard(p, state.wish.has(p.id))).join('') || '<p class="muted">New pieces arrive soon.</p>';
    syncWishButtons(); reveal();
  } catch (e) { qs('#best').innerHTML = `<p class="warn">${esc(e.message)}</p>`; }
})();

qs('#news').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = qs('#news-msg'), email = e.target.email.value.trim();
  try { const r = await api('/newsletter', { method: 'POST', body: { email } }); msg.textContent = r.message; e.target.reset(); }
  catch (err) { msg.textContent = err.message; }
});
