-- Esquema inicial: oposiciones, temario, banco de preguntas, intentos y suscripciones.
--
-- Las preguntas se asignan a temas a través de `preguntas_oposiciones`, que guarda
-- en qué tema de cada oposición cae la pregunta. Así una pregunta de la Ley 39/2015
-- se reutiliza en otra oposición aunque allí esté en un tema con otro número.

create extension if not exists pgcrypto;

create type estado_pregunta as enum ('borrador', 'validada', 'retirada');
create type modo_test as enum ('tema', 'mixto', 'falladas', 'simulacro');

-- Catálogo ---------------------------------------------------------------

create table oposiciones (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  activa boolean not null default true,
  -- {"minutos": 90, "penalizacion": 0.3333, "partes": [{"bloque": "I", "preguntas": 30}, ...]}
  formato_simulacro jsonb not null default '{}'::jsonb
);

create table temas (
  id uuid primary key default gen_random_uuid(),
  oposicion_id uuid not null references oposiciones (id) on delete cascade,
  numero int not null,
  titulo text not null,
  bloque text not null,
  unique (oposicion_id, numero)
);

create table leyes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  nombre_corto text not null,
  fecha_version_boe date
);

create table preguntas (
  id text primary key, -- id estable del archivo JSON, p. ej. "l39-021-01"
  ley_id uuid references leyes (id), -- null en ofimática
  articulo text not null,
  enunciado text not null,
  opciones text[] not null check (array_length(opciones, 1) = 4),
  correcta smallint not null check (correcta between 0 and 3),
  explicacion text not null,
  dificultad smallint not null check (dificultad between 1 and 3),
  fecha_version_boe date,
  estado estado_pregunta not null default 'borrador',
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create table preguntas_oposiciones (
  pregunta_id text not null references preguntas (id) on delete cascade,
  oposicion_id uuid not null references oposiciones (id) on delete cascade,
  tema_id uuid not null references temas (id) on delete cascade,
  primary key (pregunta_id, oposicion_id)
);
create index on preguntas_oposiciones (tema_id);

-- Preguntas gratuitas: demo de la home y páginas SEO por ley.
create table selecciones_publicas (
  seleccion text not null, -- 'demo', 'ley-39-2015', 'constitucion'...
  pregunta_id text not null references preguntas (id) on delete cascade,
  orden int not null,
  primary key (seleccion, pregunta_id)
);

-- Usuarios ---------------------------------------------------------------

create table suscripciones (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text check (plan in ('mensual', 'anual')),
  estado text not null default 'sin_suscripcion', -- estados de Stripe: active, trialing, past_due, canceled...
  fin_periodo timestamptz,
  actualizada_en timestamptz not null default now()
);

create table intentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  oposicion_id uuid not null references oposiciones (id),
  modo modo_test not null,
  temas uuid[] not null default '{}',
  preguntas text[] not null, -- orden en que se muestran
  minutos int, -- límite de tiempo (simulacro)
  penalizacion numeric not null default 0,
  creado_en timestamptz not null default now(),
  terminado_en timestamptz,
  aciertos int,
  fallos int,
  en_blanco int,
  puntuacion numeric(5, 2), -- sobre 10, con penalización
  duracion_segundos int
);
create index on intentos (usuario_id, creado_en desc);

create table respuestas (
  intento_id uuid not null references intentos (id) on delete cascade,
  pregunta_id text not null references preguntas (id),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  respuesta_dada smallint check (respuesta_dada between 0 and 3), -- null = en blanco
  acertada boolean not null,
  tiempo_ms int,
  respondida_en timestamptz not null default now(),
  primary key (intento_id, pregunta_id)
);
create index on respuestas (usuario_id, pregunta_id, respondida_en desc);

-- Acceso -----------------------------------------------------------------

create function public.tiene_suscripcion_activa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from suscripciones s
    where s.usuario_id = auth.uid()
      and s.estado in ('active', 'trialing')
      and (s.fin_periodo is null or s.fin_periodo > now())
  );
$$;

alter table oposiciones enable row level security;
alter table temas enable row level security;
alter table leyes enable row level security;
alter table preguntas enable row level security;
alter table preguntas_oposiciones enable row level security;
alter table selecciones_publicas enable row level security;
alter table suscripciones enable row level security;
alter table intentos enable row level security;
alter table respuestas enable row level security;

