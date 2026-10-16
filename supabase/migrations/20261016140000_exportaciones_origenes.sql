-- Orígenes distintos para el filtro del embudo, y registro de exportaciones del panel.
-- Idempotente. Ejecutar después de 20261016130000_admin_crm.sql.
-- No guarda el CSV ni correos: solo quién exportó, qué lista y cuántas filas.

create or replace function public.admin_origenes()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;

  return coalesce((
    select jsonb_agg(src order by src)
    from (
      select distinct p.origen->>'utm_source' as src
      from perfil_estudio p
      where coalesce(p.origen->>'utm_source', '') <> ''
    ) s
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_origenes() from public, anon, authenticated;
grant execute on function public.admin_origenes() to service_role;

create table if not exists public.exportaciones_admin (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users (id) on delete set null,
  que text not null,
  meta jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

alter table public.exportaciones_admin enable row level security;
revoke all on public.exportaciones_admin from public, anon, authenticated;
