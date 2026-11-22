import { api } from '../api.js';
import { mountLayout, syncWishButtons } from '../layout.js';
import { state, remember, addToCart, setQty, toggleWish } from '../store.js';
import { esc, qs, qsa, money, date, stars, icon, priceHtml, productCard, toast, FALLBACK, COLLECTIONS } from '../ui.js';

mountLayout('/shop.html');
const slug = new URLSearchParams(location.search).get('slug');
const root = qs('#pd-root');

async function load() {
  if (!slug) return root.innerHTML = '<div class="empty"><h3>Product not found</h3><a class="btn" href="/shop.html">Back to shop</a></div>';
  try {
    const { product: p, related } = await api('/products/' + encodeURIComponent(slug));
    remember([p, ...related]); document.title = p.name + ' — AURELLE'; render(p, related);
  } catch (e) { root.innerHTML = `<div class="empty"><h3>We couldn’t find that piece</h3><p>${esc(e.message)}</p><a class="btn" href="/shop.html">Back to shop</a></div>`; }
}

function render(p, related) {
  const imgs = p.images.length ? p.images : [{ url: FALLBACK, alt: p.name }];
  const specs = Object.entries(p.specs || {});
  const rows = [['Materials', p.materials], ['Dimensions', p.dimensions], ['SKU', p.sku], ...specs].filter(r => r[1]);
  const out = p.stock < 1;
  root.innerHTML = `<div class="crumbs" style="padding-top:28px"><a href="/">Home</a> / <a href="/shop.html">Shop</a> / <a href="/shop.html?category=${esc(p.category.slug)}">${esc(p.category.name)}</a> / ${esc(p.name)}</div>
  <div class="pd" style="padding-top:8px"><div><div class="gallery-main" id="main-img"><img src="${esc(imgs[0].url)}" alt="${esc(p.name)}"></div>
    <div class="thumbs">${imgs.map((i, n) => `<button data-i="${n}" aria-current="${n === 0}" aria-label="Show image ${n + 1}"><img src="${esc(i.url)}" alt=""></button>`).join('')}</div></div>
  <div class="pd-info"><p class="muted" style="margin:0">${esc(p.category.name)}${p.collection ? ` · ${esc(COLLECTIONS[p.collection] || '')}` : ''}</p><h1>${esc(p.name)}</h1>
    <div>${p.rating_count ? `${stars(p.rating_avg)} <a href="#reviews" class="muted" style="font-size:13.5px">${p.rating_count} review${p.rating_count > 1 ? 's' : ''}</a>` : '<span class="muted" style="font-size:13.5px">No reviews yet</span>'}</div>
    <div class="pd-price">${priceHtml(p)}${p.sale_price ? ` <span class="tag sale" style="margin-left:8px">Save ${Math.round((1 - p.sale_price / p.price) * 100)}%</span>` : ''}</div>
    <p>${esc(p.description)}</p>
    ${p.colors.length ? `<p style="margin:0 0 6px;font-size:14px"><strong>Available in</strong> ${p.colors.map(esc).join(', ')}</p>` : ''}
    <p style="margin:0 0 4px;font-size:14px">${out ? '<span class="sold-out">Sold out</span>' : p.stock <= 5 ? `<span style="color:var(--gold)">Only ${p.stock} left</span>` : '<span style="color:var(--ok)">In stock</span>'}</p>
    <div class="buy"><div class="qty"><button id="dec" aria-label="Decrease quantity">${icon('minus')}</button><span id="qv" aria-live="polite">1</span><button id="inc" aria-label="Increase quantity">${icon('plus')}</button></div>
      <button class="btn" id="add" ${out ? 'disabled' : ''}>${out ? 'Sold out' : 'Add to cart'}</button></div>
    <div style="display:grid;grid-template-columns:1fr auto;gap:12px;margin-bottom:28px"><button class="btn ghost" id="buy" ${out ? 'disabled' : ''}>Buy now</button><button class="btn ghost" data-wish="${p.id}" aria-pressed="${state.wish.has(p.id)}" aria-label="Save to wishlist" style="padding:0 16px">${icon('heart')}</button></div>
    <table class="spec"><tbody>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></div></div>
  <section class="section" id="reviews" style="padding-top:0"><div class="section-head"><h2>Customer reviews</h2></div><div id="rv"></div><div id="rv-form"></div></section>
  ${related.length ? `<section class="section band" style="margin:0 calc(var(--gutter) * -1);padding-left:var(--gutter);padding-right:var(--gutter)"><h2 style="margin-bottom:36px">You may also like</h2><div class="grid">${related.map(r => productCard(r, state.wish.has(r.id))).join('')}</div></section>` : ''}`;

  let qty = 1; const max = Math.max(1, p.stock);
  const setQ = n => { qty = Math.min(max, Math.max(1, n)); qs('#qv').textContent = qty; };
  qs('#inc').onclick = () => { if (qty >= p.stock) toast(`Only ${p.stock} available.`, 'error'); setQ(qty + 1); }; qs('#dec').onclick = () => setQ(qty - 1);
  qs('#add').onclick = async e => { e.target.disabled = true; try { await addToCart(p, qty); } catch (err) { toast(err.message, 'error'); } e.target.disabled = false; };
  qs('#buy').onclick = async () => { try { const have = state.cart.lines.find(l => l.product_id === p.id)?.quantity || 0; await setQty(p.id, Math.min(p.stock, Math.max(have, qty)), p.stock); location.href = '/checkout.html'; } catch (err) { toast(err.message, 'error'); } };
  qsa('.thumbs button').forEach(b => b.onclick = () => { qs('#main-img img').src = imgs[b.dataset.i].url; qsa('.thumbs button').forEach(x => x.setAttribute('aria-current', x === b)); });
  const main = qs('#main-img'), lb = qs('#lb');
  main.onclick = () => { lb.querySelector('img').src = main.querySelector('img').src; lb.classList.add('open'); };
  main.onmousemove = e => { const r = main.getBoundingClientRect(), im = main.querySelector('img'); im.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; im.style.transform = 'scale(1.6)'; };
  main.onmouseleave = () => { main.querySelector('img').style.transform = ''; };
  lb.onclick = () => lb.classList.remove('open');
  syncWishButtons(); reviews(p);
}

