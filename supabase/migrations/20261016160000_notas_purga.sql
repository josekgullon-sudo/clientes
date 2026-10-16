-- Notas internas del panel y purga del registro de acciones a los 24 meses.
-- Idempotente. Ejecutar después de 20261016150000_sesiones.sql.
-- Las notas se borran con la cuenta (on delete cascade). No guardan pagos ni respuestas.

create table if not exists public.notas_admin (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  admin_id uuid references auth.users (id) on delete set null,
  texto text not null check (char_length(btrim(texto)) between 1 and 2000),
  creado_en timestamptz not null default now()
);

create index if not exists notas_admin_usuario_idx on public.notas_admin (usuario_id, creado_en desc);

alter table public.notas_admin enable row level security;
revoke all on public.notas_admin from public, anon, authenticated;

-- Borra hechos y sesiones de más de 24 meses. Lo llama el cron o el SQL editor.
create or replace function public.purgar_eventos_antiguos()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;

  delete from eventos
  where creado_en < now() - interval '24 months';
  get diagnostics v_n = row_count;

  delete from sesiones
  where inicio < now() - interval '24 months';

  return v_n;
end;
$$;

revoke all on function public.purgar_eventos_antiguos() from public, anon, authenticated;
grant execute on function public.purgar_eventos_antiguos() to service_role;
