-- Objetivo diario, racha por actividad y estadísticas.
-- La predicción replica src/lib/estudio/prediccion.ts.

create table perfil_estudio (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  objetivo_diario int not null default 10 check (objetivo_diario in (5, 10, 20, 30)),
  fecha_examen date,
  zona_horaria text not null default 'Europe/Madrid',
  xp_total int not null default 0,
  racha_actual int not null default 0,
  racha_maxima int not null default 0,
  ultimo_dia_activo date,
  protectores int not null default 1,
  recordatorio_hora time default '20:00',
  recordatorio_email boolean not null default true,
  onboarding_completado boolean not null default false,
  creado_en timestamptz not null default now()
);

create table actividad_diaria (
  usuario_id uuid references auth.users (id) on delete cascade,
  dia date not null,
  preguntas int not null default 0,
  aciertos int not null default 0,
  xp int not null default 0,
  objetivo_cumplido boolean not null default false,
  protector_usado boolean not null default false,
  primary key (usuario_id, dia)
);

alter table perfil_estudio enable row level security;
alter table actividad_diaria enable row level security;

create policy "ver el mío" on perfil_estudio for select using (usuario_id = auth.uid());
create policy "ver la mía" on actividad_diaria for select using (usuario_id = auth.uid());

revoke all on perfil_estudio from anon, authenticated;
revoke all on actividad_diaria from anon, authenticated;
grant select on perfil_estudio to authenticated;
grant select on actividad_diaria to authenticated;

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
begin
  if v_uid is null then
    return;
  end if;
  if exists (select 1 from perfil_estudio where usuario_id = v_uid) then
    return;
  end if;

  with dias as (
    select distinct (terminado_en at time zone 'Europe/Madrid')::date as dia
    from intentos
    where usuario_id = v_uid and terminado_en is not null and not es_importado
  ),
  hoy as (select (now() at time zone 'Europe/Madrid')::date as d),
  grupos as (
    select dia, dia - (row_number() over (order by dia))::int as grupo from dias
  ),
  ultimo as (
    select max(dia) as fin, count(*)::int as largo
    from grupos
    group by grupo
    order by max(dia) desc
    limit 1
  )
  select coalesce(u.largo, 0), u.fin
  into v_racha, v_fin
  from hoy
  left join ultimo u on u.fin >= hoy.d - 1;

  insert into perfil_estudio (usuario_id, racha_actual, racha_maxima, ultimo_dia_activo)
  values (v_uid, coalesce(v_racha, 0), coalesce(v_racha, 0), v_fin)
  on conflict (usuario_id) do nothing;
end;
$$;

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
end;
$$;

-- Sustituye el cálculo solo por intentos: si hay perfil, manda la racha guardada.
create or replace function public.racha_actual()
returns int
language sql
stable
security definer
set search_path = public
as $$
  with dias as (
    select distinct (terminado_en at time zone 'Europe/Madrid')::date as dia
    from intentos
    where usuario_id = auth.uid() and terminado_en is not null and not coalesce(es_importado, false)
  ),
  hoy as (select (now() at time zone 'Europe/Madrid')::date as d),
  grupos as (
    select dia, dia - (row_number() over (order by dia))::int as grupo from dias
  ),
  ultimo as (
    select grupo, max(dia) as fin, count(*)::int as largo
    from grupos group by grupo order by max(dia) desc limit 1
  ),
  respaldo as (
    select coalesce((select largo from ultimo, hoy where ultimo.fin >= hoy.d - 1), 0) as n
  )
  select greatest(
    coalesce((select racha_actual from perfil_estudio where usuario_id = auth.uid()), 0),
    (select n from respaldo)
  );
$$;

