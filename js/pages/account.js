// Customer dashboard: profile, orders, saved addresses, password & security.
import { api } from '../api.js';
import { mountLayout } from '../layout.js';
import { state } from '../store.js';
import { esc, qs, qsa, money, date, toast, buttonBusy } from '../ui.js';

const panel = qs('#panel');
const TABS = { profile, orders, addresses, security };
let addrs = [];

mountLayout('').then(() => {
  if (!state.user) { sessionStorage.setItem('aurelle.next', '/account.html'); return location.href = '/login.html'; }
  route(); addEventListener('hashchange', route);
});
function route() {
  const t = location.hash.slice(1) in TABS ? location.hash.slice(1) : 'profile';
  qsa('#tabs a[href^="#"]').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + t));
  TABS[t]();
}
const input = (id, label, val = '', type = 'text', full = false) => `<div class="field ${full ? 'full' : ''}"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${esc(val)}"></div>`;

function profile() {
  const u = state.user;
  panel.innerHTML = `<h1 style="font-size:2.4rem;margin-bottom:24px">My profile</h1><div class="panel-box"><div style="display:flex;gap:20px;align-items:center;margin-bottom:28px;flex-wrap:wrap">
    ${u.avatar_url ? `<img class="avatar" src="${esc(u.avatar_url)}" alt="Profile photo">` : `<div class="avatar">${esc((u.full_name || u.email)[0].toUpperCase())}</div>`}
    <div><label class="btn ghost sm" for="av" style="cursor:pointer">Upload photo</label><input id="av" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only"><p class="muted" style="font-size:13px;margin:8px 0 0">JPG, PNG or WebP, up to 4 MB.</p></div></div>
    <form id="pf" class="form-grid">${input('full_name', 'Full name', u.full_name)}${input('phone', 'Phone number', u.phone || '', 'tel')}
    <div class="field full"><label for="em">Email</label><input id="em" value="${esc(u.email)}" disabled><span class="hint">Email changes are not supported in this version.</span></div>
    <div class="full"><button class="btn" type="submit">Save changes</button></div></form></div>`;
  qs('#pf').onsubmit = async e => {
    e.preventDefault(); const btn = e.submitter; buttonBusy(btn, true, 'Saving…');
    try { state.user = { ...u, ...await api('/me', { method: 'PUT', body: { full_name: qs('#full_name').value, phone: qs('#phone').value } }) }; toast('Profile updated.'); } catch (err) { toast(err.message, 'error'); }
    buttonBusy(btn, false);
  };
  qs('#av').onchange = async e => {
    const f = e.target.files[0]; if (!f) return; const fd = new FormData(); fd.append('file', f);
    try { const r = await api('/me/avatar', { method: 'POST', form: fd }); state.user.avatar_url = r.avatar_url; toast('Photo updated.'); profile(); } catch (err) { toast(err.message, 'error'); }
  };
}

async function orders() {
  panel.innerHTML = '<h1 style="font-size:2.4rem;margin-bottom:24px">My orders</h1><div id="ol"><div class="skeleton" style="height:120px"></div></div>';
  try {
    const { items } = await api('/orders');
    qs('#ol').innerHTML = items.length ? `<div class="t-wrap"><table class="t"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>${items.map(o => `<tr><td>${esc(o.order_number)}</td><td>${date(o.created_at)}</td><td>${o.order_items.reduce((n, i) => n + i.quantity, 0)}</td><td>${money(o.total)}</td><td><span class="status ${o.status}">${o.status}</span></td><td><a class="link" href="/order.html?id=${o.id}">View &amp; track</a></td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty"><h3>No orders yet</h3><p>Your orders will appear here.</p><a class="btn" href="/shop.html">Start shopping</a></div>';
  } catch (e) { qs('#ol').innerHTML = `<p class="warn">${esc(e.message)}</p>`; }
}