create policy "catálogo público" on oposiciones for select using (true);
create policy "catálogo público" on temas for select using (true);
create policy "catálogo público" on leyes for select using (true);
create policy "catálogo público" on preguntas_oposiciones for select using (true);
create policy "catálogo público" on selecciones_publicas for select using (true);

-- Sin suscripción solo se ven las preguntas de la demo y de las páginas SEO.
create policy "preguntas visibles" on preguntas for select using (
  estado = 'validada'
  and (
    exists (select 1 from selecciones_publicas sp where sp.pregunta_id = preguntas.id)
    or public.tiene_suscripcion_activa()
  )
);

-- Las suscripciones solo las escribe el webhook de Stripe (service role).
create policy "ver la mía" on suscripciones for select using (usuario_id = auth.uid());

-- Intentos y respuestas se crean y corrigen con las funciones de abajo.
create policy "ver los míos" on intentos for select using (usuario_id = auth.uid());
create policy "ver las mías" on respuestas for select using (usuario_id = auth.uid());

revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- Funciones de test -------------------------------------------------------

-- Crea un intento eligiendo preguntas en el servidor. Prioriza las que el
-- usuario aún no ha visto para que el banco se recorra entero.
create function public.crear_intento(
  p_oposicion text,
  p_modo modo_test,
  p_temas uuid[] default '{}',
  p_num int default 20
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_opo oposiciones%rowtype;
  v_preguntas text[];
  v_parte jsonb;
  v_lote text[];
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  if not tiene_suscripcion_activa() then
    raise exception 'sin_suscripcion' using errcode = 'P0001';
  end if;

  select * into v_opo from oposiciones where slug = p_oposicion and activa;
  if not found then
    raise exception 'oposicion_desconocida' using errcode = 'P0001';
  end if;

  p_num := least(greatest(coalesce(p_num, 20), 5), 100);

  if p_modo = 'simulacro' then
    v_preguntas := '{}';
    for v_parte in select * from jsonb_array_elements(v_opo.formato_simulacro -> 'partes') loop
      select array_agg(id) into v_lote from (
        select p.id
        from preguntas p
        join preguntas_oposiciones po on po.pregunta_id = p.id and po.oposicion_id = v_opo.id
        join temas t on t.id = po.tema_id
        where p.estado = 'validada' and t.bloque = v_parte ->> 'bloque'
        order by random()
        limit (v_parte ->> 'preguntas')::int
      ) s;
      v_preguntas := v_preguntas || coalesce(v_lote, '{}');
    end loop;
  elsif p_modo = 'falladas' then
    select array_agg(id) into v_preguntas from (
      select u.pregunta_id as id
      from (
        select distinct on (r.pregunta_id) r.pregunta_id, r.acertada
        from respuestas r
        where r.usuario_id = v_uid
        order by r.pregunta_id, r.respondida_en desc
      ) u
      join preguntas p on p.id = u.pregunta_id and p.estado = 'validada'
      join preguntas_oposiciones po on po.pregunta_id = p.id and po.oposicion_id = v_opo.id
      where not u.acertada
        and (cardinality(p_temas) = 0 or po.tema_id = any (p_temas))
      order by random()
      limit p_num
    ) s;
  else
    select array_agg(id) into v_preguntas from (
      select p.id
      from preguntas p
      join preguntas_oposiciones po on po.pregunta_id = p.id and po.oposicion_id = v_opo.id
      where p.estado = 'validada'
        and (cardinality(p_temas) = 0 or po.tema_id = any (p_temas))
      order by
        exists (select 1 from respuestas r where r.usuario_id = v_uid and r.pregunta_id = p.id),
        random()
      limit p_num
    ) s;
  end if;

  if coalesce(cardinality(v_preguntas), 0) = 0 then
    raise exception 'sin_preguntas' using errcode = 'P0001';
  end if;

  insert into intentos (usuario_id, oposicion_id, modo, temas, preguntas, minutos, penalizacion)
  values (
    v_uid, v_opo.id, p_modo, coalesce(p_temas, '{}'), v_preguntas,
    case when p_modo = 'simulacro' then (v_opo.formato_simulacro ->> 'minutos')::int end,
    coalesce((v_opo.formato_simulacro ->> 'penalizacion')::numeric, 0)
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Corrige un intento en el servidor. p_respuestas: [{"pregunta_id": "...", "respuesta": 0-3 | null, "tiempo_ms": 1234}]
create function public.terminar_intento(p_intento uuid, p_respuestas jsonb)
returns intentos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_int intentos%rowtype;
  v_total int;
begin
  select * into v_int from intentos where id = p_intento and usuario_id = auth.uid() for update;
  if not found then
    raise exception 'intento_desconocido' using errcode = 'P0001';
  end if;
  if v_int.terminado_en is not null then
    return v_int;
  end if;

  insert into respuestas (intento_id, pregunta_id, usuario_id, respuesta_dada, acertada, tiempo_ms)
  select
    v_int.id,
    p.id,
    v_int.usuario_id,
    (r ->> 'respuesta')::smallint,
    coalesce((r ->> 'respuesta')::smallint = p.correcta, false),
    (r ->> 'tiempo_ms')::int
  from jsonb_array_elements(p_respuestas) r
  join preguntas p on p.id = r ->> 'pregunta_id'
  where p.id = any (v_int.preguntas)
  on conflict do nothing;

  v_total := cardinality(v_int.preguntas);

  update intentos i set
    terminado_en = now(),
    aciertos = c.aciertos,
    fallos = c.fallos,
    en_blanco = v_total - c.aciertos - c.fallos,
    puntuacion = round(greatest(0, c.aciertos - c.fallos * i.penalizacion) * 10.0 / v_total, 2),
    duracion_segundos = extract(epoch from now() - i.creado_en)::int
  from (
    select
      count(*) filter (where acertada) as aciertos,
      count(*) filter (where not acertada and respuesta_dada is not null) as fallos
    from respuestas where intento_id = v_int.id
  ) c
  where i.id = v_int.id
  returning i.* into v_int;

  return v_int;
end;
$$;

-- Dominio por tema: de las preguntas que has visto, cuántas acertaste la última vez.
create function public.progreso_por_tema(p_oposicion text)
returns table (
  tema_id uuid,
  numero int,
  titulo text,
  bloque text,
  total int,
  vistas int,
  dominadas int
)
language sql
stable
security definer
set search_path = public
as $$
  with ultima as (
    select distinct on (r.pregunta_id) r.pregunta_id, r.acertada
    from respuestas r
    where r.usuario_id = auth.uid()
    order by r.pregunta_id, r.respondida_en desc
  )
  select
    t.id, t.numero, t.titulo, t.bloque,
    count(p.id)::int as total,
    count(u.pregunta_id)::int as vistas,
    count(u.pregunta_id) filter (where u.acertada)::int as dominadas
  from temas t
  join oposiciones o on o.id = t.oposicion_id and o.slug = p_oposicion
  left join preguntas_oposiciones po on po.tema_id = t.id
  left join preguntas p on p.id = po.pregunta_id and p.estado = 'validada'
  left join ultima u on u.pregunta_id = p.id
  group by t.id
  order by t.numero;
$$;

-- Días seguidos estudiando (hora de Madrid), contando hoy o ayer como último día.
create function public.racha_actual()
returns int
language sql
stable
security definer
set search_path = public
as $$
  with dias as (
    select distinct (terminado_en at time zone 'Europe/Madrid')::date as dia
    from intentos
    where usuario_id = auth.uid() and terminado_en is not null
  ),
  hoy as (select (now() at time zone 'Europe/Madrid')::date as d),
  grupos as (
    select dia, dia - (row_number() over (order by dia))::int as grupo from dias
  ),
  ultimo as (
    select grupo, max(dia) as fin, count(*)::int as largo
    from grupos group by grupo order by max(dia) desc limit 1
  )
  select coalesce(
    (select largo from ultimo, hoy where ultimo.fin >= hoy.d - 1),
    0
  );
$$;

revoke execute on function public.crear_intento, public.terminar_intento,
  public.progreso_por_tema, public.racha_actual from anon, public;
grant execute on function public.crear_intento, public.terminar_intento,
  public.progreso_por_tema, public.racha_actual to authenticated;
