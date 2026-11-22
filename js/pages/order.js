import { api } from '../api.js';
import { mountLayout } from '../layout.js';
import { state } from '../store.js';
import { esc, qs, money, date, icon, toast, FALLBACK } from '../ui.js';

const FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const LABEL = { pending: 'Order placed', confirmed: 'Confirmed', processing: 'Preparing', shipped: 'Shipped', delivered: 'Delivered' };
const id = new URLSearchParams(location.search).get('id');
const box = qs('#order');

export function timeline(status) {
  if (status === 'cancelled') return '<p><span class="status cancelled">Cancelled</span></p>';
  const at = FLOW.indexOf(status);
  return `<ol class="timeline" style="padding:0">${FLOW.map((s, i) => `<li class="${i <= at ? 'done' : ''} ${i === at ? 'now' : ''}"><i>${i <= at ? icon('check') : ''}</i>${LABEL[s]}</li>`).join('')}</ol>`;
}

async function load() {
  try {
    const o = await api('/orders/' + encodeURIComponent(id));
    const canCancel = ['pending', 'confirmed'].includes(o.status);
    box.innerHTML = `<div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:end"><div><h1 style="font-size:2.6rem">Order ${esc(o.order_number)}</h1><p class="muted">Placed ${date(o.created_at)} · <span class="status ${o.status}">${o.status}</span></p></div>${canCancel ? '<button class="btn ghost" id="cancel">Cancel order</button>' : ''}</div>
      <div class="panel-box" style="margin:24px 0">${timeline(o.status)}</div>
      <div class="checkout" style="padding:0;gap:32px"><div class="t-wrap"><table class="t"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${o.order_items.map(i => `<tr><td><div style="display:flex;gap:12px;align-items:center"><img src="${esc(i.image_url || FALLBACK)}" alt="" width="48" height="60" style="object-fit:cover">${esc(i.product_name)}</div></td><td>${i.quantity}</td><td>${money(i.unit_price)}</td><td>${money(i.unit_price * i.quantity)}</td></tr>`).join('')}</tbody></table></div>
      <aside class="summary" style="position:static"><div class="totals"><div><span>Subtotal</span><span>${money(o.subtotal)}</span></div>${+o.discount ? `<div><span>Discount ${o.coupon_code ? '(' + esc(o.coupon_code) + ')' : ''}</span><span>−${money(o.discount)}</span></div>` : ''}<div><span>Shipping</span><span>${+o.shipping ? money(o.shipping) : 'Free'}</span></div><div class="grand"><span>Total</span><span>${money(o.total)}</span></div></div>
      <p style="margin:18px 0 4px"><strong>Payment</strong><br>${o.payment_method === 'cod' ? 'Cash on delivery' : 'Online payment (demo)'} · ${o.payment_status === 'demo' ? 'demo, not charged' : o.payment_status}</p>
      <p style="margin:12px 0 0"><strong>Ship to</strong><br>${esc(o.ship_name)}<br>${esc(o.ship_address)}, ${esc(o.ship_city)}, ${esc(o.ship_state)} ${esc(o.ship_postal_code)}<br>${esc(o.ship_country)}</p></aside></div>`;
    qs('#cancel')?.addEventListener('click', async () => {
      if (!confirm('Cancel this order? Items will be returned to stock.')) return;
      try { await api(`/orders/${o.id}/cancel`, { method: 'POST' }); toast('Order cancelled.'); load(); } catch (e) { toast(e.message, 'error'); }
    });
  } catch (e) { box.innerHTML = `<div class="empty"><h3>We couldn’t open that order</h3><p>${esc(e.message)}</p><a class="btn" href="/account.html#orders">My orders</a></div>`; }
}
mountLayout('').then(() => { if (!state.user) { sessionStorage.setItem('aurelle.next', location.pathname + location.search); location.href = '/login.html'; } else load(); });