create or replace function public.terminar_intento(p_intento uuid, p_respuestas jsonb)
returns intentos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_int intentos%rowtype;
  v_total int;
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
  v_objetivo int;
  v_ya boolean;
  v_ahora boolean;
  v_racha int;
  v_ultimo date;
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

  if not v_int.es_importado then
    perform public.asegurar_perfil();
    select objetivo_diario, racha_actual, ultimo_dia_activo
    into v_objetivo, v_racha, v_ultimo
    from perfil_estudio where usuario_id = v_int.usuario_id;

    select coalesce(objetivo_cumplido, false) into v_ya
    from actividad_diaria
    where usuario_id = v_int.usuario_id and dia = v_hoy;

    insert into actividad_diaria (usuario_id, dia, preguntas, aciertos, objetivo_cumplido)
    values (
      v_int.usuario_id,
      v_hoy,
      v_total,
      coalesce(v_int.aciertos, 0),
      v_total >= v_objetivo
    )
    on conflict (usuario_id, dia) do update set
      preguntas = actividad_diaria.preguntas + excluded.preguntas,
      aciertos = actividad_diaria.aciertos + excluded.aciertos,
      objetivo_cumplido = (actividad_diaria.preguntas + excluded.preguntas) >= v_objetivo;

    select objetivo_cumplido into v_ahora
    from actividad_diaria
    where usuario_id = v_int.usuario_id and dia = v_hoy;

    if v_ahora and not coalesce(v_ya, false) and v_ultimo is distinct from v_hoy then
      if v_ultimo is null or v_ultimo < v_hoy - 1 then
        v_racha := 1;
      elsif v_ultimo = v_hoy - 1 then
        v_racha := v_racha + 1;
      end if;
      update perfil_estudio set
        racha_actual = v_racha,
        racha_maxima = greatest(racha_maxima, v_racha),
        ultimo_dia_activo = v_hoy
      where usuario_id = v_int.usuario_id;
    end if;
  end if;

  return v_int;
end;
$$;

-- Misma fórmula que src/lib/estudio/prediccion.ts.
create or replace function public.prediccion_nota()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_tema record;
  v_resp int;
  v_ac int;
  v_p numeric;
  v_c numeric;
  v_prob numeric;
  v_puntos numeric;
  v_peso numeric;
  v_raw1 numeric := 0;
  v_peso1 numeric := 0;
  v_raw2 numeric := 0;
  v_peso2 numeric := 0;
  v_n int;
  v_mitad numeric;
  v_nota numeric;
  v_debil jsonb := '[]'::jsonb;
  v_suficiente boolean;
begin
  if v_uid is null then
    return jsonb_build_object('suficiente', false, 'respuestas', 0);
  end if;

  select count(*) into v_n from respuestas where usuario_id = v_uid;
  v_suficiente := v_n >= 100;
  v_mitad := greatest(1.5, 6.0 * (1 - least(v_n, 400)::numeric / 400));

  for v_tema in select * from public.progreso_por_tema('aux-age') loop
    select count(*), count(*) filter (where acertada)
    into v_resp, v_ac
    from (
      select r.acertada
      from respuestas r
      join preguntas_oposiciones po on po.pregunta_id = r.pregunta_id and po.tema_id = v_tema.tema_id
      where r.usuario_id = v_uid
      order by r.respondida_en desc
      limit 50
    ) s;

    v_p := (coalesce(v_ac, 0) + 2)::numeric / (coalesce(v_resp, 0) + 4);
    v_c := case when v_tema.total > 0 then least(1, v_tema.vistas::numeric / v_tema.total) else 0 end;
    v_prob := v_p * v_c + 0.25 * (1 - v_c);
    v_puntos := v_prob - (1 - v_prob) * (1.0 / 3) * 0.9;
    v_peso := case when v_tema.bloque = 'II' then 50.0 / 12 else 30.0 / 16 end;

    if v_tema.bloque = 'II' then
      v_raw2 := v_raw2 + v_peso * v_puntos;
      v_peso2 := v_peso2 + v_peso;
    else
      v_raw1 := v_raw1 + v_peso * v_puntos;
      v_peso1 := v_peso1 + v_peso;
    end if;

    if v_tema.total > 0 then
      v_debil := v_debil || jsonb_build_array(jsonb_build_object(
        'numero', v_tema.numero,
        'titulo', v_tema.titulo,
        'bloque', v_tema.bloque,
        'probabilidad', round(v_prob, 4),
        'peso', round(v_peso, 4)
      ));
    end if;
  end loop;

  v_debil := (
    select coalesce(jsonb_agg(x order by (x ->> 'probabilidad')::numeric, (x ->> 'peso')::numeric desc), '[]'::jsonb)
    from (
      select value as x
      from jsonb_array_elements(v_debil)
      order by (value ->> 'probabilidad')::numeric, (value ->> 'peso')::numeric desc
      limit 3
    ) s
  );

  if not v_suficiente then
    return jsonb_build_object('suficiente', false, 'respuestas', v_n, 'debilidades', v_debil);
  end if;

  return jsonb_build_object(
    'suficiente', true,
    'respuestas', v_n,
    'parte1', public._nota_parte(v_raw1, v_peso1, v_mitad),
    'parte2', public._nota_parte(v_raw2, v_peso2, v_mitad),
    'debilidades', v_debil
  );
end;
$$;

