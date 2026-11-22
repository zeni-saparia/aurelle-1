// Client state: signed-in user, cart (server for members, localStorage for guests) and wishlist ids.
import { api, session } from './api.js';
import { toast } from './ui.js';

const GUEST = 'aurelle.cart';
const listeners = new Set();
export const state = { user: null, cart: { lines: [], subtotal: 0, discount: 0, shipping: 0, total: 0, ok: true }, wish: new Set(), settings: null, coupon: null };
export const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach(fn => fn(state));
export const cartCount = () => state.cart.lines.reduce((n, l) => n + (l.issue === 'unavailable' ? 0 : l.quantity), 0);

const guestItems = () => { try { return JSON.parse(localStorage.getItem(GUEST)) || []; } catch { return []; } };
const saveGuest = items => localStorage.setItem(GUEST, JSON.stringify(items));

export async function init() {
  const [settings] = await Promise.all([api('/settings').catch(() => null), loadUser()]);
  state.settings = settings;
  await Promise.all([refreshCart(), loadWishlist()]);
  emit();
}

async function loadUser() {
  if (!(await session.get())) return;
  try { state.user = await api('/me'); } catch (e) { state.user = null; if (e.status === 401) await session.clear(); }
}

export async function refreshCart() {
  const coupon = state.coupon || undefined;
  try {
    if (state.user) state.cart = await api('/cart', { query: { coupon } });
    else {
      const items = guestItems();
      state.cart = items.length ? await api('/cart/quote', { method: 'POST', body: { items, coupon } }) : { lines: [], subtotal: 0, discount: 0, shipping: 0, total: 0, ok: true };
    }
  } catch { /* keep previous cart on network errors */ }
  emit();
}

export async function setQty(productId, quantity, stock) {
  const q = Math.max(0, Math.min(quantity, stock ?? 99));
  if (state.user) {
    const r = await api('/cart/items', { method: 'PUT', body: { product_id: productId, quantity: q } });
    if (r.note) toast(r.note);
  } else {
    let items = guestItems().filter(i => i.product_id !== productId);
    if (q > 0) items.push({ product_id: productId, quantity: q });
    saveGuest(items);
  }
  await refreshCart();
}

/** Add `qty` of a product, never exceeding its stock. */
export async function addToCart(product, qty = 1) {
  if (product.stock < 1) return toast('This piece is sold out.', 'error');
  const have = state.cart.lines.find(l => l.product_id === product.id)?.quantity || 0;
  if (have + qty > product.stock) { toast(`Only ${product.stock} available.`, 'error'); if (have >= product.stock) return false; }
  await setQty(product.id, have + qty, product.stock);
  toast(`${product.name} added to your cart.`);
  document.dispatchEvent(new CustomEvent('cart:added'));
  return true;
}

export async function applyCoupon(code) {
  state.coupon = code || null;
  await refreshCart();
  if (code && state.cart.coupon_error) { const e = state.cart.coupon_error; state.coupon = null; await refreshCart(); throw new Error(e); }
}

/** After sign-in: move any guest cart into the member's server cart. */
export async function mergeGuestCart() {
  const items = guestItems();
  for (const i of items) { try { await api('/cart/items', { method: 'PUT', body: i }); } catch { /* skip unavailable */ } }
  localStorage.removeItem(GUEST);
}

// ───── Wishlist ─────
export async function loadWishlist() {
  state.wish = new Set();
  if (!state.user) return;
  try { state.wish = new Set((await api('/wishlist')).ids); } catch { /* ignore */ }
}

export async function toggleWish(productId) {
  if (!state.user) { sessionStorage.setItem('aurelle.next', location.pathname + location.search); location.href = '/login.html'; return null; }
  const had = state.wish.has(productId);
  await api('/wishlist/' + productId, { method: had ? 'DELETE' : 'POST' });
  had ? state.wish.delete(productId) : state.wish.add(productId);
  toast(had ? 'Removed from your wishlist.' : 'Saved to your wishlist.');
  emit();
  return !had;
}

export async function logout() {
  try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  await session.clear(); localStorage.removeItem(GUEST);
  location.href = '/';
}

// Products seen on the current page, so cards can add to cart without refetching.
export const known = new Map();
export const remember = items => (items || []).forEach(p => known.set(p.id, p));