async function reviews(p) {
  const list = qs('#rv'), form = qs('#rv-form');
  try {
    const { items } = await api(`/products/${p.id}/reviews`);
    list.innerHTML = items.length ? items.map(r => `<div class="review">${stars(r.rating)}<h4>${esc(r.title || '')}</h4><p style="margin:0 0 6px">${esc(r.body)}</p><span class="muted" style="font-size:13px">${esc(r.profiles?.full_name || 'Customer')} · ${date(r.created_at)}</span></div>`).join('') : '<p class="muted">Be the first to review this piece.</p>';
  } catch { list.innerHTML = ''; }
  form.innerHTML = state.user ? `<form id="rf" style="max-width:560px;margin-top:28px"><h3 style="margin-bottom:14px">Write a review</h3>
    <div class="field"><label for="rr">Rating</label><select id="rr"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div>
    <div class="field"><label for="rt">Title</label><input id="rt" maxlength="80"></div><div class="field"><label for="rb">Review</label><textarea id="rb" maxlength="1000"></textarea></div><button class="btn" type="submit">Submit review</button></form>`
    : `<p style="margin-top:20px"><a class="link" href="/login.html" onclick="sessionStorage.setItem('aurelle.next',location.pathname+location.search)">Sign in</a> to write a review.</p>`;
  qs('#rf')?.addEventListener('submit', async e => {
    e.preventDefault();
    try { await api(`/products/${p.id}/reviews`, { method: 'POST', body: { rating: +qs('#rr').value, title: qs('#rt').value, body: qs('#rb').value } }); toast('Thank you for your review.'); load(); }
    catch (err) { toast(err.message, 'error'); }
  });
}
load();
