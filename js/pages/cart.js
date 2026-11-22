import { mountLayout, cartLinesHtml, bindCartControls, totalsHtml } from '../layout.js';
import { state, subscribe, applyCoupon } from '../store.js';
import { qs, toast, esc } from '../ui.js';

mountLayout('').then(() => { render(); subscribe(render); });
bindCartControls(document.body);

export function couponBox() {
  return `<form id="cf" style="display:flex;gap:8px;margin:18px 0"><input id="cc" placeholder="Coupon code" aria-label="Coupon code" value="${esc(state.coupon || '')}" style="flex:1;height:46px;border:1px solid var(--line);padding:0 12px;background:var(--ivory);text-transform:uppercase"><button class="btn ghost sm" style="min-height:46px" type="submit">Apply</button></form>`;
}
function render() {
  const c = state.cart;
  qs('#lines').innerHTML = c.lines.length ? cartLinesHtml(c.lines) : `<div class="empty"><h3>Your cart is empty</h3><p>Find something beautiful.</p><a class="btn" href="/shop.html">Browse the shop</a></div>`;
  qs('#summary').innerHTML = c.lines.length ? `<h3 style="margin-bottom:6px">Order summary</h3>${couponBox()}${state.cart.coupon ? `<p class="muted" style="font-size:13px;margin-top:-8px">Coupon ${esc(state.cart.coupon)} applied.</p>` : ''}${totalsHtml(c)}<a class="btn block" style="margin-top:20px" href="/checkout.html" ${c.ok ? '' : 'aria-disabled="true" onclick="return false"'}>Proceed to checkout</a>${c.ok ? '' : '<p class="warn" style="margin-top:10px">Fix the highlighted items to continue.</p>'}` : '';
  qs('#cf')?.addEventListener('submit', async e => { e.preventDefault(); try { await applyCoupon(qs('#cc').value.trim()); toast(state.coupon ? 'Coupon applied.' : 'Coupon removed.'); } catch (err) { toast(err.message, 'error'); } });
}
