-- Correos de retención. Idempotente. Ejecutar después de 20261016160000_notas_purga.sql.
-- No guarda el cuerpo del correo, ni IP, ni datos de pago.
-- Un usuario borrado desaparece por on delete cascade y deja de recibir avisos.

create table if not exists public.preferencias_email (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  avisos boolean not null default true,
  actualizado_en timestamptz not null default now()
);

create table if not exists public.emails_enviados (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null,
  clave text not null default '',
  dia date not null,
  creado_en timestamptz not null default now(),
  unique (usuario_id, dia),
  unique (usuario_id, tipo, clave)
);

alter table public.emails_enviados drop constraint if exists emails_tipo_valido;
alter table public.emails_enviados add constraint emails_tipo_valido check (tipo in (
  'bienvenida',
  'racha',
  'reenganche_3',
  'reenganche_7',
  'sin_test',
  'tope',
  'resumen'
));

alter table public.preferencias_email enable row level security;
alter table public.emails_enviados enable row level security;
revoke all on public.preferencias_email from public, anon, authenticated;
revoke all on public.emails_enviados from public, anon, authenticated;

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
  'cancelacion',
  'email_enviado'
));

-- La casilla de la cuenta y el enlace de baja escriben lo mismo.
create or replace function public.guardar_perfil(
  p_objetivo int,
  p_fecha date,
  p_recordatorio boolean,
  p_completar boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  if p_objetivo is not null and p_objetivo not in (5, 10, 20, 30) then
    raise exception 'objetivo_invalido' using errcode = 'P0001';
  end if;
  perform public.asegurar_perfil();
  update perfil_estudio set
    objetivo_diario = coalesce(p_objetivo, objetivo_diario),
    fecha_examen = p_fecha,
    recordatorio_email = coalesce(p_recordatorio, recordatorio_email),
    onboarding_completado = onboarding_completado or coalesce(p_completar, false)
  where usuario_id = auth.uid();

  insert into preferencias_email (usuario_id, avisos)
  select usuario_id, recordatorio_email
  from perfil_estudio
  where usuario_id = auth.uid()
  on conflict (usuario_id) do update
  set avisos = excluded.avisos, actualizado_en = now();
end;
$$;

create or replace function public.emails_candidatos()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;

  with hoy as (
    select (now() at time zone 'Europe/Madrid')::date as d
  ),
  semana as (
    select to_char(d, 'IYYY') || '-W' || lpad(to_char(d, 'IW'), 2, '0') as clave from hoy
  ),
  premium as (
    select s.usuario_id
    from suscripciones s
    where s.estado in ('active', 'trialing')
      and (s.fin_periodo is null or s.fin_periodo > now())
  ),
  baja as (
    select usuario_id from preferencias_email where not avisos
    union
    select usuario_id from perfil_estudio where not recordatorio_email
  ),
  ya as (
    select e.usuario_id
    from emails_enviados e
    cross join hoy
    where e.dia = hoy.d
  ),
  base as (
    select
      u.id,
      u.email::text as email,
      u.created_at,
      coalesce(p.racha_actual, 0) as racha,
      p.ultimo_dia_activo,
      exists (select 1 from premium pr where pr.usuario_id = u.id) as premium
    from auth.users u
    left join perfil_estudio p on p.usuario_id = u.id
    where u.deleted_at is null
      and coalesce(u.email, '') <> ''
      and not exists (select 1 from baja b where b.usuario_id = u.id)
      and not exists (select 1 from ya y where y.usuario_id = u.id)
  ),
  stats as (
    select i.usuario_id,
      count(*)::int as tests,
      coalesce(sum(i.aciertos), 0)::int as aciertos
    from intentos i
    where i.terminado_en is not null
      and not i.es_importado
      and i.terminado_en >= now() - interval '7 days'
    group by i.usuario_id
  ),
  tema_flojo as (
    select usuario_id, tema
    from (
      select r.usuario_id,
        t.numero::text || '. ' || t.titulo as tema,
        row_number() over (partition by r.usuario_id order by count(*) desc, t.numero) as n
      from respuestas r
      join intentos i on i.id = r.intento_id and not i.es_importado
      join perfil_estudio p on p.usuario_id = r.usuario_id
      join oposiciones o on o.slug = coalesce(p.oposicion, 'aux-age')
      join preguntas_oposiciones po on po.pregunta_id = r.pregunta_id and po.oposicion_id = o.id
      join temas t on t.id = po.tema_id
      where not r.acertada
        and r.respondida_en >= now() - interval '7 days'
      group by r.usuario_id, t.id, t.numero, t.titulo
    ) q
    where n = 1
  )
  select coalesce(jsonb_agg(x.fila), '[]'::jsonb) into v
  from (
    select jsonb_build_object(
      'usuario_id', b.id, 'email', b.email, 'tipo', 'bienvenida', 'clave', '',
      'racha', b.racha, 'premium', b.premium, 'tests', null, 'aciertos', null, 'tema', null
    ) as fila
    from base b
    where b.created_at >= now() - interval '48 hours'
      and not exists (
        select 1 from emails_enviados e where e.usuario_id = b.id and e.tipo = 'bienvenida'
      )
    union all
    select jsonb_build_object(
      'usuario_id', b.id, 'email', b.email, 'tipo', 'sin_test', 'clave', '',
      'racha', b.racha, 'premium', b.premium, 'tests', null, 'aciertos', null, 'tema', null
    )
    from base b
    cross join hoy
    where (b.created_at at time zone 'Europe/Madrid')::date between hoy.d - 3 and hoy.d - 1
      and not exists (
        select 1 from intentos i where i.usuario_id = b.id and not i.es_importado
      )
      and not exists (
        select 1 from emails_enviados e where e.usuario_id = b.id and e.tipo = 'sin_test'
      )
    union all
    select jsonb_build_object(
      'usuario_id', b.id, 'email', b.email, 'tipo', 'tope', 'clave', '',
      'racha', b.racha, 'premium', false, 'tests', null, 'aciertos', null, 'tema', null
    )
    from base b
    where not b.premium
      and exists (
        select 1 from eventos e where e.usuario_id = b.id and e.tipo = 'limite_gratis'
      )
      and not exists (
        select 1 from emails_enviados e where e.usuario_id = b.id and e.tipo = 'tope'
      )
    union all
    select jsonb_build_object(
      'usuario_id', b.id, 'email', b.email, 'tipo', 'racha', 'clave', hoy.d::text,
      'racha', b.racha, 'premium', b.premium, 'tests', null, 'aciertos', null, 'tema', null
    )
    from base b
    cross join hoy
    where b.racha >= 1
      and (b.ultimo_dia_activo is null or b.ultimo_dia_activo < hoy.d)
      and not exists (
        select 1 from emails_enviados e
        where e.usuario_id = b.id and e.tipo = 'racha' and e.clave = hoy.d::text
      )
    union all
    select jsonb_build_object(
      'usuario_id', b.id, 'email', b.email, 'tipo', 'reenganche_3', 'clave', b.ultimo_dia_activo::text,
      'racha', b.racha, 'premium', b.premium, 'tests', null, 'aciertos', null, 'tema', null
    )
    from base b
    cross join hoy
    where b.ultimo_dia_activo = hoy.d - 3
      and not exists (
        select 1 from emails_enviados e
        where e.usuario_id = b.id and e.tipo = 'reenganche_3' and e.clave = b.ultimo_dia_activo::text
      )
    union all
    select jsonb_build_object(
      'usuario_id', b.id, 'email', b.email, 'tipo', 'reenganche_7', 'clave', b.ultimo_dia_activo::text,
      'racha', b.racha, 'premium', b.premium, 'tests', null, 'aciertos', null, 'tema', null
    )
    from base b
    cross join hoy
    where b.ultimo_dia_activo = hoy.d - 7
      and not exists (
        select 1 from emails_enviados e
        where e.usuario_id = b.id and e.tipo = 'reenganche_7' and e.clave = b.ultimo_dia_activo::text
      )
    union all
    select jsonb_build_object(
      'usuario_id', b.id, 'email', b.email, 'tipo', 'resumen', 'clave', (select clave from semana),
      'racha', b.racha, 'premium', b.premium,
      'tests', s.tests, 'aciertos', s.aciertos, 'tema', t.tema
    )
    from base b
    join stats s on s.usuario_id = b.id
    left join tema_flojo t on t.usuario_id = b.id
    where s.tests > 0
      and not exists (
        select 1 from emails_enviados e
        where e.usuario_id = b.id and e.tipo = 'resumen' and e.clave = (select clave from semana)
      )
  ) x;

  return v;
end;
$$;

revoke all on function public.emails_candidatos() from public, anon, authenticated;
grant execute on function public.emails_candidatos() to service_role;