async function addresses() {
  panel.innerHTML = '<h1 style="font-size:2.4rem;margin-bottom:24px">Saved addresses</h1><div id="al"></div><div id="af"></div>';
  const draw = async () => {
    try { addrs = (await api('/addresses')).items; } catch (e) { return toast(e.message, 'error'); }
    qs('#al').innerHTML = addrs.length ? `<div style="display:grid;gap:14px;margin-bottom:28px">${addrs.map(a => `<div class="panel-box"><strong>${esc(a.label)}</strong>${a.is_default ? ' <span class="tag">Default</span>' : ''}<p style="margin:8px 0">${esc(a.full_name)}, ${esc(a.line1)}, ${esc(a.city)}, ${esc(a.state)} ${esc(a.postal_code)}, ${esc(a.country)}<br>${esc(a.phone)}</p><button class="link" data-edit="${a.id}">Edit</button> &nbsp; <button class="link" data-del="${a.id}">Delete</button></div>`).join('')}</div>` : '<p class="muted">No saved addresses yet.</p>';
    form();
  };
  const form = (a = {}) => {
    qs('#af').innerHTML = `<form id="f" class="panel-box form-grid"><h3 class="full" style="margin-bottom:14px">${a.id ? 'Edit address' : 'Add an address'}</h3>${input('label', 'Label', a.label || 'Home')}${input('full_name', 'Full name', a.full_name || state.user.full_name)}${input('phone', 'Phone', a.phone || state.user.phone || '', 'tel')}${input('country', 'Country', a.country || 'India')}${input('line1', 'Address', a.line1 || '', 'text', true)}${input('city', 'City', a.city || '')}${input('state', 'State', a.state || '')}${input('postal_code', 'Postal code', a.postal_code || '')}
      <label class="full" style="display:flex;gap:8px;margin-bottom:16px"><input type="checkbox" id="is_default" ${a.is_default ? 'checked' : ''}> Make this my default address</label><div class="full"><button class="btn" type="submit">${a.id ? 'Save address' : 'Add address'}</button></div></form>`;
    qs('#f').onsubmit = async e => {
      e.preventDefault(); const body = Object.fromEntries(new FormData(e.target)); body.is_default = qs('#is_default').checked;
      try { await api(a.id ? '/addresses/' + a.id : '/addresses', { method: a.id ? 'PUT' : 'POST', body }); toast('Address saved.'); draw(); } catch (err) { toast(err.message, 'error'); }
    };
  };
  panel.onclick = async e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) { form(addrs.find(x => x.id === ed.dataset.edit)); qs('#af').scrollIntoView({ behavior: 'smooth' }); }
    if (del && confirm('Delete this address?')) { try { await api('/addresses/' + del.dataset.del, { method: 'DELETE' }); draw(); } catch (err) { toast(err.message, 'error'); } }
  };
  draw();
}

function security() {
  panel.innerHTML = `<h1 style="font-size:2.4rem;margin-bottom:24px">Password &amp; security</h1><form id="sf" class="panel-box" style="max-width:520px"><div id="m"></div>
    <div class="field"><label for="password">New password</label><input id="password" type="password" autocomplete="new-password"><span class="hint">At least 8 characters with a letter and a number.</span></div>
    <div class="field"><label for="confirm_password">Confirm new password</label><input id="confirm_password" type="password" autocomplete="new-password"></div><button class="btn" type="submit">Update password</button></form>`;
  qs('#sf').onsubmit = async e => {
    e.preventDefault(); const btn = e.submitter; buttonBusy(btn, true, 'Updating…');
    try { await api('/me/password', { method: 'POST', body: { password: qs('#password').value, confirm_password: qs('#confirm_password').value } }); qs('#m').innerHTML = '<div class="alert ok">Password updated.</div>'; e.target.reset(); }
    catch (err) { qs('#m').innerHTML = `<div class="alert error">${esc(err.message)}</div>`; }
    buttonBusy(btn, false);
  };
}
