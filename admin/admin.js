// AURELLE admin console. Every change is also checked by the database (RLS + is_admin()), so only users with role = 'admin' can save anything.
import { api, session } from '/js/api.js';
import { esc, money, date, toast, qs, qsa, debounce, FALLBACK, icon } from '/js/ui.js';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const COLLECTIONS = { '': 'None', 'brass-heritage': 'Brass Heritage', 'festive-glow': 'Festive Glow', 'botanical-boho': 'Botanical & Boho', 'modern-living': 'Modern Living' };
const view = qs('#view'); let cats = [], search = '';

(async function boot() {
  let me; try { me = (await session.get()) ? await api('/me') : null; } catch { me = null; }
  if (!me) { sessionStorage.setItem('aurelle.next', '/admin/index.html'); return location.href = '/login.html'; }
  if (me.role !== 'admin') { qs('#gate').innerHTML = '<h3>You do not have access to this area.</h3><p><a class="link" href="/">Return to the store</a></p>'; return; }
  qs('#gate').hidden = true; qs('#shell').hidden = false; qs('#who').textContent = me.email;
  qs('#out').onclick = async e => { e.preventDefault(); try { await api('/auth/logout', { method: 'POST' }); } catch {} await session.clear(); location.href = '/'; };
  qs('#mt').onclick = () => qs('#side').classList.toggle('open');
  qs('#gsearch').addEventListener('input', debounce(e => { search = e.target.value.trim(); route(); }, 350));
  try { cats = (await api('/categories')).items; } catch {}
  addEventListener('hashchange', () => { search = ''; qs('#gsearch').value = ''; route(); }); route();
})();

const R = { dashboard, products, categories, orders, customers, reviews, coupons, settings };
function route() {
  const k = location.hash.slice(1).split('/')[0]; const name = k in R ? k : 'dashboard';
  qsa('.side a[href^="#"]').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + name)); qs('#side').classList.remove('open');
  view.innerHTML = '<div class="skeleton" style="height:200px"></div>';
  R[name]().catch(e => { view.innerHTML = `<div class="alert error">${esc(e.message)}</div>`; });
}

