-- CRM: hechos del estudio (sin IP, sin respuestas y sin datos de pago).
-- Escritura solo por service role o por funciones security definer.
-- Idempotente: se puede pegar entero en el editor SQL de Supabase.

create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  usuario_id uuid references auth.users (id) on delete cascade,
  anon_id text,
  tipo text not null,
  meta jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  constraint eventos_quien check (usuario_id is not null or anon_id is not null)
);

alter table public.eventos drop constraint if exists eventos_tipo_valido;
alter table public.eventos add constraint eventos_tipo_valido check (tipo in (
  'registro',
  'onboarding_fin',
  'test_inicio',
  'test_fin',
  'limite_gratis',
  'vista_precios',
  'checkout_inicio',
  'pago_ok',
  'pago_fallido',
  'cancelacion'
));

create index if not exists eventos_usuario_creado_idx on public.eventos (usuario_id, creado_en desc);
create index if not exists eventos_tipo_creado_idx on public.eventos (tipo, creado_en);

alter table public.eventos enable row level security;

revoke all on public.eventos from public, anon, authenticated;

alter table public.perfil_estudio
  add column if not exists ultimo_acceso timestamptz,
  add column if not exists origen jsonb;

-- Tipos que puede anotar la propia persona. Pagos y cancelaciones solo los escribe el servidor.
create or replace function public.registrar_evento(
  p_tipo text,
  p_meta jsonb default '{}'::jsonb,
  p_usuario uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_meta jsonb := '{}'::jsonb;
  v_clave text;
  v_valor text;
  v_servicio boolean := auth.role() = 'service_role';
  v_propios text[] := array[
    'registro', 'onboarding_fin', 'test_inicio', 'test_fin',
    'limite_gratis', 'vista_precios', 'checkout_inicio'
  ];
  v_todos text[] := v_propios || array['pago_ok', 'pago_fallido', 'cancelacion'];
begin
  if p_tipo is null or not (p_tipo = any (v_todos)) then
    raise exception 'tipo_invalido' using errcode = 'P0001';
  end if;
  if v_servicio then
    v_uid := p_usuario;
  else
    if auth.uid() is null or not (p_tipo = any (v_propios)) then
      raise exception 'no_permitido' using errcode = 'P0001';
    end if;
    v_uid := auth.uid();
  end if;
  if v_uid is null then
    return;
  end if;

  if p_tipo = 'registro' and exists (
    select 1 from public.eventos where usuario_id = v_uid and tipo = 'registro'
  ) then
    return;
  end if;
  if p_tipo = 'onboarding_fin' and exists (
    select 1 from public.eventos where usuario_id = v_uid and tipo = 'onboarding_fin'
  ) then
    return;
  end if;

  if jsonb_typeof(p_meta) = 'object' then
    for v_clave, v_valor in
      select key, value #>> '{}'
      from jsonb_each(p_meta)
    loop
      if v_clave in ('modo', 'intento', 'motivo', 'plan', 'metodo')
         and v_valor is not null
         and length(v_valor) between 1 and 80
         and v_valor !~ '[\n\r]' then
        v_meta := v_meta || jsonb_build_object(v_clave, v_valor);
      end if;
    end loop;
  end if;

  insert into public.eventos (usuario_id, tipo, meta)
  values (v_uid, p_tipo, v_meta);
end;
$$;

create or replace function public.guardar_origen(p_origen jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v jsonb := '{}'::jsonb;
  v_clave text;
  v_valor text;
begin
  if v_uid is null then
    return;
  end if;
  perform public.asegurar_perfil();
  if jsonb_typeof(p_origen) = 'object' then
    for v_clave, v_valor in
      select key, left(value #>> '{}', 300)
      from jsonb_each(p_origen)
    loop
      if v_clave in ('utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'referrer', 'landing')
         and v_valor is not null
         and length(btrim(v_valor)) > 0 then
        v := v || jsonb_build_object(v_clave, btrim(v_valor));
      end if;
    end loop;
  end if;
  if v = '{}'::jsonb then
    return;
  end if;
  update public.perfil_estudio
  set origen = v
  where usuario_id = v_uid
    and (origen is null or origen = '{}'::jsonb);
end;
$$;

-- Como mucho una escritura cada 10 minutos.
create or replace function public.tocar_acceso()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  perform public.asegurar_perfil();
  update public.perfil_estudio
  set ultimo_acceso = now()
  where usuario_id = auth.uid()
    and (ultimo_acceso is null or ultimo_acceso < now() - interval '10 minutes');
end;
$$;

revoke all on function public.registrar_evento(text, jsonb, uuid) from public, anon;
revoke all on function public.guardar_origen(jsonb) from public, anon;
revoke all on function public.tocar_acceso() from public, anon;
grant execute on function public.registrar_evento(text, jsonb, uuid) to authenticated, service_role;
grant execute on function public.guardar_origen(jsonb) to authenticated;
grant execute on function public.tocar_acceso() to authenticated;
