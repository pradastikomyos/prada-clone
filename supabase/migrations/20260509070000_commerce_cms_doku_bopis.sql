create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('customer', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.product_status as enum ('draft', 'active', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum ('pending_payment', 'paid', 'pending_pickup', 'picked_up', 'cancelled', 'expired');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum ('pending', 'paid', 'failed', 'expired', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text not null unique,
  description text,
  category text not null default 'CLOTHING',
  status public.product_status not null default 'draft',
  base_price_idr integer not null check (base_price_idr >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text not null unique,
  price_idr integer not null check (price_idr >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text,
  image_url text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'checked_out', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_idr integer not null check (unit_price_idr >= 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  invoice_number text not null unique,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  status public.order_status not null default 'pending_payment',
  payment_status public.payment_status not null default 'pending',
  total_amount_idr integer not null check (total_amount_idr >= 0),
  doku_payment_url text,
  doku_session_id text,
  paid_at timestamptz,
  picked_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  sku text not null,
  quantity integer not null check (quantity > 0),
  unit_price_idr integer not null check (unit_price_idr >= 0),
  line_total_idr integer not null check (line_total_idr >= 0)
);

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'doku',
  provider_reference text,
  request_id text,
  status public.payment_status not null default 'pending',
  amount_idr integer not null check (amount_idr >= 0),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pickup_codes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  code text not null unique,
  qr_payload text not null,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.generate_pickup_code()
returns text
language sql
volatile
as $$
  select 'PRX-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 3)) ||
    '-' ||
    lpad((floor(random() * 1000))::int::text, 3, '0');
$$;

create or replace function public.activate_paid_order(target_invoice_number text, raw_notification jsonb default '{}'::jsonb)
returns table(order_id uuid, pickup_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  found_order public.orders%rowtype;
  generated_code text;
begin
  select *
  into found_order
  from public.orders
  where invoice_number = target_invoice_number
  for update;

  if not found then
    raise exception 'Order not found for invoice %', target_invoice_number;
  end if;

  update public.orders
  set
    status = 'pending_pickup',
    payment_status = 'paid',
    paid_at = coalesce(paid_at, now()),
    updated_at = now()
  where id = found_order.id;

  update public.payment_attempts
  set
    status = 'paid',
    raw_payload = case
      when raw_notification = '{}'::jsonb then raw_payload
      else raw_notification
    end,
    updated_at = now()
  where order_id = found_order.id;

  loop
    generated_code := public.generate_pickup_code();
    begin
      insert into public.pickup_codes (order_id, code, qr_payload)
      values (
        found_order.id,
        generated_code,
        jsonb_build_object('type', 'sparkstage.pickup', 'order_id', found_order.id, 'code', generated_code)::text
      )
      on conflict (order_id) do nothing;
      exit;
    exception
      when unique_violation then
        null;
    end;
  end loop;

  select code
  into pickup_code
  from public.pickup_codes
  where pickup_codes.order_id = found_order.id;

  order_id := found_order.id;
  return next;
end;
$$;

create or replace function public.verify_pickup_code(input_code text)
returns table(order_id uuid, invoice_number text, status public.order_status, verified_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  found_order_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin role required';
  end if;

  select pc.order_id
  into found_order_id
  from public.pickup_codes pc
  join public.orders o on o.id = pc.order_id
  where pc.code = upper(trim(input_code))
    and pc.verified_at is null
    and o.status = 'pending_pickup'
  for update;

  if found_order_id is null then
    raise exception 'Pickup code is invalid or already used';
  end if;

  update public.pickup_codes
  set verified_at = now(), verified_by = auth.uid()
  where pickup_codes.order_id = found_order_id;

  update public.orders
  set status = 'picked_up', picked_up_at = now(), updated_at = now()
  where id = found_order_id;

  return query
    select o.id, o.invoice_number, o.status, pc.code
    from public.orders o
    join public.pickup_codes pc on pc.order_id = o.id
    where o.id = found_order_id;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists set_carts_updated_at on public.carts;
create trigger set_carts_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_attempts_updated_at on public.payment_attempts;
create trigger set_payment_attempts_updated_at
before update on public.payment_attempts
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.pickup_codes enable row level security;

drop policy if exists "Profiles are readable by owner or admin" on public.profiles;
create policy "Profiles are readable by owner or admin"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
using (status = 'active' or public.is_admin());

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
on public.products
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active variants" on public.product_variants;
create policy "Public can read active variants"
on public.product_variants
for select
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and (p.status = 'active' or public.is_admin())
  )
);

drop policy if exists "Admins manage variants" on public.product_variants;
create policy "Admins manage variants"
on public.product_variants
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active product images" on public.product_images;
create policy "Public can read active product images"
on public.product_images
for select
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and (p.status = 'active' or public.is_admin())
  )
);

drop policy if exists "Admins manage product images" on public.product_images;
create policy "Admins manage product images"
on public.product_images
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users manage own carts" on public.carts;
create policy "Users manage own carts"
on public.carts
for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users manage own cart items" on public.cart_items;
create policy "Users manage own cart items"
on public.cart_items
for all
using (
  exists (
    select 1 from public.carts c
    where c.id = cart_id
      and (c.user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.carts c
    where c.id = cart_id
      and (c.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Users read own orders or admin" on public.orders;
create policy "Users read own orders or admin"
on public.orders
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders"
on public.orders
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users read own order items or admin" on public.order_items;
create policy "Users read own order items or admin"
on public.order_items
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items"
on public.order_items
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins read payment attempts" on public.payment_attempts;
create policy "Admins read payment attempts"
on public.payment_attempts
for select
using (public.is_admin());

drop policy if exists "Admins read pickup codes" on public.pickup_codes;
create policy "Admins read pickup codes"
on public.pickup_codes
for select
using (public.is_admin());

drop policy if exists "Users read own pickup codes" on public.pickup_codes;
create policy "Users read own pickup codes"
on public.pickup_codes
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);
