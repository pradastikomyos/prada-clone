-- Fix two bugs in process_doku_payment_event:
-- 1. digest() from pgcrypto lives in 'extensions' schema but function uses search_path = public
-- 2. "order_id" column reference is ambiguous between return table column and table columns
--
-- Applied remotely via:
--   fix_digest_schema_qualification
--   fix_digest_encode_schema
--   fix_ambiguous_order_id_in_payment_event

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
  final_pickup_code text := null;
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
  where public.orders.invoice_number = target_invoice_number
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
      event_status::text || ':' || encode(extensions.digest(coalesce(raw_event, '{}'::jsonb)::text::bytea, 'sha256'), 'hex')
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
  on conflict on constraint payment_events_idempotency_key_key do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    select pe.id, pe.processing_status, pe.error_message
    into inserted_event_id, final_processing_status, final_error_message
    from public.payment_events pe
    where pe.idempotency_key = normalized_idempotency_key;

    select pc.code
    into final_pickup_code
    from public.pickup_codes pc
    where pc.order_id = found_order.id;

    order_id := found_order.id;
    pickup_code := final_pickup_code;
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
          paid_at = coalesce(public.orders.paid_at, now()),
          updated_at = now()
        where public.orders.id = found_order.id
        returning * into found_order;

        update public.payment_attempts
        set
          status = 'paid',
          updated_at = now()
        where public.payment_attempts.order_id = found_order.id;
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
          on conflict on constraint pickup_codes_order_id_key do nothing;
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
        where public.orders.id = found_order.id
        returning * into found_order;

        update public.payment_attempts
        set
          status = event_status,
          updated_at = now()
        where public.payment_attempts.order_id = found_order.id;
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
        where public.orders.id = found_order.id
        returning * into found_order;

        update public.payment_attempts
        set
          status = 'failed',
          updated_at = now()
        where public.payment_attempts.order_id = found_order.id;
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
  where public.payment_events.id = inserted_event_id;

  select pc.code
  into final_pickup_code
  from public.pickup_codes pc
  where pc.order_id = found_order.id;

  order_id := found_order.id;
  pickup_code := final_pickup_code;
  payment_event_id := inserted_event_id;
  event_inserted := true;
  payment_status := found_order.payment_status;
  order_status := found_order.status;
  processing_status := final_processing_status;
  error_message := final_error_message;
  return next;
end;
$$;
