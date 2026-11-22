import { api } from '../api.js';
import { mountLayout } from '../layout.js';
import { esc, FALLBACK, qs, reveal } from '../ui.js';

mountLayout('/categories.html');
api('/categories').then(r => {
  qs('#cats').innerHTML = r.items.map(c => `<a class="cat-tile reveal" href="/shop.html?category=${esc(c.slug)}"><img src="${esc(c.image_url || FALLBACK)}" alt="" loading="lazy"><div><h3>${esc(c.name)}</h3><small>${esc(c.description)} · ${c.product_count} pieces</small></div></a>`).join('');
  reveal();
}).catch(e => { qs('#cats').innerHTML = `<p class="warn">${esc(e.message)}</p>`; });
