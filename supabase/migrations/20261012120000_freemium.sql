-- Plan gratis: una sesión al día de hasta 10 preguntas de un tema y otra de repaso
-- de fallos. El premium (suscripción activa) no tiene ese límite.
-- Un simulacro de prueba por cuenta, para enseñar el formato.

alter table intentos
  add column if not exists es_importado boolean not null default false;

-- Las preguntas del intento gratuito tienen que poder leerse aunque no estén
-- en la selección pública. Crear el intento sigue siendo una función definer.
create policy "preguntas de mis intentos" on preguntas for select using (
  estado = 'validada'
  and exists (
    select 1 from intentos i
    where i.usuario_id = auth.uid()
      and preguntas.id = any (i.preguntas)
  )
);

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

  select count(*) into v_tema
  from intentos
  where usuario_id = v_uid
    and not es_importado
    and modo = 'tema'
    and (creado_en at time zone 'Europe/Madrid')::date = v_hoy;

  select count(*) into v_repaso
  from intentos
  where usuario_id = v_uid
    and not es_importado
    and modo = 'falladas'
    and (creado_en at time zone 'Europe/Madrid')::date = v_hoy;

  select count(*) into v_simulacros
  from intentos
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

create or replace function public.crear_intento(
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
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
  v_premium boolean;
  v_hechos int;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;

  v_premium := tiene_suscripcion_activa();
  if not v_premium then
    if p_modo = 'simulacro' then
      select count(*) into v_hechos
      from intentos
      where usuario_id = v_uid and modo = 'simulacro' and not es_importado;
      if v_hechos >= 1 then
        raise exception 'premium_requerido' using errcode = 'P0001';
      end if;
    elsif p_modo = 'tema' then
      p_num := least(coalesce(p_num, 10), 10);
      if coalesce(cardinality(p_temas), 0) <> 1 then
        raise exception 'premium_requerido' using errcode = 'P0001';
      end if;
      select count(*) into v_hechos
      from intentos
      where usuario_id = v_uid
        and not es_importado
        and modo = 'tema'
        and (creado_en at time zone 'Europe/Madrid')::date = v_hoy;
      if v_hechos >= 1 then
        raise exception 'cuota_agotada' using errcode = 'P0001';
      end if;
    elsif p_modo = 'falladas' then
      p_num := least(coalesce(p_num, 10), 10);
      select count(*) into v_hechos
      from intentos
      where usuario_id = v_uid
        and not es_importado
        and modo = 'falladas'
        and (creado_en at time zone 'Europe/Madrid')::date = v_hoy;
      if v_hechos >= 1 then
        raise exception 'cuota_agotada' using errcode = 'P0001';
      end if;
    else
      raise exception 'premium_requerido' using errcode = 'P0001';
    end if;
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

-- Importa el test público guardado en el navegador. No gasta la cuota del día.
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

  select id into v_opo from oposiciones where slug = 'aux-age' and activa;
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

revoke execute on function public.cuota_restante() from anon, public;
revoke execute on function public.importar_respuestas_demo(jsonb) from anon, public;
grant execute on function public.cuota_restante() to authenticated;
grant execute on function public.importar_respuestas_demo(jsonb) to authenticated;
