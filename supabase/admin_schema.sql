-- =====================================================================
-- Manor Cares — Admin app schema extension
-- Run this AFTER manor-cares-users/supabase/schema.sql, against the SAME
-- Supabase project/database (SQL Editor or `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / DO blocks + idempotent policy drops.
--
-- This file does NOT create a second database. It only adds admin-only
-- tables (roles, permissions, audit log, HR/marketing/sales/technical/
-- transportation domain tables) and tightens Row Level Security on the
-- shared tables so that access is enforced by granular permissions
-- instead of a blanket "is staff" check.
-- =====================================================================

create extension if not exists pgcrypto;
create schema if not exists private;

-- reuse the same updated_at trigger helper defined in schema.sql
create or replace function public.trg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 1. Role / permission architecture
-- =====================================================================
create table if not exists public.roles (
  id bigint generated always as identity primary key,
  key text not null unique check (key in
    ('super_admin', 'hr', 'customer_support', 'marketing', 'sales', 'finance', 'technical', 'transportation')),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id bigint generated always as identity primary key,
  key text not null unique,
  description text
);

create table if not exists public.role_permissions (
  role_id bigint not null references public.roles (id) on delete cascade,
  permission_id bigint not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

create index if not exists role_permissions_permission_id_idx on public.role_permissions (permission_id);

create table if not exists public.user_roles (
  id bigint generated always as identity primary key,
  profile_id bigint not null references public.profiles (id) on delete cascade,
  role_id bigint not null references public.roles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by bigint references public.profiles (id) on delete set null,
  unique (profile_id, role_id)
);

create index if not exists user_roles_profile_id_idx on public.user_roles (profile_id);
create index if not exists user_roles_role_id_idx on public.user_roles (role_id);

-- =====================================================================
-- 2. Admin account profiles (mirrors customer_profiles for admin/staff users)
-- =====================================================================
create sequence if not exists public.employee_code_seq start 100;

create table if not exists public.admin_profiles (
  id bigint generated always as identity primary key,
  profile_id bigint not null unique references public.profiles (id) on delete cascade,
  employee_code text unique,
  department text,
  job_title text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  last_login_at timestamptz,
  created_by bigint references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_profiles_profile_id_idx on public.admin_profiles (profile_id);

drop trigger if exists set_updated_at on public.admin_profiles;
create trigger set_updated_at before update on public.admin_profiles
  for each row execute function public.trg_set_updated_at();

create or replace function public.set_employee_code()
returns trigger
language plpgsql
as $$
begin
  if new.employee_code is null then
    new.employee_code := 'MC-EMP-' || lpad(nextval('public.employee_code_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_employee_code on public.admin_profiles;
create trigger trg_set_employee_code before insert on public.admin_profiles
  for each row execute function public.set_employee_code();

-- =====================================================================
-- 3. Audit log (immutable — insert-only, no update/delete policy)
-- =====================================================================
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  admin_user_id bigint references public.profiles (id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_admin_user_id_idx on public.audit_logs (admin_user_id);
create index if not exists audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- =====================================================================
-- 4. HR: employees, attendance, leave requests
-- =====================================================================
create sequence if not exists public.staff_code_seq start 1;

create table if not exists public.employees (
  id bigint generated always as identity primary key,
  profile_id bigint references public.profiles (id) on delete set null,
  employee_code text unique,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  department text,
  job_title text,
  employment_status text not null default 'active' check (employment_status in ('active', 'on_leave', 'terminated')),
  hire_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.employees;
create trigger set_updated_at before update on public.employees
  for each row execute function public.trg_set_updated_at();

create or replace function public.set_staff_code()
returns trigger
language plpgsql
as $$
begin
  if new.employee_code is null then
    new.employee_code := 'STAFF-' || lpad(nextval('public.staff_code_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_staff_code on public.employees;
create trigger trg_set_staff_code before insert on public.employees
  for each row execute function public.set_staff_code();

create table if not exists public.staff_attendance (
  id bigint generated always as identity primary key,
  employee_id bigint not null references public.employees (id) on delete cascade,
  work_date date not null,
  check_in time,
  check_out time,
  status text not null default 'present' check (status in ('present', 'absent', 'late', 'on_leave')),
  created_at timestamptz not null default now(),
  unique (employee_id, work_date)
);

create index if not exists staff_attendance_employee_id_idx on public.staff_attendance (employee_id);

create table if not exists public.leave_requests (
  id bigint generated always as identity primary key,
  employee_id bigint not null references public.employees (id) on delete cascade,
  leave_type text not null default 'annual',
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_by bigint references public.profiles (id) on delete set null,
  decided_at timestamptz
);

create index if not exists leave_requests_employee_id_idx on public.leave_requests (employee_id);

-- =====================================================================
-- 5. Marketing: campaigns, promotions, customer segments
-- =====================================================================
create table if not exists public.marketing_campaigns (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  channel text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  start_date date,
  end_date date,
  budget numeric(10, 2),
  created_by bigint references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.marketing_campaigns;
create trigger set_updated_at before update on public.marketing_campaigns
  for each row execute function public.trg_set_updated_at();

create table if not exists public.promotions (
  id bigint generated always as identity primary key,
  campaign_id bigint references public.marketing_campaigns (id) on delete set null,
  title text not null,
  description text,
  discount_type text not null default 'percentage' check (discount_type in ('percentage', 'flat')),
  discount_value numeric(10, 2) not null default 0,
  promo_code text unique not null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists promotions_campaign_id_idx on public.promotions (campaign_id);

create table if not exists public.customer_segments (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  criteria jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 6. Sales: leads, quotes
-- =====================================================================
create table if not exists public.leads (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text,
  phone text,
  source text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  assigned_to bigint references public.profiles (id) on delete set null,
  notes text,
  estimated_value numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_assigned_to_idx on public.leads (assigned_to);

drop trigger if exists set_updated_at on public.leads;
create trigger set_updated_at before update on public.leads
  for each row execute function public.trg_set_updated_at();

create table if not exists public.quotes (
  id bigint generated always as identity primary key,
  lead_id bigint references public.leads (id) on delete set null,
  customer_id bigint references public.customer_profiles (id) on delete set null,
  service_id bigint references public.cleaning_services (id) on delete set null,
  amount numeric(10, 2) not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined')),
  valid_until date,
  created_at timestamptz not null default now()
);

create index if not exists quotes_lead_id_idx on public.quotes (lead_id);
create index if not exists quotes_customer_id_idx on public.quotes (customer_id);

-- =====================================================================
-- 7. Technical support tickets (internal/system, distinct from customer support_tickets)
-- =====================================================================
create table if not exists public.technical_tickets (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null,
  category text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  reported_by bigint references public.profiles (id) on delete set null,
  assigned_to bigint references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.technical_tickets;
create trigger set_updated_at before update on public.technical_tickets
  for each row execute function public.trg_set_updated_at();

-- =====================================================================
-- 8. Transportation / logistics: cleaning teams, vehicles, assignments
-- =====================================================================
create table if not exists public.cleaning_teams (
  id bigint generated always as identity primary key,
  name text not null unique,
  leader_employee_id bigint references public.employees (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.cleaning_teams;
create trigger set_updated_at before update on public.cleaning_teams
  for each row execute function public.trg_set_updated_at();

create table if not exists public.cleaning_team_members (
  team_id bigint not null references public.cleaning_teams (id) on delete cascade,
  employee_id bigint not null references public.employees (id) on delete cascade,
  primary key (team_id, employee_id)
);

create table if not exists public.vehicles (
  id bigint generated always as identity primary key,
  plate_number text not null unique,
  model text,
  capacity integer,
  status text not null default 'available' check (status in ('available', 'in_use', 'maintenance')),
  assigned_team_id bigint references public.cleaning_teams (id) on delete set null
);

create table if not exists public.booking_assignments (
  id bigint generated always as identity primary key,
  booking_id bigint not null unique references public.bookings (id) on delete cascade,
  team_id bigint not null references public.cleaning_teams (id),
  vehicle_id bigint references public.vehicles (id) on delete set null,
  scheduled_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'en_route', 'on_site', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_assignments_team_id_idx on public.booking_assignments (team_id);

drop trigger if exists set_updated_at on public.booking_assignments;
create trigger set_updated_at before update on public.booking_assignments
  for each row execute function public.trg_set_updated_at();

-- =====================================================================
-- Private RLS helper functions
-- All permission/role checks live-check admin_profiles.status so a
-- disabled admin instantly loses ALL access, even with a valid JWT.
-- =====================================================================
create or replace function private.admin_is_active()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (
      select ap.status = 'active'
      from public.admin_profiles ap
      join public.profiles p on p.id = ap.profile_id
      where p.user_id = (select auth.uid())
    ),
    false
  );
$$;

create or replace function private.is_platform_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select private.admin_is_active() and exists (
    select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('admin', 'staff')
  );
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select private.admin_is_active() and exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.profiles p on p.id = ur.profile_id
    where p.user_id = (select auth.uid()) and r.key = 'super_admin'
  );
$$;

create or replace function private.has_permission(perm_key text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select private.admin_is_active() and (
    private.is_super_admin() or exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role_id = ur.role_id
      join public.permissions perm on perm.id = rp.permission_id
      join public.profiles p on p.id = ur.profile_id
      where p.user_id = (select auth.uid()) and perm.key = perm_key
    )
  );
$$;

revoke execute on function private.admin_is_active() from public, anon, authenticated;
revoke execute on function private.is_platform_admin() from public, anon, authenticated;
revoke execute on function private.is_super_admin() from public, anon, authenticated;
revoke execute on function private.has_permission(text) from public, anon, authenticated;
grant execute on function private.admin_is_active() to authenticated;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.is_super_admin() to authenticated;
grant execute on function private.has_permission(text) to authenticated;

-- Lets a signed-in admin stamp their own last_login_at without a generic
-- table-level UPDATE policy that could otherwise be abused to un-disable
-- their own account.
create or replace function public.record_admin_login()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.admin_profiles
  set last_login_at = now()
  where profile_id = (select id from public.profiles where user_id = (select auth.uid()));
end;
$$;

revoke execute on function public.record_admin_login() from public, anon;
grant execute on function public.record_admin_login() to authenticated;

-- Public RPC wrappers so the Admin Create Account edge function (running with the
-- CALLER's JWT, never the service role, for the permission check step) can verify
-- authorization without being able to query the private schema directly over PostgREST.
create or replace function public.current_admin_has_permission(perm_key text)
returns boolean
language sql
security invoker
stable
as $$
  select private.has_permission(perm_key);
$$;

create or replace function public.current_admin_is_super_admin()
returns boolean
language sql
security invoker
stable
as $$
  select private.is_super_admin();
$$;

revoke execute on function public.current_admin_has_permission(text) from public, anon;
revoke execute on function public.current_admin_is_super_admin() from public, anon;
grant execute on function public.current_admin_has_permission(text) to authenticated;
grant execute on function public.current_admin_is_super_admin() to authenticated;

-- =====================================================================
-- Redefine handle_new_user (originally created in manor-cares-users'
-- schema.sql) so that accounts created by the Admin Create Account edge
-- function (raw_user_meta_data.account_type = 'admin') get a profiles +
-- admin_profiles row instead of a customer_profiles row. Idempotent
-- create-or-replace — safe to re-run. If schema.sql is ever re-run
-- afterwards it will overwrite this; re-apply this file after schema.sql.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  new_profile_id bigint;
  account_type text := coalesce(meta ->> 'account_type', 'customer');
begin
  insert into public.profiles (
    user_id, first_name, last_name, email, phone, date_of_birth, gender, role
  ) values (
    new.id,
    coalesce(meta ->> 'first_name', ''),
    coalesce(meta ->> 'last_name', ''),
    new.email,
    meta ->> 'phone',
    nullif(meta ->> 'date_of_birth', '')::date,
    nullif(meta ->> 'gender', ''),
    case when account_type = 'admin' then coalesce(meta ->> 'admin_role', 'staff') else 'customer' end
  )
  returning id into new_profile_id;

  if account_type = 'admin' then
    insert into public.admin_profiles (profile_id, department, job_title, status, created_by)
    values (
      new_profile_id,
      nullif(meta ->> 'department', ''),
      nullif(meta ->> 'job_title', ''),
      'active',
      nullif(meta ->> 'created_by', '')::bigint
    );
    return new;
  end if;

  insert into public.customer_profiles (profile_id) values (new_profile_id);

  insert into public.notification_preferences (
    profile_id, email_notifications, sms_notifications, marketing_notifications
  ) values (
    new_profile_id,
    coalesce((meta ->> 'email_notifications')::boolean, true),
    coalesce((meta ->> 'sms_notifications')::boolean, false),
    coalesce((meta ->> 'marketing_notifications')::boolean, false)
  );

  if coalesce(meta ->> 'address_line', '') <> '' then
    insert into public.addresses (
      profile_id, address_type, address_line, city, state, country, postal_code, is_default
    ) values (
      new_profile_id, 'home',
      meta ->> 'address_line', meta ->> 'city', meta ->> 'state',
      coalesce(meta ->> 'country', ''), meta ->> 'postal_code', true
    );
  end if;

  return new;
end;
$$;

-- =====================================================================
-- Row Level Security — admin-only tables
-- =====================================================================
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.employees enable row level security;
alter table public.staff_attendance enable row level security;
alter table public.leave_requests enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.promotions enable row level security;
alter table public.customer_segments enable row level security;
alter table public.leads enable row level security;
alter table public.quotes enable row level security;
alter table public.technical_tickets enable row level security;
alter table public.cleaning_teams enable row level security;
alter table public.cleaning_team_members enable row level security;
alter table public.vehicles enable row level security;
alter table public.booking_assignments enable row level security;

-- roles / permissions / role_permissions: readable by any active admin, writable only by super admin
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles for select to authenticated using (private.is_platform_admin());
drop policy if exists roles_write on public.roles;
create policy roles_write on public.roles for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists permissions_select on public.permissions;
create policy permissions_select on public.permissions for select to authenticated using (private.is_platform_admin());
drop policy if exists permissions_write on public.permissions;
create policy permissions_write on public.permissions for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions for select to authenticated using (private.is_platform_admin());
drop policy if exists role_permissions_write on public.role_permissions;
create policy role_permissions_write on public.role_permissions for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

-- user_roles: an admin can see their own role assignment; super admin manages everyone's.
-- Only a super admin can ever INSERT/UPDATE/DELETE a row here, which structurally prevents
-- any staff member from self-promoting to super_admin (or any other role).
drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles for select to authenticated
  using (profile_id = private.current_profile_id() or private.is_platform_admin());
drop policy if exists user_roles_write on public.user_roles;
create policy user_roles_write on public.user_roles for all to authenticated
  using (private.is_super_admin()) with check (private.is_super_admin());

-- admin_profiles: self-read always allowed (so a disabled admin can still see their own status);
-- admins.manage required to read/manage everyone else. No delete — disable instead of deleting.
drop policy if exists admin_profiles_select on public.admin_profiles;
create policy admin_profiles_select on public.admin_profiles for select to authenticated
  using (profile_id = private.current_profile_id() or private.has_permission('admins.manage'));
drop policy if exists admin_profiles_insert on public.admin_profiles;
create policy admin_profiles_insert on public.admin_profiles for insert to authenticated
  with check (private.has_permission('admins.manage'));
drop policy if exists admin_profiles_update on public.admin_profiles;
create policy admin_profiles_update on public.admin_profiles for update to authenticated
  using (private.has_permission('admins.manage')) with check (private.has_permission('admins.manage'));

-- audit_logs: any active admin can read; inserts must be attributed to the caller; nobody can update/delete.
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated using (private.is_platform_admin());
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs for insert to authenticated
  with check (private.is_platform_admin() and admin_user_id = private.current_profile_id());

-- employees / attendance / leave: HR (staff.view / staff.manage)
drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees for select to authenticated using (private.has_permission('staff.view'));
drop policy if exists employees_write on public.employees;
create policy employees_write on public.employees for all to authenticated
  using (private.has_permission('staff.manage')) with check (private.has_permission('staff.manage'));

drop policy if exists staff_attendance_select on public.staff_attendance;
create policy staff_attendance_select on public.staff_attendance for select to authenticated using (private.has_permission('staff.view'));
drop policy if exists staff_attendance_write on public.staff_attendance;
create policy staff_attendance_write on public.staff_attendance for all to authenticated
  using (private.has_permission('staff.manage')) with check (private.has_permission('staff.manage'));

drop policy if exists leave_requests_select on public.leave_requests;
create policy leave_requests_select on public.leave_requests for select to authenticated using (private.has_permission('staff.view'));
drop policy if exists leave_requests_write on public.leave_requests;
create policy leave_requests_write on public.leave_requests for all to authenticated
  using (private.has_permission('staff.manage')) with check (private.has_permission('staff.manage'));

-- marketing: marketing.view / marketing.manage
drop policy if exists marketing_campaigns_select on public.marketing_campaigns;
create policy marketing_campaigns_select on public.marketing_campaigns for select to authenticated using (private.has_permission('marketing.view'));
drop policy if exists marketing_campaigns_write on public.marketing_campaigns;
create policy marketing_campaigns_write on public.marketing_campaigns for all to authenticated
  using (private.has_permission('marketing.manage')) with check (private.has_permission('marketing.manage'));

drop policy if exists promotions_select on public.promotions;
create policy promotions_select on public.promotions for select to authenticated using (private.has_permission('marketing.view'));
drop policy if exists promotions_write on public.promotions;
create policy promotions_write on public.promotions for all to authenticated
  using (private.has_permission('marketing.manage')) with check (private.has_permission('marketing.manage'));

drop policy if exists customer_segments_select on public.customer_segments;
create policy customer_segments_select on public.customer_segments for select to authenticated using (private.has_permission('marketing.view'));
drop policy if exists customer_segments_write on public.customer_segments;
create policy customer_segments_write on public.customer_segments for all to authenticated
  using (private.has_permission('marketing.manage')) with check (private.has_permission('marketing.manage'));

-- sales: sales.view / sales.manage
drop policy if exists leads_select on public.leads;
create policy leads_select on public.leads for select to authenticated using (private.has_permission('sales.view'));
drop policy if exists leads_write on public.leads;
create policy leads_write on public.leads for all to authenticated
  using (private.has_permission('sales.manage')) with check (private.has_permission('sales.manage'));

drop policy if exists quotes_select on public.quotes;
create policy quotes_select on public.quotes for select to authenticated using (private.has_permission('sales.view'));
drop policy if exists quotes_write on public.quotes;
create policy quotes_write on public.quotes for all to authenticated
  using (private.has_permission('sales.manage')) with check (private.has_permission('sales.manage'));

-- technical: technical.view / technical.manage
drop policy if exists technical_tickets_select on public.technical_tickets;
create policy technical_tickets_select on public.technical_tickets for select to authenticated using (private.has_permission('technical.view'));
drop policy if exists technical_tickets_write on public.technical_tickets;
create policy technical_tickets_write on public.technical_tickets for all to authenticated
  using (private.has_permission('technical.manage')) with check (private.has_permission('technical.manage'));

-- transportation: transportation.view / transportation.manage
drop policy if exists cleaning_teams_select on public.cleaning_teams;
create policy cleaning_teams_select on public.cleaning_teams for select to authenticated using (private.has_permission('transportation.view'));
drop policy if exists cleaning_teams_write on public.cleaning_teams;
create policy cleaning_teams_write on public.cleaning_teams for all to authenticated
  using (private.has_permission('transportation.manage')) with check (private.has_permission('transportation.manage'));

drop policy if exists cleaning_team_members_select on public.cleaning_team_members;
create policy cleaning_team_members_select on public.cleaning_team_members for select to authenticated using (private.has_permission('transportation.view'));
drop policy if exists cleaning_team_members_write on public.cleaning_team_members;
create policy cleaning_team_members_write on public.cleaning_team_members for all to authenticated
  using (private.has_permission('transportation.manage')) with check (private.has_permission('transportation.manage'));

drop policy if exists vehicles_select on public.vehicles;
create policy vehicles_select on public.vehicles for select to authenticated using (private.has_permission('transportation.view'));
drop policy if exists vehicles_write on public.vehicles;
create policy vehicles_write on public.vehicles for all to authenticated
  using (private.has_permission('transportation.manage')) with check (private.has_permission('transportation.manage'));

drop policy if exists booking_assignments_select on public.booking_assignments;
create policy booking_assignments_select on public.booking_assignments for select to authenticated
  using (private.has_permission('transportation.view') or private.has_permission('bookings.view'));
drop policy if exists booking_assignments_write on public.booking_assignments;
create policy booking_assignments_write on public.booking_assignments for all to authenticated
  using (private.has_permission('transportation.manage') or private.has_permission('bookings.manage'))
  with check (private.has_permission('transportation.manage') or private.has_permission('bookings.manage'));

-- =====================================================================
-- Tighten shared-table RLS (defined in manor-cares-users/supabase/schema.sql)
-- so admin access is scoped to granular permissions instead of a blanket
-- "is staff" check. Re-running schema.sql later will NOT undo this because
-- these are the same policy names — whichever script runs last wins, so
-- always apply this file after schema.sql (and re-apply it if schema.sql
-- is ever re-run afterwards).
-- =====================================================================
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id or private.has_permission('customers.view') or private.is_super_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id or private.has_permission('customers.manage') or private.is_super_admin())
  with check ((select auth.uid()) = user_id or private.has_permission('customers.manage') or private.is_super_admin());

drop policy if exists customer_profiles_select on public.customer_profiles;
create policy customer_profiles_select on public.customer_profiles for select to authenticated
  using (profile_id = private.current_profile_id() or private.has_permission('customers.view') or private.is_super_admin());

drop policy if exists customer_profiles_update on public.customer_profiles;
create policy customer_profiles_update on public.customer_profiles for update to authenticated
  using (profile_id = private.current_profile_id() or private.has_permission('customers.manage') or private.is_super_admin())
  with check (profile_id = private.current_profile_id() or private.has_permission('customers.manage') or private.is_super_admin());

drop policy if exists addresses_select on public.addresses;
create policy addresses_select on public.addresses for select to authenticated
  using (profile_id = private.current_profile_id() or private.has_permission('customers.view') or private.is_super_admin());

drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings for select to authenticated
  using (customer_id = private.current_customer_id() or private.has_permission('bookings.view') or private.is_super_admin());

drop policy if exists bookings_insert on public.bookings;
create policy bookings_insert on public.bookings for insert to authenticated
  with check (customer_id = private.current_customer_id() or private.has_permission('bookings.manage'));

drop policy if exists bookings_update on public.bookings;
create policy bookings_update on public.bookings for update to authenticated
  using (customer_id = private.current_customer_id() or private.has_permission('bookings.manage') or private.is_super_admin())
  with check (customer_id = private.current_customer_id() or private.has_permission('bookings.manage') or private.is_super_admin());

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select to authenticated
  using (
    customer_id = private.current_customer_id()
    or private.has_permission('finance.view')
    or private.has_permission('bookings.view')
    or private.is_super_admin()
  );

drop policy if exists payments_write on public.payments;
create policy payments_write on public.payments for all to authenticated
  using (private.has_permission('finance.manage') or private.is_super_admin())
  with check (private.has_permission('finance.manage') or private.is_super_admin());

drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select to authenticated
  using (
    customer_id = private.current_customer_id()
    or private.has_permission('finance.view')
    or private.is_super_admin()
  );

drop policy if exists invoices_write on public.invoices;
create policy invoices_write on public.invoices for all to authenticated
  using (private.has_permission('finance.manage') or private.is_super_admin())
  with check (private.has_permission('finance.manage') or private.is_super_admin());

drop policy if exists service_reviews_select on public.service_reviews;
create policy service_reviews_select on public.service_reviews for select to authenticated
  using (
    customer_id = private.current_customer_id()
    or private.has_permission('customers.view')
    or private.has_permission('support.view')
    or private.is_super_admin()
  );

drop policy if exists support_tickets_select on public.support_tickets;
create policy support_tickets_select on public.support_tickets for select to authenticated
  using (customer_id = private.current_customer_id() or private.has_permission('support.view') or private.is_super_admin());

drop policy if exists support_tickets_update on public.support_tickets;
create policy support_tickets_update on public.support_tickets for update to authenticated
  using (customer_id = private.current_customer_id() or private.has_permission('support.manage') or private.is_super_admin())
  with check (customer_id = private.current_customer_id() or private.has_permission('support.manage') or private.is_super_admin());

drop policy if exists support_ticket_messages_select on public.support_ticket_messages;
create policy support_ticket_messages_select on public.support_ticket_messages for select to authenticated
  using (
    private.has_permission('support.view') or private.is_super_admin() or exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.customer_id = private.current_customer_id()
    )
  );

drop policy if exists support_ticket_messages_insert on public.support_ticket_messages;
create policy support_ticket_messages_insert on public.support_ticket_messages for insert to authenticated
  with check (
    private.has_permission('support.manage') or private.is_super_admin() or exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.customer_id = private.current_customer_id()
    )
  );

drop policy if exists cleaning_services_write on public.cleaning_services;
create policy cleaning_services_write on public.cleaning_services for all to authenticated
  using (private.has_permission('sales.manage') or private.has_permission('marketing.manage') or private.is_super_admin())
  with check (private.has_permission('sales.manage') or private.has_permission('marketing.manage') or private.is_super_admin());

drop policy if exists notifications_write_admin on public.notifications;
create policy notifications_write_admin on public.notifications for insert to authenticated
  with check (private.has_permission('marketing.manage') or private.has_permission('support.manage') or private.is_super_admin());

-- =====================================================================
-- Seed: roles, permissions, role_permissions
-- =====================================================================
insert into public.roles (key, name, description) values
  ('super_admin', 'Super Admin', 'Full, unrestricted platform access.'),
  ('hr', 'HR', 'Manages staff, employees, recruitment, attendance and leave.'),
  ('customer_support', 'Customer Relations', 'Manages customers, support tickets, complaints and reviews.'),
  ('marketing', 'Marketing', 'Manages campaigns, promotions, segments and marketing analytics.'),
  ('sales', 'Sales', 'Manages leads, quotes, service packages and sales performance.'),
  ('finance', 'Finance', 'Manages payments, invoices, revenue and refunds.'),
  ('technical', 'Technical', 'Manages technical/system tickets, integrations and incidents.'),
  ('transportation', 'Transportation / Logistics', 'Manages cleaning teams, vehicles, routes and scheduling.')
on conflict (key) do nothing;

insert into public.permissions (key, description) values
  ('customers.view', 'View customer records'),
  ('customers.manage', 'Edit/suspend/activate customer records'),
  ('bookings.view', 'View bookings'),
  ('bookings.manage', 'Confirm/assign/reschedule/cancel/complete bookings'),
  ('finance.view', 'View payments, invoices and revenue'),
  ('finance.manage', 'Manage payments, invoices and refunds'),
  ('staff.view', 'View staff/employee records'),
  ('staff.manage', 'Manage staff, attendance and leave'),
  ('marketing.view', 'View marketing campaigns and analytics'),
  ('marketing.manage', 'Manage campaigns, promotions and segments'),
  ('sales.view', 'View leads, quotes and sales pipeline'),
  ('sales.manage', 'Manage leads, quotes and service packages'),
  ('support.view', 'View support tickets and complaints'),
  ('support.manage', 'Manage support tickets and customer communication'),
  ('technical.view', 'View technical/system tickets'),
  ('technical.manage', 'Manage technical tickets and integrations'),
  ('transportation.view', 'View cleaning teams, vehicles and routes'),
  ('transportation.manage', 'Manage teams, vehicles, routes and assignments'),
  ('admins.manage', 'Create/edit/disable administrator accounts'),
  ('reports.view', 'View reporting dashboards'),
  ('audit.view', 'View the administrative audit log')
on conflict (key) do nothing;

-- role -> permission mapping (super_admin intentionally omitted: is_super_admin() bypasses all checks)
do $$
declare
  r_hr bigint := (select id from public.roles where key = 'hr');
  r_support bigint := (select id from public.roles where key = 'customer_support');
  r_marketing bigint := (select id from public.roles where key = 'marketing');
  r_sales bigint := (select id from public.roles where key = 'sales');
  r_finance bigint := (select id from public.roles where key = 'finance');
  r_technical bigint := (select id from public.roles where key = 'technical');
  r_transport bigint := (select id from public.roles where key = 'transportation');
begin
  insert into public.role_permissions (role_id, permission_id)
  select r_hr, id from public.permissions where key in ('staff.view', 'staff.manage', 'reports.view')
  union all
  select r_support, id from public.permissions where key in
    ('customers.view', 'customers.manage', 'support.view', 'support.manage', 'bookings.view', 'reports.view')
  union all
  select r_marketing, id from public.permissions where key in
    ('marketing.view', 'marketing.manage', 'customers.view', 'reports.view')
  union all
  select r_sales, id from public.permissions where key in
    ('sales.view', 'sales.manage', 'customers.view', 'bookings.view', 'reports.view')
  union all
  select r_finance, id from public.permissions where key in
    ('finance.view', 'finance.manage', 'bookings.view', 'reports.view')
  union all
  select r_technical, id from public.permissions where key in ('technical.view', 'technical.manage', 'reports.view')
  union all
  select r_transport, id from public.permissions where key in
    ('transportation.view', 'transportation.manage', 'bookings.view', 'bookings.manage', 'reports.view')
  on conflict do nothing;
end $$;


do $$
declare
    target_profile_id bigint;
    super_admin_role_id bigint := (select id from public.roles where key = 'super_admin');
begin
    select id into target_profile_id from public.profiles where email = 'sunkanmhy@icloud.com';
    update public.profiles set role = 'admin' where id = target_profile_id;
    insert into public.admin_profiles (profile_id, department, job_title, status)
    values (target_profile_id, 'Executive', 'Super Admin', 'active')
    on conflict (profile_id) do nothing;
    insert into public.user_roles (profile_id, role_id) values (target_profile_id, super_admin_role_id)
    on conflict do nothing;
end $$;
