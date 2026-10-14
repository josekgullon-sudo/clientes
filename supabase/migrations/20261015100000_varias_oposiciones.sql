-- Varias oposiciones: cada persona prepara una (perfil_estudio.oposicion) y las funciones
-- de estudio usan la suya en vez de la de Auxiliar fija. Las respuestas son de la pregunta,
-- así que lo que alguien ya ha respondido cuenta en todas las oposiciones que la incluyen.

alter table perfil_estudio
  add column if not exists oposicion text not null default 'aux-age';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'perfil_estudio_oposicion_fkey') then
    alter table perfil_estudio
      add constraint perfil_estudio_oposicion_fkey
      foreign key (oposicion) references oposiciones (slug) on update cascade;
  end if;
end;
$$;

create or replace function public._oposicion_de(p_uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select oposicion from perfil_estudio where usuario_id = p_uid), 'aux-age');
$$;

create or replace function public._mi_oposicion()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select public._oposicion_de(auth.uid());
$$;

create or replace function public.elegir_oposicion(p_slug text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  if not exists (select 1 from oposiciones where slug = p_slug and activa) then
    raise exception 'oposicion_desconocida' using errcode = 'P0001';
  end if;
  perform public.asegurar_perfil();
  update perfil_estudio set oposicion = p_slug where usuario_id = auth.uid();
  return p_slug;
end;
$$;

create or replace function public.importar_respuestas_demo(p_respuestas jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_opo uuid;
  v_id uuid;
  v_preguntas text[];
  v_total int;
  v_aciertos int;
  v_fallos int;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;

  select id into v_id
  from intentos
  where usuario_id = v_uid and es_importado
  order by creado_en desc
  limit 1;
  if v_id is not null then
    return v_id;
  end if;

  select id into v_opo from oposiciones where slug = public._mi_oposicion() and activa;
  if v_opo is null then
    raise exception 'oposicion_desconocida' using errcode = 'P0001';
  end if;

  select array_agg(id) into v_preguntas from (
    select p.id
    from jsonb_array_elements(p_respuestas) r
    join preguntas p on p.id = r ->> 'pregunta_id' and p.estado = 'validada'
    limit 40
  ) s;

  if coalesce(cardinality(v_preguntas), 0) = 0 then
    raise exception 'sin_preguntas' using errcode = 'P0001';
  end if;

  insert into intentos (usuario_id, oposicion_id, modo, temas, preguntas, penalizacion, es_importado, terminado_en)
  values (v_uid, v_opo, 'tema', '{}', v_preguntas, 0.3333, true, now())
  returning id into v_id;

  insert into respuestas (intento_id, pregunta_id, usuario_id, respuesta_dada, acertada, tiempo_ms)
  select
    v_id,
    p.id,
    v_uid,
    (r ->> 'respuesta')::smallint,
    coalesce((r ->> 'respuesta')::smallint = p.correcta, false),
    null
  from jsonb_array_elements(p_respuestas) r
  join preguntas p on p.id = r ->> 'pregunta_id' and p.estado = 'validada'
  where p.id = any (v_preguntas)
  on conflict do nothing;

  select
    count(*) filter (where acertada),
    count(*) filter (where not acertada and respuesta_dada is not null)
  into v_aciertos, v_fallos
  from respuestas where intento_id = v_id;

  v_total := cardinality(v_preguntas);
  update intentos set
    aciertos = v_aciertos,
    fallos = v_fallos,
    en_blanco = v_total - v_aciertos - v_fallos,
    puntuacion = round(greatest(0, v_aciertos - v_fallos * penalizacion) * 10.0 / v_total, 2),
    duracion_segundos = 0
  where id = v_id;

  return v_id;
end;
$$;

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
  v_opo text := public._mi_oposicion();
  v_pesos jsonb;
  v_parte int;
begin
  if v_uid is null then
    return jsonb_build_object('suficiente', false, 'respuestas', 0);
  end if;

  select count(*) into v_n from respuestas where usuario_id = v_uid;
  v_suficiente := v_n >= 100;
  v_mitad := greatest(1.5, 6.0 * (1 - least(v_n, 400)::numeric / 400));

  -- Peso de cada tema = preguntas de su bloque en el examen / temas del bloque.
  -- Cada bloque suma a la parte del examen que indique el formato (por defecto, una parte por bloque).
  select coalesce(jsonb_object_agg(f.bloque, jsonb_build_object(
    'peso', f.preguntas::numeric / nullif(n.temas, 0),
    'parte', f.parte
  )), '{}'::jsonb)
  into v_pesos
  from (
    select p ->> 'bloque' as bloque, (p ->> 'preguntas')::int as preguntas,
      coalesce((p ->> 'parte')::int, o.ord::int) as parte
    from oposiciones op, jsonb_array_elements(op.formato_simulacro -> 'partes') with ordinality as o(p, ord)
    where op.slug = v_opo
  ) f
  join (
    select t.bloque, count(*) as temas
    from temas t join oposiciones op on op.id = t.oposicion_id and op.slug = v_opo
    group by t.bloque
  ) n on n.bloque = f.bloque;

  for v_tema in select * from public.progreso_por_tema(v_opo) loop
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
    v_peso := coalesce((v_pesos -> v_tema.bloque ->> 'peso')::numeric, 0);
    v_parte := coalesce((v_pesos -> v_tema.bloque ->> 'parte')::int, 1);
    continue when v_peso = 0;

    if v_parte = 2 then
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
  v_opo text := public._mi_oposicion();
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
  from public.progreso_por_tema(v_opo);

  select coalesce(jsonb_agg(jsonb_build_object(
    'bloque', bloque,
    'total', total,
    'vistas', vistas,
    'dominadas', dominadas
  ) order by bloque), '[]'::jsonb)
  into v_bloques
  from (
    select bloque, sum(total)::int as total, sum(vistas)::int as vistas, sum(dominadas)::int as dominadas
    from public.progreso_por_tema(v_opo)
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
    'prediccion', v_pred,
    'oposicion', v_opo
  );
end;
$$;

create or replace function public._revisar_logros(
  p_uid uuid,
  p_modo modo_test,
  p_seguidas int,
  p_puntuacion numeric,
  p_total_preguntas int
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nuevos text[] := '{}';
  v_racha int;
  v_hora int;
  v_n int;
  v_perfectas int;
  v_objetivo int;
  v_id text;
begin
  select racha_actual into v_racha from perfil_estudio where usuario_id = p_uid;
  v_hora := extract(hour from now() at time zone 'Europe/Madrid');
  select count(*) into v_n from respuestas where usuario_id = p_uid;
  select count(*) into v_perfectas from intentos
  where usuario_id = p_uid and terminado_en is not null
    and modo in ('leccion', 'tema') and aciertos = cardinality(preguntas) and cardinality(preguntas) > 0;

  with dias as (
    select dia from actividad_diaria
    where usuario_id = p_uid and (objetivo_cumplido or protector_usado)
  ),
  grupos as (
    select dia, dia - (row_number() over (order by dia))::int as grupo from dias
  )
  select coalesce(max(largo), 0) into v_objetivo from (
    select count(*)::int as largo from grupos group by grupo
  ) s;

  foreach v_id in array array[
    case when p_modo in ('leccion', 'tema') then 'primera-leccion' end,
    case when exists (select 1 from nivel_tema where usuario_id = p_uid and (lecciones_nivel > 0 or nivel > 1 or corona is not null)) then 'primer-nivel' end,
    case when exists (select 1 from nivel_tema where usuario_id = p_uid and corona is not null) then 'primera-corona' end,
    case when v_racha >= 7 then 'racha-7' end,
    case when v_racha >= 30 then 'racha-30' end,
    case when v_racha >= 100 then 'racha-100' end,
    case when v_objetivo >= 10 then 'objetivo-10' end,
    case when p_seguidas >= 10 then 'seguidas-10' end,
    case when v_perfectas >= 5 then 'perfecta-5' end,
    case when p_modo = 'simulacro' and p_puntuacion >= 7 then 'simulacro-7' end,
    case when v_n >= 500 then 'volumen-500' end,
    case when v_n >= 1000 then 'volumen-1000' end,
    case when v_n >= 5000 then 'volumen-5000' end,
    case when v_hora < 8 then 'madrugador' end,
    case when v_hora >= 23 then 'nocturno' end
  ]
  loop
    if v_id is not null and public._conceder_logro(p_uid, v_id) then
      v_nuevos := v_nuevos || v_id;
    end if;
  end loop;

  if not exists (
    select 1
    from temas t
    join oposiciones o on o.id = t.oposicion_id and o.slug = public._oposicion_de(p_uid)
    where t.bloque = 'I'
      and exists (
        select 1 from preguntas_oposiciones po
        join preguntas p on p.id = po.pregunta_id and p.estado = 'validada'
        where po.tema_id = t.id
      )
      and not exists (
        select 1 from nivel_tema n
        where n.usuario_id = p_uid and n.tema_id = t.id and n.corona is not null
      )
  ) and exists (
    select 1 from nivel_tema n
    join temas t on t.id = n.tema_id and t.bloque = 'I'
    where n.usuario_id = p_uid and n.corona is not null
  ) and public._conceder_logro(p_uid, 'coronas-bloque-i') then
    v_nuevos := v_nuevos || 'coronas-bloque-i';
  end if;

  if not exists (
    select 1
    from temas t
    join oposiciones o on o.id = t.oposicion_id and o.slug = public._oposicion_de(p_uid)
    where exists (
      select 1 from preguntas_oposiciones po
      join preguntas p on p.id = po.pregunta_id and p.estado = 'validada'
      where po.tema_id = t.id
    )
    and not exists (
      select 1 from nivel_tema n
      where n.usuario_id = p_uid and n.tema_id = t.id and n.corona is not null
    )
  ) and exists (
    select 1 from nivel_tema where usuario_id = p_uid and corona is not null
  ) and public._conceder_logro(p_uid, 'coronas-todas') then
    v_nuevos := v_nuevos || 'coronas-todas';
  end if;

  return v_nuevos;
end;
$$;

create or replace function public.camino_temas()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'tema_id', t.tema_id,
    'numero', t.numero,
    'titulo', t.titulo,
    'bloque', t.bloque,
    'total', t.total,
    'nivel', coalesce(n.nivel, 0),
    'lecciones', coalesce(n.lecciones_nivel, 0),
    'corona', n.corona
  ) order by t.numero), '[]'::jsonb)
  from public.progreso_por_tema(public._mi_oposicion()) t
  left join nivel_tema n on n.tema_id = t.tema_id and n.usuario_id = auth.uid();
$$;

-- Sin oposición (null), la de la persona.
create or replace function public.progreso_por_tema(p_oposicion text)
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
  join oposiciones o on o.id = t.oposicion_id and o.slug = coalesce(p_oposicion, public._mi_oposicion())
  left join preguntas_oposiciones po on po.tema_id = t.id
  left join preguntas p on p.id = po.pregunta_id and p.estado = 'validada'
  left join ultima u on u.pregunta_id = p.id
  group by t.id
  order by t.numero;
$$;

revoke execute on function public._oposicion_de(uuid) from anon, public, authenticated;
revoke execute on function public._mi_oposicion() from anon, public;
grant execute on function public._mi_oposicion() to authenticated;
revoke execute on function public.elegir_oposicion(text) from anon, public;
grant execute on function public.elegir_oposicion(text) to authenticated;
