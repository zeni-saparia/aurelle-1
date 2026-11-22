# AURELLE — home décor store (plain HTML + CSS + JS, Supabase, Vercel)

Same design, same images, same pages as before — but **no PHP and no server**. The pages talk straight to Supabase.

```
Browser ──► Vercel (static files)
   └──────► Supabase (Auth + Postgres + Storage)   ← security is enforced here by Row Level Security
```

Features: register with **email verification**, sign in ("remember me"), sign out, **forgot / reset password**,
profile page (edit details, photo, saved addresses, change password, **Sign out** button), wishlist, cart
(works for guests, saved to your account after sign-in), coupons, checkout, orders with tracking / cancel,
reviews, and the staff **admin** console.

## Setup (about 10 minutes)

### 1. Supabase
1. Create a project at supabase.com.
2. **SQL Editor** → paste and run `database/schema.sql`, then run `database/seed.sql`.
   Run each **once**, on a fresh project (the seed deletes existing products/categories first).
3. **Authentication → Providers → Email:** keep **Confirm email = ON** (this is what sends the verification email).
4. **Authentication → URL Configuration** (do this after you know your Vercel address):
   * **Site URL:** `https://YOUR-SITE.vercel.app`
   * **Redirect URLs:** add `https://YOUR-SITE.vercel.app/**` (and `http://localhost:3000/**` if you test locally)
5. **Project Settings → API:** copy the **Project URL** and the **anon public** key.

### 2. Put your keys in the site
Open `js/config.js` and paste the two values. That is the only file you edit.
The anon key is designed to be public. **Never** put the `service_role` key anywhere in this project.

### 3. Vercel
1. Push this folder to a GitHub repo → Vercel → **Add New → Project** → import it.
2. **Framework Preset: Other.** Leave Build Command and Output Directory empty. No environment variables are needed.
3. Deploy, then put the final address into Supabase (step 1.4).

### 4. Make yourself an admin
Register on the site and verify your email, then run this in the Supabase SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```
Sign in again — the account icon now opens `/admin/index.html` (products, categories, orders, customers, coupons, reviews, settings, image upload).

## Test locally
ES modules need a web server (not double-clicking the file):
```bash
npx serve -l 3000 .        # or:  python3 -m http.server 3000
```

## Things worth knowing
* **Verification emails:** Supabase's built-in mailer is limited to a few emails per hour — fine for testing.
  Before launch add your own SMTP (Supabase → Authentication → SMTP Settings; Resend, Brevo, Gmail SMTP, etc.).
* **Payments are a labelled demo** (orders are recorded as COD or `demo`, never "paid"). Add Razorpay/Stripe before taking real money.
* **Prices, stock, coupons and shipping are always recalculated in the database** (`quote_cart`, `place_order`), so the browser cannot change what you charge.
* **Images:** the shop images are in `assets/`. Admin uploads go to Supabase Storage (JPG/PNG/WebP, max 4 MB).
* About-page story, testimonials and contact details are sample copy — edit `about.html`, `index.html` and Admin → Settings.

## What changed from the PHP version
* Removed `api/`, `lib/`, `dev-server.php`, `.env`, `vercel.json` runtime config and the PHP tests.
* `js/api.js` now calls Supabase directly (same function names the pages already used, so the design/pages are untouched).
* `database/schema.sql` rewritten so security works without a server (RLS policies, `auth.uid()` functions, storage rules).
* Fixed a syntax error in the old `seed.sql` (stray comma) and a missing-function problem in order numbering.
* Reset-password and email-verification links now use Supabase's own sessions.
