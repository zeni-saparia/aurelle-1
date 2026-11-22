// Site chrome shared by every page: announcement bar, navbar, cart drawer, mobile menu, footer.
import { api } from './api.js';
import { state, init, subscribe, cartCount, setQty, addToCart, toggleWish, known, remember, logout } from './store.js';
import { esc, money, icon, qs, qsa, toast, reveal, FALLBACK, stars, priceHtml } from './ui.js';

const NAV = [['Home', '/'], ['Shop', '/shop.html'], ['Categories', '/categories.html'], ['Collections', '/collections.html'], ['About', '/about.html']];

export function cartLinesHtml(lines) {
  return lines.map(l => l.issue === 'unavailable'
    ? `<div class="line"><div></div><div><h4>Item no longer available</h4><p class="warn">Remove it to continue.</p></div><button data-remove="${l.product_id}" aria-label="Remove item">${icon('trash')}</button></div>`
    : `<div class="line"><a href="/product.html?slug=${esc(l.slug)}"><img src="${esc(l.image || FALLBACK)}" alt="${esc(l.name)}" width="78" height="98"></a>
      <div><h4><a href="/product.html?slug=${esc(l.slug)}">${esc(l.name)}</a></h4>
        <div class="price">${money(l.unit_price)}${l.compare_at ? `<s>${money(l.compare_at)}</s>` : ''}</div>
        <div class="qty"><button data-dec="${l.product_id}" data-q="${l.quantity}" data-stock="${l.stock}" aria-label="Decrease quantity">${icon('minus')}</button><span>${l.quantity}</span><button data-inc="${l.product_id}" data-q="${l.quantity}" data-stock="${l.stock}" aria-label="Increase quantity" ${l.quantity >= l.stock ? 'disabled' : ''}>${icon('plus')}</button></div>
        ${l.issue ? `<p class="warn">${l.issue === 'out_of_stock' ? 'Sold out — remove to continue.' : `Only ${l.stock} in stock — reduce the quantity.`}</p>` : ''}</div>
      <div style="text-align:right"><div>${money(l.line_total)}</div><button class="muted" data-remove="${l.product_id}" aria-label="Remove ${esc(l.name)}" style="margin-top:10px">${icon('trash')}</button></div></div>`).join('');
}

/** Wire +/-/remove buttons inside any container (drawer, cart page, checkout). */
export function bindCartControls(root) {
  root.addEventListener('click', async e => {
    const b = e.target.closest('[data-inc],[data-dec],[data-remove]'); if (!b) return;
    const id = b.dataset.inc || b.dataset.dec || b.dataset.remove, q = +b.dataset.q, stock = +b.dataset.stock || 99;
    try { await setQty(id, b.dataset.inc ? q + 1 : b.dataset.dec ? q - 1 : 0, stock); } catch (err) { toast(err.message, 'error'); }
  });
}

export function totalsHtml(c) {
  const free = c.free_shipping_threshold;
  return `<div class="totals"><div><span>Subtotal</span><span>${money(c.subtotal)}</span></div>
    ${c.discount > 0 ? `<div><span>Discount (${esc(c.coupon)})</span><span>−${money(c.discount)}</span></div>` : ''}
    <div><span>Shipping</span><span>${c.shipping > 0 ? money(c.shipping) : c.subtotal > 0 ? 'Free' : '—'}</span></div>
    <div class="grand"><span>Total</span><span>${money(c.total)}</span></div></div>
    ${free > 0 && c.shipping > 0 ? `<p class="muted" style="font-size:13px;margin-top:10px">Add ${money(Math.max(0, free - (c.subtotal - c.discount)))} more for free shipping.</p>` : ''}`;
}