// ───── helpers ─────
const modal = html => { qs('#modal-body').innerHTML = html; qs('#modal').classList.add('open'); };
const closeModal = () => qs('#modal').classList.remove('open');
qs('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.closest('[data-x]')) closeModal(); });
addEventListener('keydown', e => e.key === 'Escape' && closeModal());
const fld = (id, label, v = '', type = 'text', full = false, attrs = '') => `<div class="field ${full ? 'full' : ''}"><label for="${id}">${label}</label>${type === 'textarea' ? `<textarea id="${id}" ${attrs}>${esc(v)}</textarea>` : `<input id="${id}" type="${type}" value="${esc(v)}" ${attrs}>`}</div>`;
const sel = (id, label, opts, v = '', full = false) => `<div class="field ${full ? 'full' : ''}"><label for="${id}">${label}</label><select id="${id}" style="height:48px;width:100%">${Object.entries(opts).map(([k, t]) => `<option value="${esc(k)}" ${String(k) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
const chk = (id, label, on) => `<label style="display:flex;gap:8px;margin-bottom:10px"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}> ${label}</label>`;
const table = (heads, rows) => `<div class="t-wrap"><table class="t"><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${heads.length}" class="muted">Nothing to show.</td></tr>`}</tbody></table></div>`;
const val = id => qs('#' + id).value.trim();
const pager = (total, page, per, key) => total > per ? `<div style="display:flex;gap:10px;margin-top:16px;align-items:center"><button class="btn ghost sm" data-pg="${page - 1}" ${page < 2 ? 'disabled' : ''}>Previous</button><span class="muted">Page ${page} of ${Math.ceil(total / per)}</span><button class="btn ghost sm" data-pg="${page + 1}" ${page * per >= total ? 'disabled' : ''}>Next</button></div>` : '';
const confirmDo = async (msg, fn) => { if (confirm(msg)) try { await fn(); toast('Done.'); route(); } catch (e) { toast(e.message, 'error'); } };

// ───── Dashboard ─────
async function dashboard() {
  const s = await api('/admin/stats');
  const days = s.sales_by_day, max = Math.max(1, ...days.map(d => +d.total)), W = 640, H = 220, step = (W - 50) / (days.length - 1 || 1);
  const pts = days.map((d, i) => [40 + i * step, H - 30 - (+d.total / max) * (H - 60)]);
  view.innerHTML = `<h1>Dashboard</h1><div class="stats">${[['Total sales', money(s.total_sales)], ['Total orders', s.total_orders], ['Pending orders', s.pending_orders], ['Products', s.total_products], ['Customers', s.total_customers]].map(([l, v]) => `<div class="stat"><span>${l}</span><b>${v}</b></div>`).join('')}</div>
  <div class="two"><div class="box"><h3>Sales, last 30 days</h3><svg class="chart" viewBox="0 0 ${W} ${H}" style="width:100%" role="img" aria-label="Sales over the last 30 days"><line x1="40" y1="${H - 30}" x2="${W - 10}" y2="${H - 30}" stroke="#d8c8b5"/><text x="4" y="${H - 26}">0</text><text x="4" y="34">${money(max)}</text>
    <polyline fill="none" stroke="#29241F" stroke-width="2" points="${pts.map(p => p.join(',')).join(' ')}"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#B89A63"><title>${date(days[i].day)}: ${money(days[i].total)}</title></circle>`).join('')}
    <text x="40" y="${H - 8}">${date(days[0].day)}</text><text x="${W - 90}" y="${H - 8}">${date(days[days.length - 1].day)}</text></svg></div>
  <div class="box"><h3>Best sellers</h3>${table(['Product', 'Sold'], s.best_sellers.map(p => `<tr><td>${esc(p.name)}</td><td>${p.sold_count}</td></tr>`))}</div></div>
  <div class="box"><h3>Recent orders</h3>${table(['Order', 'Customer', 'Total', 'Status', 'Date'], s.recent_orders.map(o => `<tr><td><a class="link" href="#orders">${esc(o.order_number)}</a></td><td>${esc(o.ship_name)}</td><td>${money(o.total)}</td><td><span class="status ${o.status}">${o.status}</span></td><td>${date(o.created_at)}</td></tr>`))}</div>`;
}

// ───── Products ─────
let pPage = 1;
async function products() {
  const r = await api('/admin/products', { query: { q: search, page: pPage, per_page: 15 } });
  view.innerHTML = `<h1>Products</h1><div class="bar"><button class="btn sm" id="add">Add product</button><span class="muted">${r.total} products</span></div>${table(['', 'Name', 'Category', 'Price', 'Stock', 'Flags', ''], r.items.map(p => `<tr><td><img class="thumb" src="${esc(p.image || FALLBACK)}" alt=""></td><td>${esc(p.name)}<br><span class="muted" style="font-size:12px">${esc(p.sku)}</span></td><td>${esc(p.category?.name || '')}</td><td>${p.sale_price ? `${money(p.sale_price)} <s class="muted">${money(p.price)}</s>` : money(p.price)}</td><td>${p.stock}</td><td>${[p.is_published ? 'Published' : 'Draft', p.is_featured && 'Featured', p.is_bestseller && 'Bestseller'].filter(Boolean).join(', ')}</td><td><button class="rowbtn" data-edit="${p.id}">Edit</button><button class="rowbtn del" data-del="${p.id}">Delete</button></td></tr>`))}${pager(r.total, pPage, 15)}`;
  qs('#add').onclick = () => productForm();
  view.onclick = e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]'), pg = e.target.closest('[data-pg]');
    if (ed) productForm(r.items.find(p => p.id === ed.dataset.edit));
    if (del) confirmDo('Delete this product permanently?', () => api('/admin/products/' + del.dataset.del, { method: 'DELETE' }));
    if (pg) { pPage = +pg.dataset.pg; route(); }
  };
}
function productForm(p = {}) {
  const catOpts = Object.fromEntries(cats.map(c => [c.id, c.name]));
  modal(`<h2 style="margin-bottom:18px">${p.id ? 'Edit product' : 'Add product'}</h2><form id="pf" class="form-grid" novalidate>${fld('name', 'Name', p.name)}${fld('sku', 'SKU', p.sku)}${fld('slug', 'URL slug (optional)', p.slug)}${sel('category_id', 'Category', catOpts, p.category_id)}
    ${fld('price', 'Price (₹)', p.price, 'number')}${fld('sale_price', 'Sale price (₹, optional)', p.sale_price ?? '', 'number')}${fld('stock', 'Stock quantity', p.stock ?? 0, 'number')}${sel('collection', 'Collection', COLLECTIONS, p.collection || '')}
    ${fld('materials', 'Materials', p.materials || '')}${fld('dimensions', 'Dimensions', p.dimensions || '')}${fld('colors', 'Colours (comma separated)', (p.colors || []).join(', '), 'text', true)}${fld('description', 'Description', p.description || '', 'textarea', true)}
    <div class="field full"><label for="images">Image URLs (one per line — first is the main image)</label><textarea id="images" style="height:110px">${esc((p.images || []).map(i => i.url).join('\n'))}</textarea><div><label class="btn ghost sm" for="up" style="cursor:pointer;margin-top:8px">Upload image</label><input id="up" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only"></div></div>
    <div class="full">${chk('is_featured', 'Featured product', p.is_featured)}${chk('is_bestseller', 'Bestseller', p.is_bestseller)}${chk('is_published', 'Published (visible in the store)', p.id ? p.is_published : true)}</div>
    <div class="full" style="display:flex;gap:12px"><button class="btn" type="submit">Save product</button><button class="btn ghost" type="button" data-x>Cancel</button></div></form>`);
  qs('#up').onchange = async e => { const fd = new FormData(); fd.append('file', e.target.files[0]); try { const r = await api('/admin/upload', { method: 'POST', form: fd }); qs('#images').value = (qs('#images').value.trim() + '\n' + r.url).trim(); toast('Image uploaded.'); } catch (err) { toast(err.message, 'error'); } };
  qs('#pf').onsubmit = async e => {
    e.preventDefault();
    const body = { name: val('name'), sku: val('sku'), slug: val('slug'), category_id: val('category_id'), price: val('price'), sale_price: val('sale_price'), stock: val('stock'), collection: val('collection'), materials: val('materials'), dimensions: val('dimensions'), colors: val('colors'), description: val('description'),
      images: val('images').split('\n').map(s => s.trim()).filter(Boolean), is_featured: qs('#is_featured').checked, is_bestseller: qs('#is_bestseller').checked, is_published: qs('#is_published').checked };
    try { await api(p.id ? '/admin/products/' + p.id : '/admin/products', { method: p.id ? 'PUT' : 'POST', body }); toast('Product saved.'); closeModal(); route(); } catch (err) { toast(err.message, 'error'); }
  };
}

// ───── Categories ─────
async function categories() {
  cats = (await api('/categories')).items;
  view.innerHTML = `<h1>Categories</h1><div class="bar"><button class="btn sm" id="add">Add category</button></div>${table(['', 'Name', 'Slug', 'Products', 'Order', ''], cats.map(c => `<tr><td><img class="thumb" src="${esc(c.image_url || FALLBACK)}" alt=""></td><td>${esc(c.name)}</td><td>${esc(c.slug)}</td><td>${c.product_count}</td><td>${c.sort_order}</td><td><button class="rowbtn" data-edit="${c.id}">Edit</button><button class="rowbtn del" data-del="${c.id}">Delete</button></td></tr>`))}`;
  const form = (c = {}) => {
    modal(`<h2 style="margin-bottom:18px">${c.id ? 'Edit category' : 'Add category'}</h2><form id="cf" class="form-grid">${fld('name', 'Name', c.name)}${fld('slug', 'URL slug (optional)', c.slug)}${fld('sort_order', 'Display order', c.sort_order ?? 0, 'number')}${fld('description', 'Description', c.description || '', 'textarea', true)}
      <div class="field full"><label for="image_url">Image URL</label><input id="image_url" value="${esc(c.image_url || '')}"><div><label class="btn ghost sm" for="up" style="cursor:pointer;margin-top:8px">Upload image</label><input id="up" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only"></div></div>
      <div class="full" style="display:flex;gap:12px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-x>Cancel</button></div></form>`);
    qs('#up').onchange = async e => { const fd = new FormData(); fd.append('file', e.target.files[0]); try { qs('#image_url').value = (await api('/admin/upload', { method: 'POST', form: fd })).url; } catch (err) { toast(err.message, 'error'); } };
    qs('#cf').onsubmit = async e => { e.preventDefault(); try { await api(c.id ? '/admin/categories/' + c.id : '/admin/categories', { method: c.id ? 'PUT' : 'POST', body: { name: val('name'), slug: val('slug'), sort_order: val('sort_order'), description: val('description'), image_url: val('image_url') } }); toast('Category saved.'); closeModal(); route(); } catch (err) { toast(err.message, 'error'); } };
  };
  qs('#add').onclick = () => form();
  view.onclick = e => { const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]'); if (ed) form(cats.find(c => c.id === ed.dataset.edit)); if (del) confirmDo('Delete this category?', () => api('/admin/categories/' + del.dataset.del, { method: 'DELETE' })); };
}

