// Data layer. Replaces the old PHP backend: every call below talks to Supabase directly from the browser.
// Pages keep calling api('/products', …) exactly as before; this file routes each call to Supabase.
// Security is enforced by Row Level Security + SQL functions in database/schema.sql, not by this file.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CFG = window.AURELLE_CONFIG || {};
export const configured = !!CFG.SUPABASE_URL && !CFG.SUPABASE_URL.includes('YOUR-PROJECT') && !!CFG.SUPABASE_ANON_KEY && !CFG.SUPABASE_ANON_KEY.startsWith('YOUR-');

// "Remember me": the session lives in localStorage (stays signed in) or sessionStorage (ends with the tab).
const REMEMBER = 'aurelle.remember';
const store = () => (localStorage.getItem(REMEMBER) === '0' ? sessionStorage : localStorage);
const storage = {
  getItem: k => sessionStorage.getItem(k) ?? localStorage.getItem(k),
  setItem: (k, v) => { const s = store(), o = s === localStorage ? sessionStorage : localStorage; o.removeItem(k); s.setItem(k, v); },
  removeItem: k => { localStorage.removeItem(k); sessionStorage.removeItem(k); },
};

export const supabase = createClient(
  configured ? CFG.SUPABASE_URL : 'https://not-configured.supabase.co',
  configured ? CFG.SUPABASE_ANON_KEY : 'not-configured',
  { auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);
const sb = supabase;

export const session = {
  async get() { return (await sb.auth.getSession()).data.session; },
  async clear() { await sb.auth.signOut(); },
};

export class ApiError extends Error {
  constructor(message, status = 400, data) { super(message); this.status = status; this.data = data; }
}
const fail = (m, s = 400) => { throw new ApiError(m, s); };

// Turn a Supabase/Postgres error into a short, human message.
function explain(e) {
  const m = String(e?.message || '');
  if (e?.code === 'PGRST301' || /JWT/i.test(m)) return 'Your session has expired. Please sign in again.';
  if (e?.code === '42501' || /row-level security|permission denied/i.test(m)) return 'You do not have permission to do that.';
  if (e?.code === '23505') return 'That already exists.';
  if (e?.code === '23503') return 'That item is still in use, so it cannot be removed.';
  if (/failed to fetch|networkerror|load failed/i.test(m)) return 'Cannot reach the server. Check your connection and try again.';
  return m || 'Something went wrong.';
}
const ok = ({ data, error, count }) => { if (error) throw new ApiError(explain(error), error.status || 400); return count === undefined || count === null ? data : { data, count }; };
const rows = async q => ok(await q);

async function uid(required = true) {
  const s = await session.get();
  if (!s && required) fail('Please sign in to continue.', 401);
  return s?.user?.id || null;
}
async function requireAdmin() {
  const id = await uid();
  const { data } = await sb.from('profiles').select('role').eq('id', id).maybeSingle();
  if (data?.role !== 'admin') fail('You do not have permission to do that.', 403);
  return id;
}

// ───── Validation (same rules the PHP version used) ─────
const V = {
  email(v) { v = String(v || '').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 254) fail('Enter a valid email address.', 422); return v; },
  text(o, key, label, min = 1, max = 255, required = true) {
    const v = String(o?.[key] ?? '').trim();
    if (!v) { if (required) fail(`${label} is required.`, 422); return null; }
    if (v.length < min || v.length > max) fail(`${label} must be between ${min} and ${max} characters.`, 422);
    return v.replace(/<[^>]*>/g, '');
  },
  password(v) { v = String(v || ''); if (v.length < 8 || !/[A-Za-z]/.test(v) || !/\d/.test(v)) fail('Password must be at least 8 characters and include a letter and a number.', 422); return v; },
  phone(o, key = 'phone', required = true) {
    const v = String(o?.[key] ?? '').trim();
    if (!v && !required) return null;
    if (!/^\+?[0-9\s-]{7,15}$/.test(v)) fail('Enter a valid phone number.', 422);
    return v;
  },
  uuid(v) { v = String(v || ''); if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) fail('Invalid identifier.', 422); return v.toLowerCase(); },
  num(v, label, min = 0, max = null) { if (v === '' || v === null || v === undefined || isNaN(Number(v))) fail(`${label} must be a number.`, 422); const n = Number(v); if (n < min || (max !== null && n > max)) fail(`${label} is out of range.`, 422); return n; },
  slug(v) { v = String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); return (v || 'item').slice(0, 80); },
  term(v) { return String(v || '').slice(0, 60).replace(/[^\p{L}\p{N}\s-]/gu, '').trim(); },
  url(v) {
    if (!v) return null;
    if (/^\/(?!\/)[A-Za-z0-9._~/%-]+$/.test(v)) return v;
    if (!/^https?:\/\//i.test(v)) fail('Image URLs must start with http://, https:// or /.', 422);
    try { new URL(v); } catch { fail('Enter a valid image URL.', 422); }
    return v;
  },
};