function header() {
  return `<div class="announce" id="announce" hidden></div>
  <header class="nav"><div class="wrap nav-in">
    <div class="left"><button class="icon-btn menu-btn" data-open="menu" aria-label="Open menu">${icon('menu')}</button>
      <nav class="nav-links" aria-label="Primary">${NAV.map(([t, h]) => `<a href="${h}" data-nav="${h}">${t}</a>`).join('')}</nav></div>
    <a class="logo" href="/" aria-label="AURELLE home">AURELLE</a>
    <div class="nav-icons">
      <a class="icon-btn hide-sm" id="acct-link" href="/login.html" aria-label="Account">${icon('user')}</a>
      <a class="icon-btn" href="/wishlist.html" aria-label="Wishlist">${icon('heart')}<span class="badge-dot" id="wish-count" data-n="0"></span></a>
      <button class="icon-btn" data-open="cart" aria-label="Open cart">${icon('bag')}<span class="badge-dot" id="cart-count" data-n="0"></span></button>
    </div></div></header>
  <div class="mobile-menu" id="menu" aria-label="Menu"><div class="top"><span class="logo">AURELLE</span><button class="icon-btn" data-close aria-label="Close menu">${icon('x')}</button></div>
    ${NAV.map(([t, h]) => `<a href="${h}">${t}</a>`).join('')}<a href="/login.html" id="acct-link-m">Account</a></div>
  <div class="scrim" id="scrim"></div>
  <aside class="drawer" id="cart" aria-label="Shopping cart"><div class="drawer-head"><h3>Your cart</h3><button class="icon-btn" data-close aria-label="Close cart">${icon('x')}</button></div>
    <div class="drawer-body" id="cart-body"></div><div class="drawer-foot" id="cart-foot"></div></aside>
  <div class="scrim" id="qv-scrim" style="z-index:95"></div><div id="qv" class="search-panel" style="z-index:96;top:50%;left:50%;right:auto;max-width:880px;width:94%;transform:translate(-50%,-40%);opacity:0;transition:.4s;border:1px solid var(--line);padding:0"></div>`;
}

function footer(contact = {}) {
  return `<footer class="footer"><div class="wrap"><div class="foot-grid">
    <div><div class="logo" style="padding:0">AURELLE</div><p style="max-width:34ch;margin-top:14px;opacity:.8">Living, Refined. Considered home décor for calm, beautiful spaces.</p></div>
    <div><h4>Shop</h4><a href="/shop.html">All products</a><a href="/categories.html">Categories</a><a href="/collections.html">Collections</a><a href="/shop.html?bestseller=1">Bestsellers</a></div>
    <div><h4>Customer service</h4><a href="/info.html?p=shipping">Shipping</a><a href="/info.html?p=returns">Returns</a><a href="/info.html?p=faq">FAQ</a><a href="/info.html?p=contact">Contact</a><a href="/account.html#orders">Track an order</a></div>
    <div><h4>About</h4><a href="/about.html">Our story</a><a href="/info.html?p=privacy">Privacy policy</a><a href="/info.html?p=terms">Terms of sale</a>
      <p style="font-size:13.5px;opacity:.8;margin-top:10px">${esc(contact.email || '')}<br>${esc(contact.phone || '')}</p></div></div>
    <div class="foot-base"><span>© ${new Date().getFullYear()} AURELLE. All rights reserved.</span><span>Instagram · Pinterest · <a href="/admin/index.html" style="display:inline;opacity:.55">Staff</a></span></div></div></footer>`;
}

function openPanel(id) {
  qsa('.drawer.open,.mobile-menu.open').forEach(p => p.classList.remove('open'));
  qs('#' + id).classList.add('open'); qs('#scrim').classList.add('open'); document.body.style.overflow = 'hidden';
}
function closePanels() {
  qsa('.drawer.open,.mobile-menu.open').forEach(p => p.classList.remove('open'));
  qs('#scrim').classList.remove('open'); document.body.style.overflow = '';
}

function renderCart() {
  const c = state.cart, body = qs('#cart-body'), foot = qs('#cart-foot');
  const n = cartCount();
  qs('#cart-count').textContent = n || ''; qs('#cart-count').dataset.n = n;
  qs('#wish-count').textContent = state.wish.size || ''; qs('#wish-count').dataset.n = state.wish.size;
  if (!c.lines.length) {
    body.innerHTML = `<div class="empty"><h3>Your cart is empty</h3><p>Pieces you add will wait for you here.</p><a class="btn" href="/shop.html">Browse the shop</a></div>`; foot.innerHTML = ''; foot.hidden = true; return;
  }
  foot.hidden = false;
  body.innerHTML = cartLinesHtml(c.lines);
  foot.innerHTML = totalsHtml(c) + `<div style="display:grid;gap:10px;margin-top:16px"><a class="btn block" href="/checkout.html" ${c.ok ? '' : 'aria-disabled="true"'}>Checkout</a><a class="btn ghost block" href="/cart.html">View cart</a></div>`;
}