// ───── Orders ─────
let oPage = 1, oStatus = '';
async function orders() {
  const r = await api('/admin/orders', { query: { q: search, status: oStatus, page: oPage, per_page: 15 } });
  view.innerHTML = `<h1>Orders</h1><div class="bar"><select id="st" aria-label="Filter by status"><option value="">All statuses</option>${STATUSES.map(s => `<option ${s === oStatus ? 'selected' : ''}>${s}</option>`).join('')}</select><span class="muted">${r.total} orders</span></div>${table(['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', ''], r.items.map(o => `<tr><td>${esc(o.order_number)}</td><td>${esc(o.ship_name)}<br><span class="muted" style="font-size:12px">${esc(o.ship_email)}</span></td><td>${o.order_items.reduce((n, i) => n + i.quantity, 0)}</td><td>${money(o.total)}</td><td>${o.payment_method === 'cod' ? 'COD' : 'Demo'} · ${o.payment_status}</td><td><span class="status ${o.status}">${o.status}</span></td><td>${date(o.created_at)}</td><td><button class="rowbtn" data-view="${o.id}">Manage</button></td></tr>`))}${pager(r.total, oPage, 15)}`;
  qs('#st').onchange = e => { oStatus = e.target.value; oPage = 1; route(); };
  view.onclick = async e => { const v = e.target.closest('[data-view]'), pg = e.target.closest('[data-pg]'); if (pg) { oPage = +pg.dataset.pg; route(); } if (v) orderModal(v.dataset.view); };
}
async function orderModal(id) {
  const o = await api('/admin/orders/' + id), flow = STATUSES.slice(0, 5), i = flow.indexOf(o.status);
  const next = o.status === 'cancelled' ? [] : flow.slice(i + 1);
  modal(`<h2>Order ${esc(o.order_number)}</h2><p class="muted">${date(o.created_at)} · <span class="status ${o.status}">${o.status}</span></p>
    ${table(['Product', 'Qty', 'Unit', 'Total'], o.order_items.map(x => `<tr><td>${esc(x.product_name)}</td><td>${x.quantity}</td><td>${money(x.unit_price)}</td><td>${money(x.unit_price * x.quantity)}</td></tr>`))}
    <p style="margin-top:14px">Subtotal ${money(o.subtotal)} · Discount ${money(o.discount)} · Shipping ${money(o.shipping)} · <strong>Total ${money(o.total)}</strong></p>
    <p><strong>Ship to:</strong> ${esc(o.ship_name)}, ${esc(o.ship_address)}, ${esc(o.ship_city)}, ${esc(o.ship_state)} ${esc(o.ship_postal_code)}, ${esc(o.ship_country)} · ${esc(o.ship_phone)} · ${esc(o.ship_email)}</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">${next.length ? sel('ns', 'Move to', Object.fromEntries(next.map(s => [s, s])), next[0]) + '<button class="btn sm" id="go" style="align-self:end;margin-bottom:18px">Update status</button>' : ''}${['pending', 'confirmed', 'processing'].includes(o.status) ? '<button class="btn ghost sm" id="cx" style="align-self:end;margin-bottom:18px">Cancel order</button>' : ''}<button class="btn ghost sm" data-x style="align-self:end;margin-bottom:18px">Close</button></div>`);
  const set = async s => { try { await api(`/admin/orders/${id}/status`, { method: 'PUT', body: { status: s } }); toast('Order updated.'); closeModal(); route(); } catch (err) { toast(err.message, 'error'); } };
  qs('#go')?.addEventListener('click', () => set(val('ns'))); qs('#cx')?.addEventListener('click', () => confirm('Cancel this order and restock the items?') && set('cancelled'));
}

