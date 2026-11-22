// Five-stage checkout: cart review → shipping → order summary → payment → confirmation.
// Totals shown here are display only; the database recalculates everything when the order is placed.
import { api } from '../api.js';
import { mountLayout, cartLinesHtml, bindCartControls, totalsHtml } from '../layout.js';
import { state, subscribe, applyCoupon, refreshCart } from '../store.js';
import { esc, qs, money, toast, buttonBusy, FALLBACK } from '../ui.js';

const STEPS = ['Cart review', 'Shipping', 'Order summary', 'Payment', 'Confirmation'];
let step = 1, ship = {}, payment = 'cod', placed = null, addresses = [];

mountLayout('').then(async () => {
  if (!state.user) { sessionStorage.setItem('aurelle.next', '/checkout.html'); return location.href = '/login.html'; }
  ship = { name: state.user.full_name, email: state.user.email, phone: state.user.phone || '', address: '', city: '', state: '', postal_code: '', country: 'India' };
  try { addresses = (await api('/addresses')).items; const d = addresses.find(a => a.is_default) || addresses[0]; if (d) useAddress(d); } catch { /* optional */ }
  bindCartControls(document.body); subscribe(() => { if (!placed) draw(); }); draw();
});

function useAddress(a) { Object.assign(ship, { name: a.full_name, phone: a.phone, address: a.line1, city: a.city, state: a.state, postal_code: a.postal_code, country: a.country }); }
const field = (id, label, type = 'text', full = false) => `<div class="field ${full ? 'full' : ''}"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${esc(ship[id] || '')}" required><span class="err" id="e-${id}"></span></div>`;