const SELECT = '*,category:categories(name,slug),product_images(url,alt,sort_order)';
const shape = p => { const imgs = [...(p.product_images || [])].sort((a, b) => a.sort_order - b.sort_order); const { product_images, ...rest } = p; return { ...rest, images: imgs, image: imgs[0]?.url || null }; };
const range = (page, per) => [(page - 1) * per, (page - 1) * per + per - 1];
const pager = (query, def = 15) => { const per = Math.min(50, Math.max(1, +query.per_page || def)), page = Math.max(1, +query.page || 1); return { per, page, from: (page - 1) * per, to: (page - 1) * per + per - 1 }; };
const ext = f => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[f?.type]);
const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => b.toString(16).padStart(2, '0')).join('');

async function uploadImage(bucket, folder, file) {
  if (!file || !file.size) fail('Choose an image to upload.', 422);
  if (file.size > 4 * 1024 * 1024) fail('Images must be 4 MB or smaller.', 422);
  const e = ext(file); if (!e) fail('Only JPG, PNG or WebP images are allowed.', 422);
  const path = `${folder}/${rand()}.${e}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw new ApiError(explain(error));
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

const SHIP_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const ORDER_SELECT = '*,order_items(id,product_id,product_name,sku,image_url,unit_price,quantity)';
const site = () => location.origin;

// ───── Route table: [method, regex, handler(match, {body, query, form})] ─────
const ID = '([0-9a-fA-F-]{36})', SLUG = '([a-z0-9-]+)';
const routes = [
  // ── Catalogue ──
  ['GET', /^\/products$/, async (_, { query: g }) => {
    const per = Math.min(48, Math.max(1, +g.per_page || 12)), page = Math.max(1, +g.page || 1), [from, to] = range(page, per);
    let q = sb.from('products').select(SELECT, { count: 'exact' }).eq('is_published', true);
    if (g.category) {
      const c = (await rows(sb.from('categories').select('id').eq('slug', V.slug(g.category)).limit(1)))[0];
      q = q.eq('category_id', c?.id || '00000000-0000-0000-0000-000000000000');
    }
    if (g.collection) q = q.eq('collection', V.slug(g.collection));
    if (g.price_min !== undefined && g.price_min !== '') q = q.gte('effective_price', Number(g.price_min) || 0);
    if (g.price_max !== undefined && g.price_max !== '') q = q.lte('effective_price', Number(g.price_max) || 0);
    if (String(g.in_stock) === '1') q = q.gt('stock', 0);
    if (String(g.bestseller) === '1') q = q.eq('is_bestseller', true);
    if (String(g.featured) === '1') q = q.eq('is_featured', true);
    if (String(g.new) === '1') q = q.gte('created_at', new Date(Date.now() - 45 * 864e5).toISOString());
    const term = V.term(g.q); if (term) q = q.or(`name.ilike.*${term}*,description.ilike.*${term}*`);
    const sorts = { price_asc: ['effective_price', true], price_desc: ['effective_price', false], popular: ['sold_count', false], rating: ['rating_avg', false] };
    const [col, asc] = sorts[g.sort] || ['created_at', false];
    q = q.order(col, { ascending: asc });
    if (g.sort === 'rating') q = q.order('rating_count', { ascending: false });
    const r = ok(await q.range(from, to));
    return { items: r.data.map(shape), total: r.count, page, per_page: per };
  }],
  ['GET', new RegExp(`^/products/${SLUG}$`), async m => {
    const p = (await rows(sb.from('products').select(SELECT).eq('slug', m[1]).eq('is_published', true).limit(1)))[0];
    if (!p) fail('Product not found.', 404);
    const related = await rows(sb.from('products').select(SELECT).eq('category_id', p.category_id).neq('id', p.id).eq('is_published', true).order('sold_count', { ascending: false }).limit(4));
    return { product: shape(p), related: related.map(shape) };
  }],
  ['GET', new RegExp(`^/products/${ID}/reviews$`), async m => ({ items: ok(await sb.rpc('product_reviews', { p_product: V.uuid(m[1]) })) || [] })],
  ['POST', new RegExp(`^/products/${ID}/reviews$`), async (m, { body: b }) => {
    const user = await uid();
    const rating = Math.round(V.num(b.rating, 'Rating', 1, 5));
    const row = { product_id: V.uuid(m[1]), user_id: user, rating, title: V.text(b, 'title', 'Title', 0, 80, false) || '', body: V.text(b, 'body', 'Review', 0, 1000, false) || '' };
    ok(await sb.from('reviews').upsert(row, { onConflict: 'product_id,user_id' }));
    return { ok: true };
  }],
  ['GET', /^\/categories$/, async () => {
    const cats = await rows(sb.from('categories').select('*').order('sort_order'));
    const prods = await rows(sb.from('products').select('category_id').eq('is_published', true).limit(1000));
    const n = {}; prods.forEach(r => { n[r.category_id] = (n[r.category_id] || 0) + 1; });
    return { items: cats.map(c => ({ ...c, product_count: n[c.id] || 0 })) };
  }],
  ['GET', /^\/settings$/, async () => Object.fromEntries((await rows(sb.from('store_settings').select('key,value'))).map(r => [r.key, r.value]))],
  ['POST', /^\/newsletter$/, async (_, { body: b }) => {
    const { error } = await sb.from('newsletter_subscribers').insert({ email: V.email(b.email) });
    if (error && error.code !== '23505') throw new ApiError(explain(error));
    return { ok: true, message: 'Thank you for subscribing.' };
  }],

  // ── Auth (Supabase Auth: email verification, password reset) ──
  ['POST', /^\/auth\/register$/, async (_, { body: b }) => {
    const name = V.text(b, 'full_name', 'Full name', 2, 80), email = V.email(b.email), pw = V.password(b.password);
    if (b.confirm_password !== pw) fail('Passwords do not match.', 422);
    localStorage.setItem(REMEMBER, '1');
    const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { full_name: name }, emailRedirectTo: `${site()}/login.html?verified=1` } });
    if (error) {
      if (/already|registered/i.test(error.message)) fail('An account with this email already exists. Try signing in.', 409);
      if (/rate limit|too many/i.test(error.message)) fail('Too many attempts. Please wait a few minutes and try again.', 429);
      fail(error.message || 'We could not create your account. Please check your details and try again.');
    }
    // With "Confirm email" on, Supabase returns a user with no identities when the address is already registered.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) fail('An account with this email already exists. Try signing in.', 409);
    if (data.session) return { session: true };
    return { message: 'Account created. We have emailed you a verification link — click it to confirm your address, then sign in.' };
  }],
  ['POST', /^\/auth\/login$/, async (_, { body: b }) => {
    const email = V.email(b.email);
    localStorage.setItem(REMEMBER, b.remember ? '1' : '0');
    const { error } = await sb.auth.signInWithPassword({ email, password: String(b.password || '') });
    if (error) {
      if (/not confirmed|confirm/i.test(error.message)) fail('Please verify your email address before signing in. Check your inbox for the link.', 401);
      if (/rate limit|too many/i.test(error.message)) fail('Too many attempts. Please wait a few minutes and try again.', 429);
      fail('Incorrect email or password.', 401);
    }
    return { session: true };
  }],
  ['POST', /^\/auth\/resend$/, async (_, { body: b }) => {
    const { error } = await sb.auth.resend({ type: 'signup', email: V.email(b.email), options: { emailRedirectTo: `${site()}/login.html?verified=1` } });
    if (error) fail(/rate limit|too many|seconds/i.test(error.message) ? 'Please wait a minute before requesting another email.' : 'We could not send the email. Please try again.');
    return { message: 'Verification email sent. Check your inbox (and spam folder).' };
  }],
  ['POST', /^\/auth\/logout$/, async () => { await sb.auth.signOut(); return { ok: true }; }],
  ['POST', /^\/auth\/forgot$/, async (_, { body: b }) => {
    await sb.auth.resetPasswordForEmail(V.email(b.email), { redirectTo: `${site()}/reset-password.html` });
    // Always the same answer so the form cannot be used to discover which emails have accounts.
    return { message: 'If an account exists for that email, a reset link is on its way.' };
  }],
  ['POST', /^\/auth\/reset$/, async (_, { body: b }) => {
    const pw = V.password(b.password); if (b.confirm_password !== pw) fail('Passwords do not match.', 422);
    if (!(await session.get())) fail('This reset link is invalid or has expired. Request a new one.', 400);
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) fail(/different|same/i.test(error.message) ? 'Choose a password you have not used before.' : 'This reset link is invalid or has expired. Request a new one.');
    await sb.auth.signOut();
    return { message: 'Your password has been updated. You can now sign in.' };
  }],

  // ── My account ──
  ['GET', /^\/me$/, async () => {
    const id = await uid();
    const p = (await rows(sb.from('profiles').select('*').eq('id', id).limit(1)))[0];
    if (!p) fail('Please sign in to continue.', 401);
    return p;
  }],
  ['PUT', /^\/me$/, async (_, { body: b }) => {
    const id = await uid();
    const row = { full_name: V.text(b, 'full_name', 'Full name', 2, 80), phone: V.phone(b, 'phone', false) };
    return (await rows(sb.from('profiles').update(row).eq('id', id).select()))[0] || {};
  }],
  ['POST', /^\/me\/avatar$/, async (_, { form }) => {
    const id = await uid();
    const url = await uploadImage('avatars', id, form?.get('file'));
    ok(await sb.from('profiles').update({ avatar_url: url }).eq('id', id));
    return { avatar_url: url };
  }],
  ['POST', /^\/me\/password$/, async (_, { body: b }) => {
    await uid(); const pw = V.password(b.password); if (b.confirm_password !== pw) fail('Passwords do not match.', 422);
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) fail(/different|same/i.test(error.message) ? 'Choose a password you have not used before.' : 'We could not update your password. Please sign in again and retry.');
    return { message: 'Password updated.' };
  }],
  ['GET', /^\/addresses$/, async () => ({ items: await rows(sb.from('addresses').select('*').eq('user_id', await uid()).order('is_default', { ascending: false }).order('created_at', { ascending: false })) })],
  ['POST', /^\/addresses$/, async (_, { body }) => saveAddress(null, body)],
  ['PUT', new RegExp(`^/addresses/${ID}$`), async (m, { body }) => saveAddress(V.uuid(m[1]), body)],
  ['DELETE', new RegExp(`^/addresses/${ID}$`), async m => { ok(await sb.from('addresses').delete().eq('id', V.uuid(m[1])).eq('user_id', await uid())); return { ok: true }; }],

  // ── Cart (guests are priced by the database too; members' carts are saved in Supabase) ──
  ['POST', /^\/cart\/quote$/, async (_, { body: b }) => {
    const items = (b.items || []).map(i => ({ product_id: V.uuid(i.product_id), quantity: Math.max(1, Math.min(99, +i.quantity || 1)) }));
    return ok(await sb.rpc('quote_cart', { p_items: items, p_coupon: b.coupon || null }));
  }],
  ['GET', /^\/cart$/, async (_, { query: g }) => { await uid(); return ok(await sb.rpc('my_cart', { p_coupon: g.coupon || null })); }],
  ['PUT', /^\/cart\/items$/, async (_, { body: b }) => {
    await uid(); const qty = Math.round(V.num(b.quantity, 'Quantity', 0, 99));
    return ok(await sb.rpc('set_cart_item', { p_product: V.uuid(b.product_id), p_qty: qty }));
  }],

  // ── Wishlist ──
  ['GET', /^\/wishlist$/, async () => {
    await uid();
    const r = await rows(sb.from('wishlist_items').select(`created_at,product:products(${SELECT})`).order('created_at', { ascending: false }));
    const items = r.map(x => x.product).filter(p => p && p.is_published).map(shape);
    return { items, ids: items.map(p => p.id) };
  }],
  ['POST', new RegExp(`^/wishlist/${ID}$`), async m => { await uid(); ok(await sb.rpc('add_to_wishlist', { p_product: V.uuid(m[1]) })); return { ok: true }; }],
  ['DELETE', new RegExp(`^/wishlist/${ID}$`), async m => { await uid(); ok(await sb.rpc('remove_from_wishlist', { p_product: V.uuid(m[1]) })); return { ok: true }; }],

  // ── Orders ──
  ['POST', /^\/orders$/, async (_, { body: b }) => {
    await uid(); const s = b.shipping; if (!s || typeof s !== 'object') fail('Shipping details are required.', 422);
    const ship = { name: V.text(s, 'name', 'Full name', 2, 80), email: V.email(s.email), phone: V.phone(s), address: V.text(s, 'address', 'Address', 5, 200),
      city: V.text(s, 'city', 'City', 2, 80), state: V.text(s, 'state', 'State', 2, 80), postal_code: V.text(s, 'postal_code', 'Postal code', 3, 12), country: V.text(s, 'country', 'Country', 2, 60) };
    if (!['cod', 'demo_online'].includes(b.payment_method)) fail('Choose a payment method.', 422);
    return ok(await sb.rpc('place_order', { p_ship: ship, p_payment: b.payment_method, p_coupon: b.coupon || null }));
  }],
  ['GET', /^\/orders$/, async () => ({ items: await rows(sb.from('orders').select(ORDER_SELECT).eq('user_id', await uid()).order('created_at', { ascending: false })) })],
  ['GET', new RegExp(`^/orders/${ID}$`), async m => {
    const o = (await rows(sb.from('orders').select(ORDER_SELECT).eq('id', V.uuid(m[1])).eq('user_id', await uid()).limit(1)))[0];
    if (!o) fail('Order not found.', 404);
    return o;
  }],
  ['POST', new RegExp(`^/orders/${ID}/cancel$`), async m => { await uid(); ok(await sb.rpc('cancel_order', { p_order: V.uuid(m[1]) })); return { ok: true }; }],

  // ── Admin (every call is also protected by RLS / is_admin() in the database) ──
  ['GET', /^\/admin\/stats$/, async () => {
    await requireAdmin();
    const stats = ok(await sb.rpc('admin_stats'));
    const recent = await rows(sb.from('orders').select('id,order_number,ship_name,total,status,created_at').order('created_at', { ascending: false }).limit(8));
    return { ...stats, recent_orders: recent };
  }],
  ['GET', /^\/admin\/products$/, async (_, { query: g }) => {
    await requireAdmin(); const { page, from, to } = pager(g);
    let q = sb.from('products').select('*,category:categories(name),product_images(url,alt,sort_order)', { count: 'exact' }).order('created_at', { ascending: false });
    const t = V.term(g.q); if (t) q = q.or(`name.ilike.*${t}*,sku.ilike.*${t}*`);
    const r = ok(await q.range(from, to)); return { items: r.data.map(shape), total: r.count, page };
  }],
  ['POST', /^\/admin\/products$/, async (_, { body }) => saveProduct(null, body)],
  ['PUT', new RegExp(`^/admin/products/${ID}$`), async (m, { body }) => saveProduct(V.uuid(m[1]), body)],
  ['DELETE', new RegExp(`^/admin/products/${ID}$`), async m => { await requireAdmin(); ok(await sb.from('products').delete().eq('id', V.uuid(m[1]))); return { ok: true }; }],
  ['POST', /^\/admin\/upload$/, async (_, { form }) => { await requireAdmin(); const d = new Date(); return { url: await uploadImage('product-images', `admin/${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`, form?.get('file')) }; }],
  ['POST', /^\/admin\/categories$/, async (_, { body }) => saveCategory(null, body)],
  ['PUT', new RegExp(`^/admin/categories/${ID}$`), async (m, { body }) => saveCategory(V.uuid(m[1]), body)],
  ['DELETE', new RegExp(`^/admin/categories/${ID}$`), async m => {
    await requireAdmin(); const id = V.uuid(m[1]);
    if ((await rows(sb.from('products').select('id').eq('category_id', id).limit(1))).length) fail('Move or delete the products in this category first.', 409);
    ok(await sb.from('categories').delete().eq('id', id)); return { ok: true };
  }],
  ['GET', /^\/admin\/orders$/, async (_, { query: g }) => {
    await requireAdmin(); const { page, from, to } = pager(g);
    let q = sb.from('orders').select('*,order_items(product_name,quantity)', { count: 'exact' }).order('created_at', { ascending: false });
    if ([...SHIP_FLOW, 'cancelled'].includes(g.status)) q = q.eq('status', g.status);
    const t = V.term(g.q); if (t) q = q.or(`order_number.ilike.*${t}*,ship_name.ilike.*${t}*,ship_email.ilike.*${t}*`);
    const r = ok(await q.range(from, to)); return { items: r.data, total: r.count, page };
  }],
  ['GET', new RegExp(`^/admin/orders/${ID}$`), async m => {
    await requireAdmin();
    const o = (await rows(sb.from('orders').select('*,order_items(*)').eq('id', V.uuid(m[1])).limit(1)))[0];
    if (!o) fail('Order not found.', 404); return o;
  }],
  ['PUT', new RegExp(`^/admin/orders/${ID}/status$`), async (m, { body: b }) => {
    await requireAdmin(); const id = V.uuid(m[1]), to = String(b.status || '');
    const o = (await rows(sb.from('orders').select('status,payment_method').eq('id', id).limit(1)))[0];
    if (!o) fail('Order not found.', 404);
    if (to === 'cancelled') { ok(await sb.rpc('admin_cancel_order', { p_order: id })); return { ok: true }; }
    const fi = SHIP_FLOW.indexOf(o.status), ti = SHIP_FLOW.indexOf(to);
    if (ti < 0 || fi < 0 || ti <= fi) fail(`An order that is ${o.status} cannot move to ${to || 'that status'}.`, 409);
    const patch = { status: to };
    if (to === 'delivered' && o.payment_method === 'cod') patch.payment_status = 'paid';   // cash collected on delivery
    ok(await sb.from('orders').update(patch).eq('id', id)); return { ok: true };
  }],
  ['GET', /^\/admin\/customers$/, async (_, { query: g }) => {
    await requireAdmin(); const { per, page, from } = pager(g, 25);
    return ok(await sb.rpc('admin_customers', { p_q: V.term(g.q), p_limit: per, p_offset: from }));
  }],
  ['GET', new RegExp(`^/admin/customers/${ID}$`), async m => {
    await requireAdmin(); const id = V.uuid(m[1]);
    const p = (await rows(sb.from('profiles').select('*').eq('id', id).limit(1)))[0]; if (!p) fail('Customer not found.', 404);
    return { profile: p, orders: await rows(sb.from('orders').select('id,order_number,status,total,created_at').eq('user_id', id).order('created_at', { ascending: false })) };
  }],
  ['GET', /^\/admin\/reviews$/, async () => { await requireAdmin(); return { items: await rows(sb.from('reviews').select('*,product:products(name,slug),profiles(full_name,email)').order('created_at', { ascending: false }).limit(100)) }; }],
  ['DELETE', new RegExp(`^/admin/reviews/${ID}$`), async m => { await requireAdmin(); ok(await sb.from('reviews').delete().eq('id', V.uuid(m[1]))); return { ok: true }; }],
  ['GET', /^\/admin\/coupons$/, async () => { await requireAdmin(); return { items: await rows(sb.from('coupons').select('*').order('created_at', { ascending: false })) }; }],
  ['POST', /^\/admin\/coupons$/, async (_, { body }) => saveCoupon(null, body)],
  ['PUT', new RegExp(`^/admin/coupons/${ID}$`), async (m, { body }) => saveCoupon(V.uuid(m[1]), body)],
  ['DELETE', new RegExp(`^/admin/coupons/${ID}$`), async m => { await requireAdmin(); ok(await sb.from('coupons').delete().eq('id', V.uuid(m[1]))); return { ok: true }; }],
  ['PUT', /^\/admin\/settings$/, async (_, { body: b }) => {
    await requireAdmin();
    for (const [key, value] of Object.entries(b || {})) {
      if (!['store', 'announcement', 'contact', 'shipping'].includes(key) || typeof value !== 'object' || !value) fail('Unknown settings section.', 422);
      const clean = JSON.parse(JSON.stringify(value), (_, v) => (typeof v === 'string' ? v.replace(/<[^>]*>/g, '') : v));
      ok(await sb.from('store_settings').upsert({ key, value: clean }, { onConflict: 'key' }));
    }
    return { ok: true };
  }],
];

// ───── Save helpers ─────
async function saveAddress(id, b) {
  const user = await uid();
  const row = { user_id: user, label: V.text(b, 'label', 'Label', 1, 30, false) || 'Home', full_name: V.text(b, 'full_name', 'Full name', 2, 80), phone: V.phone(b),
    line1: V.text(b, 'line1', 'Address', 5, 200), city: V.text(b, 'city', 'City', 2, 80), state: V.text(b, 'state', 'State', 2, 80),
    postal_code: V.text(b, 'postal_code', 'Postal code', 3, 12), country: V.text(b, 'country', 'Country', 2, 60), is_default: !!b.is_default };
  if (row.is_default) ok(await sb.from('addresses').update({ is_default: false }).eq('user_id', user));
  const res = id ? await rows(sb.from('addresses').update(row).eq('id', id).eq('user_id', user).select()) : await rows(sb.from('addresses').insert(row).select());
  if (!res[0]) fail('Address not found.', 404);
  return res[0];
}

async function saveProduct(id, b) {
  await requireAdmin();
  const name = V.text(b, 'name', 'Name', 2, 120), price = V.num(b.price, 'Price', 0, 1e7);
  const sale = b.sale_price === '' || b.sale_price == null ? null : V.num(b.sale_price, 'Sale price', 0, 1e7);
  if (sale !== null && sale >= price) fail('Sale price must be lower than the regular price.', 422);
  let colors = b.colors || []; if (typeof colors === 'string') colors = colors.split(',').map(s => s.trim()).filter(Boolean);
  const row = { name, slug: V.slug(b.slug || name), sku: V.text(b, 'sku', 'SKU', 2, 40), description: V.text(b, 'description', 'Description', 0, 4000, false) || '',
    category_id: V.uuid(b.category_id), collection: b.collection ? V.slug(b.collection) : null, price, sale_price: sale, stock: Math.round(V.num(b.stock, 'Stock', 0, 100000)),
    materials: V.text(b, 'materials', 'Materials', 0, 200, false), dimensions: V.text(b, 'dimensions', 'Dimensions', 0, 200, false),
    colors: colors.map(c => String(c).replace(/<[^>]*>/g, '')), is_featured: !!b.is_featured, is_bestseller: !!b.is_bestseller, is_published: !('is_published' in b) || !!b.is_published };
  const res = id ? await rows(sb.from('products').update(row).eq('id', id).select()) : await rows(sb.from('products').insert(row).select());
  if (!res[0]) fail('Product not found.', 404);
  if (Array.isArray(b.images)) {
    ok(await sb.from('product_images').delete().eq('product_id', res[0].id));
    const imgs = b.images.map((u, i) => ({ product_id: res[0].id, url: V.url(String(u)), alt: name, sort_order: i + 1 }));
    if (imgs.length) ok(await sb.from('product_images').insert(imgs));
  }
  return res[0];
}

async function saveCategory(id, b) {
  await requireAdmin();
  const name = V.text(b, 'name', 'Name', 2, 80);
  const row = { name, slug: V.slug(b.slug || name), description: V.text(b, 'description', 'Description', 0, 400, false) || '', image_url: V.url(b.image_url ? String(b.image_url) : null), sort_order: parseInt(b.sort_order) || 0 };
  const res = id ? await rows(sb.from('categories').update(row).eq('id', id).select()) : await rows(sb.from('categories').insert(row).select());
  if (!res[0]) fail('Category not found.', 404);
  return res[0];
}

async function saveCoupon(id, b) {
  await requireAdmin();
  const type = String(b.discount_type || ''); if (!['percent', 'fixed'].includes(type)) fail('Choose percent or fixed discount.', 422);
  const val = V.num(b.discount_value, 'Discount value', 0.01, type === 'percent' ? 100 : 1e7);
  let exp = null; if (b.expires_at) { const d = new Date(b.expires_at); if (isNaN(d)) fail('Enter a valid expiry date.', 422); exp = d.toISOString(); }
  const code = String(V.text(b, 'code', 'Code', 3, 30)).toUpperCase();
  if (!/^[A-Z0-9_-]+$/.test(code)) fail('Codes may only contain letters, numbers, - and _.', 422);
  const row = { code, discount_type: type, discount_value: val, min_subtotal: V.num(b.min_subtotal ?? 0, 'Minimum spend', 0), max_uses: b.max_uses !== '' && b.max_uses != null ? parseInt(b.max_uses) : null, expires_at: exp, is_active: !!b.is_active };
  const res = id ? await rows(sb.from('coupons').update(row).eq('id', id).select()) : await rows(sb.from('coupons').insert(row).select());
  if (!res[0]) fail('Coupon not found.', 404);
  return res[0];
}

// ───── Public entry point (same signature the pages already use) ─────
export async function api(path, { method = 'GET', body, query = {}, form } = {}) {
  if (!configured) throw new ApiError('The site is not connected to Supabase yet. Open js/config.js and add your Project URL and anon key.', 0);
  const q = Object.fromEntries(Object.entries(query || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  for (const [m, re, handler] of routes) {
    if (m !== method) continue;
    const match = path.match(re); if (!match) continue;
    try { return await handler(match, { body: body || {}, query: q, form }); }
    catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(explain(e), 500);
    }
  }
  throw new ApiError('Not found.', 404);
}
