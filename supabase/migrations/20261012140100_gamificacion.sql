-- Camino de temas, XP, repetición espaciada, logros y protectores de racha.
-- La XP y el SM-2 coinciden con src/lib/estudio/repaso.ts.

alter table intentos
  add column if not exists tema_nivel smallint,
  add column if not exists xp int,
  add column if not exists meta jsonb;

alter table perfil_estudio
  add column if not exists protectores_semana date,
  add column if not exists racha_anterior int not null default 0,
  add column if not exists reparable_hasta timestamptz,
  add column if not exists lecciones_reparacion int not null default 0;

create table repaso_pregunta (
  usuario_id uuid references auth.users (id) on delete cascade,
  pregunta_id text references preguntas (id) on delete cascade,
  intervalo_dias int not null default 0,
  facilidad numeric(3, 2) not null default 2.5,
  repeticiones int not null default 0,
  proxima_revision date not null,
  ultima_respuesta_correcta boolean,
  actualizado_en timestamptz not null default now(),
  primary key (usuario_id, pregunta_id)
);
create index repaso_pregunta_proxima on repaso_pregunta (usuario_id, proxima_revision);

create table nivel_tema (
  usuario_id uuid references auth.users (id) on delete cascade,
  tema_id uuid references temas (id) on delete cascade,
  nivel smallint not null default 0,
  lecciones_nivel smallint not null default 0,
  corona text check (corona in ('plata', 'oro')),
  actualizado_en timestamptz not null default now(),
  primary key (usuario_id, tema_id)
);

create table logros (
  catalogo_id text primary key,
  nombre text not null,
  descripcion text not null,
  icono text not null,
  orden int not null
);

create table logros_usuario (
  usuario_id uuid references auth.users (id) on delete cascade,
  logro_id text references logros (catalogo_id),
  conseguido_en timestamptz not null default now(),
  primary key (usuario_id, logro_id)
);

create table eventos_xp (
  id bigint generated always as identity primary key,
  usuario_id uuid references auth.users (id) on delete cascade,
  intento_id uuid references intentos (id) on delete set null,
  motivo text not null,
  xp int not null,
  creado_en timestamptz not null default now()
);

create table notificaciones_enviadas (
  id bigint generated always as identity primary key,
  usuario_id uuid references auth.users (id) on delete cascade,
  tipo text not null,
  canal text not null check (canal in ('email', 'push')),
  enviada_en timestamptz not null default now()
);

create table suscripciones_push (
  usuario_id uuid references auth.users (id) on delete cascade,
  endpoint text primary key,
  p256dh text,
  auth text
);

create table reportes_pregunta (
  id bigint generated always as identity primary key,
  usuario_id uuid references auth.users (id) on delete set null,
  pregunta_id text references preguntas (id),
  motivo text,
  creado_en timestamptz not null default now()
);

alter table repaso_pregunta enable row level security;
alter table nivel_tema enable row level security;
alter table logros enable row level security;
alter table logros_usuario enable row level security;
alter table eventos_xp enable row level security;
alter table notificaciones_enviadas enable row level security;
alter table suscripciones_push enable row level security;
alter table reportes_pregunta enable row level security;

create policy "ver el mío" on repaso_pregunta for select using (usuario_id = auth.uid());
create policy "ver el mío" on nivel_tema for select using (usuario_id = auth.uid());
create policy "catálogo público" on logros for select using (true);
create policy "ver los míos" on logros_usuario for select using (usuario_id = auth.uid());
create policy "ver los míos" on eventos_xp for select using (usuario_id = auth.uid());
create policy "ver las mías" on notificaciones_enviadas for select using (usuario_id = auth.uid());
create policy "ver las mías" on suscripciones_push for select using (usuario_id = auth.uid());
create policy "ver los míos" on reportes_pregunta for select using (usuario_id = auth.uid());

