-- Tiempo de uso: un latido cada minuto, solo con la pestaña visible.
-- Una sesión se cierra tras 30 minutos sin latido. No guarda IP.
-- Idempotente. Ejecutar después de 20261016140000_exportaciones_origenes.sql.

create table if not exists public.sesiones (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  inicio timestamptz not null default now(),
  ultimo_latido timestamptz not null default now(),
  segundos int not null default 0
);

create index if not exists sesiones_usuario_inicio_idx on public.sesiones (usuario_id, inicio desc);

alter table public.sesiones enable row level security;
revoke all on public.sesiones from public, anon, authenticated;

create or replace function public.latido()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id bigint;
  v_ultimo timestamptz;
begin
  if v_uid is null then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select id, ultimo_latido
  into v_id, v_ultimo
  from sesiones
  where usuario_id = v_uid
  order by inicio desc
  limit 1
  for update;

  if v_id is null or v_ultimo < now() - interval '30 minutes' then
    insert into sesiones (usuario_id) values (v_uid);
    return;
  end if;

  update sesiones
  set
    ultimo_latido = now(),
    segundos = segundos + least(greatest(extract(epoch from (now() - v_ultimo))::int, 0), 90)
  where id = v_id;
end;
$$;

create or replace function public.admin_sesiones(p_uid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_total int;
  v_segundos int;
  v_recientes jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;

  select count(*)::int, coalesce(sum(segundos), 0)::int
  into v_total, v_segundos
  from sesiones
  where usuario_id = p_uid;

  select coalesce(jsonb_agg(jsonb_build_object(
    'inicio', inicio,
    'ultimo_latido', ultimo_latido,
    'segundos', segundos
  ) order by inicio desc), '[]'::jsonb)
  into v_recientes
  from (
    select inicio, ultimo_latido, segundos
    from sesiones
    where usuario_id = p_uid
    order by inicio desc
    limit 12
  ) s;

  return jsonb_build_object('total', v_total, 'segundos', v_segundos, 'recientes', v_recientes);
end;
$$;

revoke all on function public.latido() from public, anon;
grant execute on function public.latido() to authenticated;

revoke all on function public.admin_sesiones(uuid) from public, anon, authenticated;
grant execute on function public.admin_sesiones(uuid) to service_role;