function draw() {
  const c = state.cart;
  qs('#steps').innerHTML = STEPS.map((s, i) => `<span class="${i + 1 === step ? 'on' : ''}">${i + 1}. ${s}</span>`).join('');
  qs('#summary').innerHTML = placed ? '' : `<h3 style="margin-bottom:16px">Order summary</h3>${c.lines.map(l => l.issue === 'unavailable' ? '' : `<div style="display:flex;gap:12px;margin-bottom:12px;font-size:14px"><img src="${esc(l.image || FALLBACK)}" alt="" width="48" height="60" style="object-fit:cover"><div style="flex:1">${esc(l.name)}<br><span class="muted">Qty ${l.quantity}</span></div><span>${money(l.line_total)}</span></div>`).join('')}<div style="margin-top:16px">${totalsHtml(c)}</div>`;
  qs('#summary').hidden = !!placed;
  const el = qs('#step');
  if (step === 1) {
    el.innerHTML = c.lines.length ? `${cartLinesHtml(c.lines)}<form id="cf" style="display:flex;gap:8px;margin:22px 0;max-width:420px"><input id="cc" placeholder="Coupon code" aria-label="Coupon code" value="${esc(state.coupon || '')}" style="flex:1;height:46px;border:1px solid var(--line);padding:0 12px;background:var(--ivory);text-transform:uppercase"><button class="btn ghost sm" style="min-height:46px">Apply</button></form>
      ${c.ok ? '' : '<p class="warn">Some items need attention before you can continue.</p>'}<button class="btn" id="next" ${c.ok ? '' : 'disabled'}>Continue to shipping</button>`
      : '<div class="empty"><h3>Your cart is empty</h3><a class="btn" href="/shop.html">Browse the shop</a></div>';
    qs('#cf')?.addEventListener('submit', async e => { e.preventDefault(); try { await applyCoupon(qs('#cc').value.trim()); toast(state.coupon ? 'Coupon applied.' : 'Coupon removed.'); } catch (err) { toast(err.message, 'error'); } });
    qs('#next')?.addEventListener('click', () => go(2));
  } else if (step === 2) {
    el.innerHTML = `<form id="sf" novalidate>${addresses.length ? `<div class="field"><label for="saved">Use a saved address</label><select id="saved"><option value="">Enter a new address</option>${addresses.map(a => `<option value="${a.id}">${esc(a.label)} — ${esc(a.line1)}, ${esc(a.city)}</option>`).join('')}</select></div>` : ''}
      <div class="form-grid">${field('name', 'Full name')}${field('email', 'Email', 'email')}${field('phone', 'Phone', 'tel')}${field('country', 'Country')}${field('address', 'Address', 'text', true)}${field('city', 'City')}${field('state', 'State')}${field('postal_code', 'Postal code')}</div>
      <div style="display:flex;gap:12px"><button type="button" class="btn ghost" id="back">Back</button><button class="btn">Continue to summary</button></div></form>`;
    qs('#saved')?.addEventListener('change', e => { const a = addresses.find(x => x.id === e.target.value); if (a) { useAddress(a); draw(); qs('#saved').value = a.id; } });
    qs('#back').onclick = () => go(1);
    qs('#sf').addEventListener('submit', e => {
      e.preventDefault(); let bad = false;
      for (const k of ['name', 'email', 'phone', 'address', 'city', 'state', 'postal_code', 'country']) {
        ship[k] = qs('#' + k).value.trim(); const err = qs('#e-' + k); err.textContent = '';
        if (!ship[k]) { err.textContent = 'Required.'; bad = true; }
      }
      if (!bad && !/^\S+@\S+\.\S+$/.test(ship.email)) { qs('#e-email').textContent = 'Enter a valid email.'; bad = true; }
      if (!bad && !/^\+?[0-9\s-]{7,15}$/.test(ship.phone)) { qs('#e-phone').textContent = 'Enter a valid phone number.'; bad = true; }
      if (!bad) go(3);
    });
  } else if (step === 3) {
    el.innerHTML = `<div class="panel-box" style="margin-bottom:22px"><h3 style="margin-bottom:8px">Delivering to</h3><p style="margin:0">${esc(ship.name)}<br>${esc(ship.address)}<br>${esc(ship.city)}, ${esc(ship.state)} ${esc(ship.postal_code)}<br>${esc(ship.country)}<br>${esc(ship.phone)} · ${esc(ship.email)}</p><button class="link" id="edit" style="margin-top:10px">Edit details</button></div>
      <p class="muted">Please review your order on the right. The final total is confirmed by our system when you place the order.</p><div style="display:flex;gap:12px"><button class="btn ghost" id="back">Back</button><button class="btn" id="next">Continue to payment</button></div>`;
    qs('#edit').onclick = qs('#back').onclick = () => go(2); qs('#next').onclick = () => go(4);
  } else if (step === 4) {
    el.innerHTML = `<h3 style="margin-bottom:14px">Payment method</h3><div class="pay"><label><input type="radio" name="pay" value="cod" ${payment === 'cod' ? 'checked' : ''}><span><strong>Cash on delivery</strong><br><span class="muted">Pay in cash when your order arrives.</span></span></label>
      <label><input type="radio" name="pay" value="demo_online" ${payment === 'demo_online' ? 'checked' : ''}><span><strong>Online payment (demo)</strong><br><span class="muted">Demonstration only. No gateway is connected, no card is charged and the order is recorded as “demo” — not as paid.</span></span></label></div>
      <div id="err" class="alert error" hidden style="margin-top:18px"></div><div style="display:flex;gap:12px;margin-top:24px"><button class="btn ghost" id="back">Back</button><button class="btn" id="place">Place order</button></div>`;
    el.querySelectorAll('[name=pay]').forEach(r => r.onchange = () => payment = r.value);
    qs('#back').onclick = () => go(3);
    qs('#place').onclick = async e => {
      buttonBusy(e.target, true, 'Placing order…');
      try {
        placed = await api('/orders', { method: 'POST', body: { shipping: ship, payment_method: payment, coupon: state.cart.coupon || '' } });
        await refreshCart(); step = 5; draw(); window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        buttonBusy(e.target, false); const box = qs('#err'); box.hidden = false; box.textContent = err.message;
        if (err.data?.code === 'CART_INVALID' || err.data?.code === 'COUPON_INVALID') { await refreshCart(); setTimeout(() => go(1), 1800); }
      }
    };
  } else {
    el.innerHTML = `<div class="center" style="padding:40px 0"><h2>Thank you, ${esc(ship.name.split(' ')[0])}.</h2><p class="muted" style="margin:12px 0 4px">Your order <strong style="color:var(--espresso)">${esc(placed.order_number)}</strong> has been placed.</p><p class="muted">Total ${money(placed.total)} · ${payment === 'cod' ? 'Pay on delivery' : 'Demo payment (no charge made)'}</p>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:28px;flex-wrap:wrap"><a class="btn" href="/order.html?id=${esc(placed.id)}">Track your order</a><a class="btn ghost" href="/shop.html">Continue shopping</a></div></div>`;
  }
}
function go(n) { step = n; draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