// ───── Customers ─────
async function customers() {
  const r = await api('/admin/customers', { query: { q: search, per_page: 25 } });
  view.innerHTML = `<h1>Customers</h1><p class="muted">${r.total} customers</p>${table(['Name', 'Email', 'Phone', 'Orders', 'Spent', 'Joined', ''], r.items.map(c => `<tr><td>${esc(c.full_name)}</td><td>${esc(c.email)}</td><td>${esc(c.phone || '—')}</td><td>${c.orders}</td><td>${money(c.spent)}</td><td>${date(c.created_at)}</td><td><button class="rowbtn" data-view="${c.id}">Profile</button></td></tr>`))}`;
  view.onclick = async e => { const v = e.target.closest('[data-view]'); if (!v) return; const d = await api('/admin/customers/' + v.dataset.view);
    modal(`<h2>${esc(d.profile.full_name)}</h2><p class="muted">${esc(d.profile.email)} · ${esc(d.profile.phone || 'no phone')} · joined ${date(d.profile.created_at)}</p><h3 style="margin:18px 0 8px">Order history</h3>${table(['Order', 'Date', 'Total', 'Status'], d.orders.map(o => `<tr><td>${esc(o.order_number)}</td><td>${date(o.created_at)}</td><td>${money(o.total)}</td><td><span class="status ${o.status}">${o.status}</span></td></tr>`))}<button class="btn ghost sm" data-x style="margin-top:16px">Close</button>`); };
}

