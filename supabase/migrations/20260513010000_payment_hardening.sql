create extension if not exists pgcrypto;

alter table public.orders
add column if not exists inventory_finalized_at timestamptz;

create unique index if not exists payment_attempts_provider_request_unique
on public.payment_attempts (provider, request_id)
where request_id is not null;

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  invoice_number text not null,
  provider text not null default 'doku',
  event_source text not null check (event_source in ('webhook', 'check_status', 'checkout')),
  provider_reference text,
  provider_request_id text,
  idempotency_key text not null unique,
  payment_status public.payment_status not null,
  amount_idr integer check (amount_idr is null or amount_idr >= 0),
  raw_payload jsonb not null default '{}'::jsonb,
  headers jsonb not null default '{}'::jsonb,
  processing_status text not null default 'received' check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  status text not null default 'reserved' check (status in ('reserved', 'finalized', 'released')),
  expires_at timestamptz not null,
  finalized_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_item_id)
);

create index if not exists inventory_reservations_variant_active_idx
on public.inventory_reservations (variant_id, status, expires_at);

create or replace function public.prevent_payment_event_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Payment events are append-only';
  end if;

  if old.id is distinct from new.id
    or old.order_id is distinct from new.order_id
    or old.invoice_number is distinct from new.invoice_number
    or old.provider is distinct from new.provider
    or old.event_source is distinct from new.event_source
    or old.provider_reference is distinct from new.provider_reference
    or old.provider_request_id is distinct from new.provider_request_id
    or old.idempotency_key is distinct from new.idempotency_key
    or old.payment_status is distinct from new.payment_status
    or old.amount_idr is distinct from new.amount_idr
    or old.raw_payload is distinct from new.raw_payload
    or old.headers is distinct from new.headers
    or old.created_at is distinct from new.created_at then
    raise exception 'Payment event payloads are immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_payment_event_mutation on public.payment_events;
create trigger prevent_payment_event_mutation
before update or delete on public.payment_events
for each row execute function public.prevent_payment_event_mutation();

create or replace function public.release_expired_inventory_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released_count integer;
begin
  update public.inventory_reservations
  set status = 'released', released_at = coalesce(released_at, now())
  where status = 'reserved'
    and expires_at <= now();

  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