create or replace function public._nota_parte(p_raw numeric, p_peso numeric, p_mitad numeric)
returns jsonb
language sql
immutable
as $$
  select case
    when p_peso <= 0 then null
    else (
      with n as (
        select round(least(50, greatest(0, (p_raw / p_peso) * 50))::numeric, 1) as nota
      )
      select jsonb_build_object(
        'nota', nota,
        'bajo', round(greatest(0, nota - p_mitad), 1),
        'alto', round(least(50, nota + p_mitad), 1)
      )
      from n
    )
  end;
$$;

create or replace function public.estadisticas_usuario()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_perfil perfil_estudio%rowtype;
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
  v_act actividad_diaria%rowtype;
  v_total int;
  v_acierto numeric;
  v_acierto7 numeric;
  v_acierto30 numeric;
  v_vel numeric;
  v_temas jsonb;
  v_bloques jsonb;
  v_heat jsonb;
  v_pred jsonb;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  perform public.asegurar_perfil();
  select * into v_perfil from perfil_estudio where usuario_id = v_uid;
  select * into v_act from actividad_diaria where usuario_id = v_uid and dia = v_hoy;

  select
    count(*),
    count(*) filter (where acertada)::numeric / nullif(count(*), 0),
    count(*) filter (where acertada and respondida_en > now() - interval '7 days')::numeric
      / nullif(count(*) filter (where respondida_en > now() - interval '7 days'), 0),
    count(*) filter (where acertada and respondida_en > now() - interval '30 days')::numeric
      / nullif(count(*) filter (where respondida_en > now() - interval '30 days'), 0),
    avg(tiempo_ms) filter (where tiempo_ms between 400 and 180000) / 1000.0
  into v_total, v_acierto, v_acierto7, v_acierto30, v_vel
  from respuestas
  where usuario_id = v_uid;

  select coalesce(jsonb_agg(jsonb_build_object(
    'tema_id', tema_id,
    'numero', numero,
    'titulo', titulo,
    'bloque', bloque,
    'total', total,
    'vistas', vistas,
    'dominadas', dominadas
  ) order by numero), '[]'::jsonb)
  into v_temas
  from public.progreso_por_tema('aux-age');

  select coalesce(jsonb_agg(jsonb_build_object(
    'bloque', bloque,
    'total', total,
    'vistas', vistas,
    'dominadas', dominadas
  ) order by bloque), '[]'::jsonb)
  into v_bloques
  from (
    select bloque, sum(total)::int as total, sum(vistas)::int as vistas, sum(dominadas)::int as dominadas
    from public.progreso_por_tema('aux-age')
    group by bloque
  ) b;

  select coalesce(jsonb_agg(jsonb_build_object('dia', dia, 'preguntas', preguntas) order by dia), '[]'::jsonb)
  into v_heat
  from (
    select d::date as dia, coalesce(a.preguntas, 0) as preguntas
    from generate_series(v_hoy - 83, v_hoy, interval '1 day') d
    left join actividad_diaria a on a.usuario_id = v_uid and a.dia = d::date
  ) h;

  v_pred := public.prediccion_nota();

  return jsonb_build_object(
    'objetivo_diario', v_perfil.objetivo_diario,
    'fecha_examen', v_perfil.fecha_examen,
    'preguntas_hoy', coalesce(v_act.preguntas, 0),
    'aciertos_hoy', coalesce(v_act.aciertos, 0),
    'xp_hoy', coalesce(v_act.xp, 0),
    'xp_total', v_perfil.xp_total,
    'racha_actual', v_perfil.racha_actual,
    'racha_maxima', v_perfil.racha_maxima,
    'protectores', v_perfil.protectores,
    'recordatorio_email', v_perfil.recordatorio_email,
    'onboarding_completado', v_perfil.onboarding_completado,
    'premium', public.tiene_suscripcion_activa(),
    'respuestas_total', coalesce(v_total, 0),
    'acierto_global', v_acierto,
    'acierto_7', v_acierto7,
    'acierto_30', v_acierto30,
    'velocidad_media_s', v_vel,
    'temas', v_temas,
    'bloques', v_bloques,
    'heatmap', v_heat,
    'prediccion', v_pred
  );
end;
$$;

revoke execute on function public.asegurar_perfil() from anon, public;
revoke execute on function public.guardar_perfil(int, date, boolean, boolean) from anon, public;
revoke execute on function public.prediccion_nota() from anon, public;
revoke execute on function public.estadisticas_usuario() from anon, public;
revoke execute on function public._nota_parte(numeric, numeric, numeric) from anon, public, authenticated;
grant execute on function public.asegurar_perfil() to authenticated;
grant execute on function public.guardar_perfil(int, date, boolean, boolean) to authenticated;
grant execute on function public.prediccion_nota() to authenticated;
grant execute on function public.estadisticas_usuario() to authenticated;