// ───── Reviews ─────
async function reviews() {
  const r = (await api('/admin/reviews')).items.filter(x => !search || (x.body + x.title + (x.product?.name || '')).toLowerCase().includes(search.toLowerCase()));
  view.innerHTML = `<h1>Reviews</h1>${table(['Product', 'Customer', 'Rating', 'Review', 'Date', ''], r.map(x => `<tr><td>${esc(x.product?.name || '')}</td><td>${esc(x.profiles?.full_name || '')}</td><td>${x.rating}/5</td><td><strong>${esc(x.title)}</strong><br>${esc(x.body)}</td><td>${date(x.created_at)}</td><td><button class="rowbtn del" data-del="${x.id}">Remove</button></td></tr>`))}`;
  view.onclick = e => { const d = e.target.closest('[data-del]'); if (d) confirmDo('Remove this review?', () => api('/admin/reviews/' + d.dataset.del, { method: 'DELETE' })); };
}

// ───── Coupons ─────
async function coupons() {
  const list = (await api('/admin/coupons')).items;
  view.innerHTML = `<h1>Coupons</h1><div class="bar"><button class="btn sm" id="add">Create coupon</button></div>${table(['Code', 'Discount', 'Min spend', 'Uses limit', 'Expires', 'Active', ''], list.map(c => `<tr><td>${esc(c.code)}</td><td>${c.discount_type === 'percent' ? c.discount_value + '%' : money(c.discount_value)}</td><td>${money(c.min_subtotal)}</td><td>${c.max_uses ?? '∞'}</td><td>${c.expires_at ? date(c.expires_at) : 'Never'}</td><td>${c.is_active ? 'Yes' : 'No'}</td><td><button class="rowbtn" data-edit="${c.id}">Edit</button><button class="rowbtn del" data-del="${c.id}">Delete</button></td></tr>`))}`;
  const form = (c = {}) => {
    modal(`<h2 style="margin-bottom:18px">${c.id ? 'Edit coupon' : 'Create coupon'}</h2><form id="cf" class="form-grid">${fld('code', 'Code', c.code)}${sel('discount_type', 'Type', { percent: 'Percent off', fixed: 'Fixed amount off' }, c.discount_type)}${fld('discount_value', 'Value', c.discount_value, 'number')}${fld('min_subtotal', 'Minimum spend (₹)', c.min_subtotal ?? 0, 'number')}${fld('max_uses', 'Total uses (blank = unlimited)', c.max_uses ?? '', 'number')}${fld('expires_at', 'Expires on', c.expires_at ? c.expires_at.slice(0, 10) : '', 'date')}
      <div class="full">${chk('is_active', 'Active', c.id ? c.is_active : true)}</div><div class="full" style="display:flex;gap:12px"><button class="btn">Save coupon</button><button class="btn ghost" type="button" data-x>Cancel</button></div></form>`);
    qs('#cf').onsubmit = async e => { e.preventDefault(); const body = { code: val('code'), discount_type: val('discount_type'), discount_value: val('discount_value'), min_subtotal: val('min_subtotal'), max_uses: val('max_uses'), expires_at: val('expires_at'), is_active: qs('#is_active').checked };
      try { await api(c.id ? '/admin/coupons/' + c.id : '/admin/coupons', { method: c.id ? 'PUT' : 'POST', body }); toast('Coupon saved.'); closeModal(); route(); } catch (err) { toast(err.message, 'error'); } };
  };
  qs('#add').onclick = () => form();
  view.onclick = e => { const ed = e.target.closest('[data-edit]'), d = e.target.closest('[data-del]'); if (ed) form(list.find(c => c.id === ed.dataset.edit)); if (d) confirmDo('Delete this coupon?', () => api('/admin/coupons/' + d.dataset.del, { method: 'DELETE' })); };
}