create or replace function public.release_inventory_reservations_for_order(target_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released_count integer;
begin
  update public.inventory_reservations
  set status = 'released', released_at = coalesce(released_at, now())
  where order_id = target_order_id
    and status = 'reserved';

  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

create or replace function public.finalize_inventory_for_order(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  found_order public.orders%rowtype;
  reservation record;
  order_item record;
begin
  select *
  into found_order
  from public.orders
  where id = target_order_id
  for update;

  if not found then
    raise exception 'Order not found for inventory finalization %', target_order_id;
  end if;

  if found_order.inventory_finalized_at is not null then
    return;
  end if;

  if exists (
    select 1
    from public.inventory_reservations
    where order_id = target_order_id
      and status = 'reserved'
  ) then
    for reservation in
      select *
      from public.inventory_reservations
      where order_id = target_order_id
        and status = 'reserved'
      order by created_at
      for update
    loop
      update public.product_variants
      set stock_quantity = stock_quantity - reservation.quantity,
          updated_at = now()
      where id = reservation.variant_id
        and stock_quantity >= reservation.quantity;

      if not found then
        raise exception 'Insufficient stock while finalizing reservation %', reservation.id;
      end if;

      update public.inventory_reservations
      set status = 'finalized',
          finalized_at = coalesce(finalized_at, now())
      where id = reservation.id;
    end loop;
  else
    for order_item in
      select *
      from public.order_items
      where order_id = target_order_id
        and variant_id is not null
      order by id
      for update
    loop
      update public.product_variants
      set stock_quantity = stock_quantity - order_item.quantity,
          updated_at = now()
      where id = order_item.variant_id
        and stock_quantity >= order_item.quantity;

      if not found then
        raise exception 'Insufficient stock while finalizing order item %', order_item.id;
      end if;
    end loop;
  end if;

  update public.orders
  set inventory_finalized_at = now(),
      updated_at = now()
  where id = target_order_id;
end;
$$;

create or replace function public.create_pending_doku_order(
  requester_id uuid,
  target_invoice_number text,
  customer_name text,
  customer_email text default null,
  customer_phone text default null,
  line_items jsonb default '[]'::jsonb,
  total_amount_idr integer default 0,
  reservation_expires_at timestamptz default (now() + interval '60 minutes')
)
returns table(order_id uuid, invoice_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  new_order_id uuid;
  new_order_item_id uuid;
  item_product_id uuid;
  item_variant_id uuid;
  item_product_name text;
  item_sku text;
  item_quantity integer;
  item_unit_price integer;
  item_line_total integer;
  computed_total integer := 0;
  available_stock integer;
begin
  if requester_id is null then
    raise exception 'Requester is required';
  end if;

  if coalesce(trim(target_invoice_number), '') = '' then
    raise exception 'Invoice number is required';
  end if;

  if coalesce(trim(customer_name), '') = '' then
    raise exception 'Customer name is required';
  end if;

  if total_amount_idr < 0 then
    raise exception 'Total amount must be non-negative';
  end if;

  if jsonb_typeof(line_items) is distinct from 'array' then
    raise exception 'Line items must be a JSON array';
  end if;

  perform public.release_expired_inventory_reservations();

  insert into public.orders (
    user_id,
    invoice_number,
    customer_name,
    customer_email,
    customer_phone,
    total_amount_idr,
    status,
    payment_status
  )
  values (
    requester_id,
    target_invoice_number,
    trim(customer_name),
    nullif(trim(coalesce(customer_email, '')), ''),
    nullif(trim(coalesce(customer_phone, '')), ''),
    total_amount_idr,
    'pending_payment',
    'pending'
  )
  returning id into new_order_id;

  for item in select value from jsonb_array_elements(line_items)
  loop
    item_product_id := (item->>'product_id')::uuid;
    item_variant_id := nullif(item->>'variant_id', '')::uuid;
    item_product_name := nullif(trim(coalesce(item->>'product_name', '')), '');
    item_sku := nullif(trim(coalesce(item->>'sku', '')), '');
    item_quantity := (item->>'quantity')::integer;
    item_unit_price := (item->>'unit_price_idr')::integer;
    item_line_total := (item->>'line_total_idr')::integer;

    if item_product_id is null
      or item_product_name is null
      or item_sku is null
      or item_quantity is null
      or item_quantity < 1
      or item_unit_price is null
      or item_unit_price < 0
      or item_line_total is null
      or item_line_total <> item_unit_price * item_quantity then
      raise exception 'Invalid line item payload';
    end if;

    computed_total := computed_total + item_line_total;

    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      sku,
      quantity,
      unit_price_idr,
      line_total_idr
    )
    values (
      new_order_id,
      item_product_id,
      item_variant_id,
      item_product_name,
      item_sku,
      item_quantity,
      item_unit_price,
      item_line_total
    )
    returning id into new_order_item_id;

    if item_variant_id is not null then
      select pv.stock_quantity - coalesce((
        select sum(ir.quantity)::integer
        from public.inventory_reservations ir
        where ir.variant_id = item_variant_id
          and ir.status = 'reserved'
          and ir.expires_at > now()
      ), 0)
      into available_stock
      from public.product_variants pv
      where pv.id = item_variant_id
      for update;

      if available_stock is null then
        raise exception 'Variant is not available';
      end if;

      if available_stock < item_quantity then
        raise exception 'Insufficient stock for %', item_product_name;
      end if;

      insert into public.inventory_reservations (
        order_id,
        order_item_id,
        product_id,
        variant_id,
        quantity,
        expires_at
      )
      values (
        new_order_id,
        new_order_item_id,
        item_product_id,
        item_variant_id,
        item_quantity,
        reservation_expires_at
      );
    end if;
  end loop;

  if computed_total <> total_amount_idr then
    raise exception 'Order total mismatch';
  end if;

  order_id := new_order_id;
  invoice_number := target_invoice_number;
  return next;
end;
$$;

create or replace function public.process_doku_payment_event(
  target_invoice_number text,
  event_source text,
  event_status public.payment_status,
  raw_event jsonb default '{}'::jsonb,
  event_headers jsonb default '{}'::jsonb,
  provider_request_id text default null,
  provider_reference text default null,
  event_idempotency_key text default null,
  amount_idr integer default null
)
returns table(
  order_id uuid,
  pickup_code text,
  payment_event_id uuid,
  event_inserted boolean,
  payment_status public.payment_status,
  order_status public.order_status,
  processing_status text,
  error_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  found_order public.orders%rowtype;
  generated_code text;
  inserted_event_id uuid;
  normalized_idempotency_key text;
  final_processing_status text := 'processed';
  final_error_message text := null;
begin
  if coalesce(trim(target_invoice_number), '') = '' then
    raise exception 'Invoice number is required';
  end if;

  if event_source not in ('webhook', 'check_status', 'checkout') then
    raise exception 'Unsupported payment event source %', event_source;
  end if;

  select *
  into found_order
  from public.orders
  where invoice_number = target_invoice_number
  for update;

  if not found then
    raise exception 'Order not found for invoice %', target_invoice_number;
  end if;

  normalized_idempotency_key := coalesce(
    nullif(event_idempotency_key, ''),
    case
      when nullif(provider_request_id, '') is not null
        then 'doku:' || event_source || ':request:' || provider_request_id
      else null
    end,
    'doku:' || event_source || ':invoice:' || target_invoice_number || ':' ||
      event_status::text || ':' || encode(digest(coalesce(raw_event, '{}'::jsonb)::text, 'sha256'), 'hex')
  );

  insert into public.payment_events (
    order_id,
    invoice_number,
    provider,
    event_source,
    provider_reference,
    provider_request_id,
    idempotency_key,
    payment_status,
    amount_idr,
    raw_payload,
    headers
  )
  values (
    found_order.id,
    target_invoice_number,
    'doku',
    event_source,
    nullif(provider_reference, ''),
    nullif(provider_request_id, ''),
    normalized_idempotency_key,
    event_status,
    amount_idr,
    coalesce(raw_event, '{}'::jsonb),
    coalesce(event_headers, '{}'::jsonb)
  )
  on conflict (idempotency_key) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    select pe.id, pe.processing_status, pe.error_message
    into inserted_event_id, final_processing_status, final_error_message
    from public.payment_events pe
    where pe.idempotency_key = normalized_idempotency_key;

    select pc.code
    into pickup_code
    from public.pickup_codes pc
    where pc.order_id = found_order.id;

    order_id := found_order.id;
    payment_event_id := inserted_event_id;
    event_inserted := false;
    payment_status := found_order.payment_status;
    order_status := found_order.status;
    processing_status := coalesce(final_processing_status, 'ignored');
    error_message := final_error_message;
    return next;
    return;
  end if;

  begin
    if event_status = 'paid' then
      if found_order.payment_status <> 'paid' then
        perform public.finalize_inventory_for_order(found_order.id);

        update public.orders
        set
          status = 'pending_pickup',
          payment_status = 'paid',
          paid_at = coalesce(paid_at, now()),
          updated_at = now()
        where id = found_order.id
        returning * into found_order;

        update public.payment_attempts
        set
          status = 'paid',
          updated_at = now()
        where payment_attempts.order_id = found_order.id;
      else
        final_processing_status := 'ignored';
      end if;

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
    elsif event_status in ('expired', 'cancelled') then
      if found_order.payment_status <> 'paid' then
        perform public.release_inventory_reservations_for_order(found_order.id);

        update public.orders
        set
          status = event_status::text::public.order_status,
          payment_status = event_status,
          updated_at = now()
        where id = found_order.id
        returning * into found_order;

        update public.payment_attempts
        set
          status = event_status,
          updated_at = now()
        where payment_attempts.order_id = found_order.id;
      else
        final_processing_status := 'ignored';
      end if;
    elsif event_status = 'failed' then
      if found_order.payment_status <> 'paid' then
        perform public.release_inventory_reservations_for_order(found_order.id);

        update public.orders
        set
          payment_status = 'failed',
          updated_at = now()
        where id = found_order.id
        returning * into found_order;

        update public.payment_attempts
        set
          status = 'failed',
          updated_at = now()
        where payment_attempts.order_id = found_order.id;
      else
        final_processing_status := 'ignored';
      end if;
    else
      final_processing_status := 'ignored';
    end if;
  exception
    when others then
      final_processing_status := 'failed';
      final_error_message := sqlerrm;
  end;

  update public.payment_events
  set
    processing_status = final_processing_status,
    processed_at = now(),
    error_message = final_error_message
  where id = inserted_event_id;

  select pc.code
  into pickup_code
  from public.pickup_codes pc
  where pc.order_id = found_order.id;

  order_id := found_order.id;
  payment_event_id := inserted_event_id;
  event_inserted := true;
  payment_status := found_order.payment_status;
  order_status := found_order.status;
  processing_status := final_processing_status;
  error_message := final_error_message;
  return next;
end;
$$;

create or replace function public.activate_paid_order(target_invoice_number text, raw_notification jsonb default '{}'::jsonb)
returns table(order_id uuid, pickup_code text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select result.order_id, result.pickup_code
    from public.process_doku_payment_event(
      target_invoice_number := target_invoice_number,
      event_source := 'webhook',
      event_status := 'paid',
      raw_event := raw_notification,
      event_headers := '{}'::jsonb,
      provider_request_id := null,
      provider_reference := null,
      event_idempotency_key := null,
      amount_idr := null
    ) as result;
end;
$$;

alter table public.payment_events enable row level security;
alter table public.inventory_reservations enable row level security;

drop policy if exists "Admins read payment events" on public.payment_events;
create policy "Admins read payment events"
on public.payment_events
for select
using (public.is_admin());

drop policy if exists "Admins read inventory reservations" on public.inventory_reservations;
create policy "Admins read inventory reservations"
on public.inventory_reservations
for select
using (public.is_admin());

drop policy if exists "Users read own inventory reservations" on public.inventory_reservations;
create policy "Users read own inventory reservations"
on public.inventory_reservations
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);
