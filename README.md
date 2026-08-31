# Manor-Cares — Administration Portal

A premium glassmorphism **Super Admin & Staff Administration web application** for the
Manor-Cares house cleaning services platform. This is an independent frontend project
(React + TypeScript + Vite) — completely separate from the customer/user app — that connects to
the **same Supabase project** (Auth + Postgres + REST) as `manor-cares-users`. It does **not**
run its own backend and does **not** create a second database.

## 1. Tech stack

- React 19 + TypeScript + Vite
- React Router (client-side routing, permission-gated protected routes)
- `@supabase/supabase-js` — Auth, Postgres REST, session management (anon key only in the browser)
- One Supabase Edge Function (`admin-create-account`) — the only place the `service_role` key is
  ever used, to create new administrator auth accounts server-side
- Plain CSS (no UI framework), reusing the exact brand tokens and glassmorphism utility classes
  from `manor-cares-users/src/index.css`

## 2. Project structure

```
supabase/admin_schema.sql             # Roles/permissions/audit log + HR/marketing/sales/technical/
                                       # transportation tables + RLS. Run AFTER manor-cares-users' schema.sql.
supabase/functions/admin-create-account/  # Edge Function: creates new admin accounts (service_role, server-side only)
src/lib/supabaseClient.ts             # Supabase client (anon key only)
src/lib/permissions.ts                # Role/permission key constants (mirrors the DB seed data)
src/context/AuthContext.tsx           # Loads profile + admin_profiles + roles/permissions; blocks
                                       # customer accounts and disabled admins from ever reaching the dashboard
src/components/                       # Shared glass UI kit + PermissionRoute/Sidebar (permission-aware nav)
src/pages/auth/                       # Dedicated Admin Login, Forgot/Reset Password
src/pages/dashboard/                  # Role-routed dashboards (Super Admin + one per department) and
                                       # feature modules: customers, bookings, services, transportation,
                                       # HR, finance, payments, invoices, sales, marketing, support,
                                       # reviews, technical, reports, notifications, admin management, audit log
src/types/database.ts                 # TypeScript types mirroring both schema.sql and admin_schema.sql
```

## 3. Setup

### 3.1 Database (same Supabase project as manor-cares-users)

1. Make sure `manor-cares-users/supabase/schema.sql` has already been run against your Supabase
   project.
2. Open the SQL Editor and run the entire contents of
   [`supabase/admin_schema.sql`](supabase/admin_schema.sql). It is idempotent and safe to re-run,
   and adds (without touching the customer app's tables):
   - `roles`, `permissions`, `role_permissions`, `user_roles`, `admin_profiles`, `audit_logs`
   - `employees`, `staff_attendance`, `leave_requests` (HR)
   - `marketing_campaigns`, `promotions`, `customer_segments` (Marketing)
   - `leads`, `quotes` (Sales)
   - `technical_tickets` (Technical)
   - `cleaning_teams`, `cleaning_team_members`, `vehicles`, `booking_assignments` (Transportation)
   - Security-definer helper functions (`private.has_permission`, `private.is_super_admin`, …)
     that every RLS policy in this file uses — an admin's DB-level access is revoked the instant
     their `admin_profiles.status` is set to `disabled`, regardless of their JWT still being valid.
   - Tightened RLS on the **shared** tables (`bookings`, `payments`, `invoices`,
     `support_tickets`, `customer_profiles`, `profiles`, …) so admin access is scoped to granular
     permissions instead of a blanket "is staff" check.
   - A redefinition of `handle_new_user()` so admin accounts (created via the Edge Function below)
     get `profiles` + `admin_profiles` rows instead of `customer_profiles` rows.

   > ⚠️ If you ever re-run `manor-cares-users/supabase/schema.sql` afterwards, re-run
   > `admin_schema.sql` again immediately after — it re-applies the tightened policies and the
   > `handle_new_user()` override, since whichever script runs last wins.



3. **Bootstrap the first Super Admin.** Sign up any account through Supabase Auth (e.g. via the
   Supabase dashboard, or temporarily via `supabase.auth.signUp` in a scratch script), then run the
   commented-out `do $$ ... $$` block at the bottom of `admin_schema.sql` with that person's email.
   This is the only manual step — every subsequent admin is created from inside this app by a
   Super Admin.

### 3.2 Deploy the Edge Function (admin account creation)

The browser never holds a `service_role` key. Creating a new admin auth account requires the
Supabase Admin API, so that one operation runs server-side as an Edge Function:

```bash
supabase functions deploy admin-create-account
supabase secrets set SUPABASE_URL=https://<project-ref>.supabase.co
supabase secrets set SUPABASE_ANON_KEY=<public anon key>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service role key>   # never put this in .env / the browser
```

### 3.3 Configure environment variables

```bash
cp .env.example .env
```

Use the **exact same** project URL/anon key as `manor-cares-users/.env` — both apps must point at
one Supabase project:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon key>
```

### 3.4 Install & run

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # production build (tsc -b && vite build)
```

## 4. Roles & permissions

Eight built-in roles: `super_admin`, `hr`, `customer_support`, `marketing`, `sales`, `finance`,
`technical`, `transportation`. Permissions (e.g. `customers.view`, `bookings.manage`,
`finance.manage`, `admins.manage`) are seeded and mapped to roles in `admin_schema.sql`. Adding a
new role/department later is just a new row in `roles` + `role_permissions` — no schema change,
and the sidebar/dashboard router in the frontend already adapts to whatever permissions the
signed-in admin actually has.

Security is enforced by Postgres Row Level Security, not by hiding UI elements — every table an
admin can read or write is gated by a `private.has_permission(...)` (or `private.is_super_admin()`)
check that also verifies the admin's account is still `active`.