async function quickView(slug) {
  const box = qs('#qv'); qs('#qv-scrim').classList.add('open');
  box.innerHTML = '<div class="empty">Loading…</div>'; box.classList.add('open'); box.style.opacity = 1; box.style.transform = 'translate(-50%,-50%)';
  try {
    const { product: p } = await api('/products/' + slug); remember([p]);
    box.innerHTML = `<div class="split" style="gap:0;align-items:stretch"><img src="${esc(p.image || FALLBACK)}" alt="${esc(p.name)}" style="aspect-ratio:auto;height:100%;max-height:70vh"><div style="padding:32px;position:relative">
      <button class="icon-btn" data-qv-close style="position:absolute;right:8px;top:8px" aria-label="Close quick view">${icon('x')}</button>
      <p class="muted" style="margin-bottom:4px">${esc(p.category?.name || '')}</p><h2 style="font-size:2.2rem">${esc(p.name)}</h2><p style="margin:10px 0">${priceHtml(p)}</p>
      <p class="muted">${esc(p.description).slice(0, 220)}</p>
      <div style="display:grid;gap:10px;margin-top:20px"><button class="btn" data-add="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>${p.stock < 1 ? 'Sold out' : 'Add to cart'}</button><a class="btn ghost" href="/product.html?slug=${esc(p.slug)}">View full details</a></div></div></div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
function closeQV() { qs('#qv').classList.remove('open'); qs('#qv').style.opacity = 0; qs('#qv-scrim').classList.remove('open'); }

export function syncWishButtons(root = document) {
  qsa('[data-wish]', root).forEach(b => b.setAttribute('aria-pressed', state.wish.has(b.dataset.wish)));
}

export async function mountLayout(active = '') {
  qs('#site-top').innerHTML = header();
  qs('#site-bottom').innerHTML = footer();
  qsa('[data-nav]').forEach(a => { if (a.dataset.nav === active) a.setAttribute('aria-current', 'page'); });

  document.addEventListener('click', async e => {
    const t = e.target;
    const open = t.closest('[data-open]'); if (open) return openPanel(open.dataset.open);
    if (t.closest('[data-close]') || t.id === 'scrim') return closePanels();
    if (t.closest('[data-qv-close]') || t.id === 'qv-scrim') return closeQV();
    const add = t.closest('[data-add]');
    if (add) { const p = known.get(add.dataset.add); if (!p) return; add.disabled = true; try { if (await addToCart(p, 1)) { closeQV(); openPanel('cart'); } } catch (err) { toast(err.message, 'error'); } add.disabled = false; return; }
    const q = t.closest('[data-quick]'); if (q) return quickView(q.dataset.quick);
    const w = t.closest('[data-wish]');
    if (w) { try { await toggleWish(w.dataset.wish); } catch (err) { toast(err.message, 'error'); } }
    if (t.closest('[data-logout]')) logout();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePanels(); closeQV(); } });
  bindCartControls(qs('#cart'));
  document.addEventListener('cart:added', () => openPanel('cart'));

  subscribe(() => { renderCart(); syncWishButtons(); });
  await init();
  const ann = state.settings?.announcement;
  if (ann?.enabled && ann.text) { const a = qs('#announce'); a.textContent = ann.text; a.hidden = false; }
  qs('#site-bottom').innerHTML = footer(state.settings?.contact);
  if (state.user) { qs('#acct-link').href = state.user.role === 'admin' ? '/admin/index.html' : '/account.html'; qs('#acct-link-m').href = '/account.html'; }
  renderCart(); reveal();
}

export { stars };