revoke all on repaso_pregunta, nivel_tema, logros, logros_usuario, eventos_xp, notificaciones_enviadas, suscripciones_push, reportes_pregunta from anon, authenticated;
grant select on repaso_pregunta, nivel_tema, logros_usuario, eventos_xp, notificaciones_enviadas, suscripciones_push, reportes_pregunta to authenticated;
grant select on logros to anon, authenticated;

insert into logros (catalogo_id, nombre, descripcion, icono, orden) values
  ('primera-leccion', 'Primera lección', 'Has terminado tu primera sesión del camino.', 'meta', 10),
  ('primer-nivel', 'Primer nivel', 'Has superado una lección de un tema.', 'meta', 20),
  ('primera-corona', 'Primera corona', 'Has cerrado el examen de un tema.', 'corona', 30),
  ('racha-7', 'Una semana', 'Siete días de racha.', 'racha', 40),
  ('racha-30', 'Un mes', 'Treinta días de racha.', 'racha', 50),
  ('racha-100', 'Cien días', 'Cien días de racha.', 'racha', 60),
  ('objetivo-10', 'Constancia', 'Diez días seguidos cumpliendo el objetivo.', 'racha', 70),
  ('seguidas-10', 'Diez seguidas', 'Diez aciertos seguidos en un mismo test.', 'punteria', 80),
  ('perfecta-5', 'Cinco perfectas', 'Cinco lecciones sin un fallo.', 'punteria', 90),
  ('simulacro-7', 'Simulacro sólido', 'Un simulacro con 7 sobre 10 o más.', 'punteria', 100),
  ('volumen-500', '500 respuestas', 'Has respondido 500 preguntas.', 'volumen', 110),
  ('volumen-1000', '1.000 respuestas', 'Has respondido 1.000 preguntas.', 'volumen', 120),
  ('volumen-5000', '5.000 respuestas', 'Has respondido 5.000 preguntas.', 'volumen', 130),
  ('coronas-bloque-i', 'Bloque I', 'Corona en todos los temas del bloque I que ya tienen preguntas.', 'corona', 140),
  ('coronas-todas', 'Temario con corona', 'Corona en todos los temas que ya tienen preguntas.', 'corona', 150),
  ('madrugador', 'Madrugador', 'Una sesión antes de las 8, hora de Madrid.', 'reloj', 160),
  ('nocturno', 'Nocturno', 'Una sesión a partir de las 23, hora de Madrid.', 'reloj', 170)
on conflict (catalogo_id) do nothing;

