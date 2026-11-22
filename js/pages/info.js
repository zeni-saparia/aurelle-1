import { mountLayout } from '../layout.js';
import { state } from '../store.js';
import { qs, esc } from '../ui.js';

mountLayout(location.pathname.includes('about') ? '/about.html' : '').then(() => {
  const el = qs('#content'); if (!el) return;
  const s = state.settings || {}, c = s.contact || {};
  const P = {
    shipping: ['Shipping', `<p>${esc(s.shipping?.info || 'Orders ship within 2–4 business days.')}</p><p>Shipping is a flat ₹${esc(s.shipping?.flat_rate ?? 199)}, and complimentary on orders above ₹${esc(s.shipping?.free_threshold ?? 5000)}.</p>`],
    returns: ['Returns', '<p>If a piece is not right, return it unused within 14 days of delivery for a refund. Fragile items must be returned in their original packaging.</p><p>Write to us before sending anything back and we will arrange the pickup.</p>'],
    faq: ['Frequently asked questions', '<h3>How do I track my order?</h3><p>Sign in and open My orders. Each order shows a live progress timeline.</p><h3>Can I cancel an order?</h3><p>Yes, while it is pending or confirmed. After that it is already being prepared.</p><h3>Do you accept online payments?</h3><p>Cash on delivery is available. Online payment is currently a demo workflow while a payment gateway is being connected.</p>'],
    contact: ['Contact', `<p>Email: ${esc(c.email || '')}</p><p>Phone: ${esc(c.phone || '')}</p><p>${esc(c.address || '')}</p>`],
    privacy: ['Privacy policy', '<p>We collect only what we need to process your orders: your name, contact details and delivery address. We never sell your data. You can update or request deletion of your details from your account or by contacting us.</p>'],
    terms: ['Terms of sale', '<p>Prices are in Indian rupees and include applicable taxes. Orders are confirmed once reviewed by our team. We reserve the right to cancel an order if an item becomes unavailable, in which case you will be refunded in full.</p>'],
    styling: ['Styling notes', '<p>Start with one showpiece and give it space. Add a second in a different height, and a third in a different texture: say a brass swan pair, a terracotta vase and a stack of books. Odd numbers feel natural, and empty space makes each piece look intentional.</p><p>On a wall, cluster plates or panels in odd numbers and keep a hand’s width between them. Warm lamps and a handloom cushion or two finish the room.</p>'],
  };
  const [title, html] = P[new URLSearchParams(location.search).get('p')] || ['Page not found', '<p>That page does not exist.</p>'];
  document.title = title + ' — AURELLE'; qs('#title').textContent = title; qs('#crumb').textContent = title; el.innerHTML = `<div style="max-width:64ch;font-size:1.02rem">${html}</div>`;
});