// ───── Settings ─────
async function settings() {
  const s = await api('/settings'); const st = s.store || {}, a = s.announcement || {}, c = s.contact || {}, sh = s.shipping || {};
  view.innerHTML = `<h1>Website settings</h1><form id="sf" class="box form-grid" style="max-width:820px">${fld('store_name', 'Store name', st.name)}${fld('tagline', 'Tagline', st.tagline)}
    ${fld('ann', 'Announcement bar text', a.text, 'text', true)}<div class="full">${chk('ann_on', 'Show the announcement bar', a.enabled)}</div>${fld('email', 'Contact email', c.email, 'email')}${fld('phone', 'Contact phone', c.phone)}${fld('address', 'Contact address', c.address, 'text', true)}
    ${fld('flat', 'Flat shipping rate (₹)', sh.flat_rate, 'number')}${fld('free', 'Free shipping above (₹)', sh.free_threshold, 'number')}${fld('ship_info', 'Shipping information', sh.info, 'textarea', true)}<div class="full"><button class="btn">Save settings</button></div></form>`;
  qs('#sf').onsubmit = async e => { e.preventDefault();
    try { await api('/admin/settings', { method: 'PUT', body: { store: { ...st, name: val('store_name'), tagline: val('tagline') }, announcement: { text: val('ann'), enabled: qs('#ann_on').checked }, contact: { email: val('email'), phone: val('phone'), address: val('address') }, shipping: { flat_rate: +val('flat'), free_threshold: +val('free'), info: val('ship_info') } } }); toast('Settings saved.'); } catch (err) { toast(err.message, 'error'); } };
}