create or replace function public._aplicar_repaso(p_uid uuid, p_pregunta text, p_acierto boolean, p_hoy date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intervalo int := 0;
  v_facilidad numeric := 2.5;
  v_rep int := 0;
  v_base int;
begin
  select intervalo_dias, facilidad, repeticiones
  into v_intervalo, v_facilidad, v_rep
  from repaso_pregunta
  where usuario_id = p_uid and pregunta_id = p_pregunta;

  if not p_acierto then
    v_facilidad := greatest(1.3, round(coalesce(v_facilidad, 2.5) - 0.2, 2));
    v_rep := 0;
    v_intervalo := 1;
  else
    v_base := (array[1, 3, 7, 16, 35])[least(coalesce(v_rep, 0), 4) + 1];
    v_intervalo := greatest(1, round(v_base * (coalesce(v_facilidad, 2.5) / 2.5))::int);
    v_facilidad := least(3, round(coalesce(v_facilidad, 2.5) + 0.1, 2));
    v_rep := coalesce(v_rep, 0) + 1;
  end if;

  insert into repaso_pregunta (
    usuario_id, pregunta_id, intervalo_dias, facilidad, repeticiones,
    proxima_revision, ultima_respuesta_correcta, actualizado_en
  ) values (
    p_uid, p_pregunta, v_intervalo, v_facilidad, v_rep,
    p_hoy + v_intervalo, p_acierto, now()
  )
  on conflict (usuario_id, pregunta_id) do update set
    intervalo_dias = excluded.intervalo_dias,
    facilidad = excluded.facilidad,
    repeticiones = excluded.repeticiones,
    proxima_revision = excluded.proxima_revision,
    ultima_respuesta_correcta = excluded.ultima_respuesta_correcta,
    actualizado_en = now();
end;
$$;

create or replace function public._conceder_logro(p_uid uuid, p_logro text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_filas int := 0;
begin
  insert into logros_usuario (usuario_id, logro_id)
  values (p_uid, p_logro)
  on conflict do nothing;
  get diagnostics v_filas = row_count;
  return v_filas > 0;
end;
$$;

create or replace function public.asegurar_perfil()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_racha int := 0;
  v_fin date;
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
  v_lunes date := date_trunc('week', v_hoy)::date;
  v_premium boolean;
  v_protectores int;
  v_semana date;
  v_racha_actual int;
begin
  if v_uid is null then
    return;
  end if;

  if not exists (select 1 from perfil_estudio where usuario_id = v_uid) then
    with dias as (
      select distinct (terminado_en at time zone 'Europe/Madrid')::date as dia
      from intentos
      where usuario_id = v_uid and terminado_en is not null and not es_importado
    ),
    hoy as (select v_hoy as d),
    grupos as (
      select dia, dia - (row_number() over (order by dia))::int as grupo from dias
    ),
    ultimo as (
      select max(dia) as fin, count(*)::int as largo
      from grupos group by grupo
      order by max(dia) desc
      limit 1
    )
    select coalesce(u.largo, 0), u.fin into v_racha, v_fin
    from hoy
    left join ultimo u on u.fin >= hoy.d - 1;

    insert into perfil_estudio (usuario_id, racha_actual, racha_maxima, ultimo_dia_activo, protectores_semana)
    values (v_uid, coalesce(v_racha, 0), coalesce(v_racha, 0), v_fin, v_lunes)
    on conflict (usuario_id) do nothing;
  end if;

  select protectores, protectores_semana, racha_actual
  into v_protectores, v_semana, v_racha_actual
  from perfil_estudio where usuario_id = v_uid;

  if v_semana is null or v_semana < v_lunes then
    v_premium := public.tiene_suscripcion_activa();
    if v_premium then
      v_protectores := least(5, coalesce(v_protectores, 0) + 2 + least(3, coalesce(v_racha_actual, 0) / 7));
    else
      v_protectores := 1;
    end if;
    update perfil_estudio set
      protectores = v_protectores,
      protectores_semana = v_lunes
    where usuario_id = v_uid;
  end if;
end;
$$;

create or replace function public.cuota_restante()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_premium boolean;
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
  v_tema int;
  v_repaso int;
  v_simulacros int;
begin
  if v_uid is null then
    return jsonb_build_object('premium', false, 'tema', 0, 'repaso', 0, 'simulacro', false);
  end if;
  v_premium := public.tiene_suscripcion_activa();
  if v_premium then
    return jsonb_build_object('premium', true, 'tema', 10, 'repaso', 10, 'simulacro', true, 'ilimitado', true);
  end if;

  select count(*) into v_tema from intentos
  where usuario_id = v_uid and not es_importado and modo in ('tema', 'leccion')
    and (creado_en at time zone 'Europe/Madrid')::date = v_hoy;
  select count(*) into v_repaso from intentos
  where usuario_id = v_uid and not es_importado and modo in ('falladas', 'repaso')
    and (creado_en at time zone 'Europe/Madrid')::date = v_hoy;
  select count(*) into v_simulacros from intentos
  where usuario_id = v_uid and not es_importado and modo = 'simulacro';

  return jsonb_build_object(
    'premium', false,
    'tema', case when v_tema > 0 then 0 else 10 end,
    'repaso', case when v_repaso > 0 then 0 else 10 end,
    'simulacro', v_simulacros < 1,
    'ilimitado', false
  );
end;
$$;
