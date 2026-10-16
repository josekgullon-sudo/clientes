-- Plan gratis: 2 tests de tema o lección al día (20 preguntas) en vez de 1.

create or replace function public.crear_intento(
  p_oposicion text,
  p_modo modo_test,
  p_temas uuid[] default '{}',
  p_num int default 10
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
  v_nivel smallint := 1;
  v_lecciones smallint := 0;
  v_difs smallint[];
  v_penal numeric := 0;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  perform public.asegurar_perfil();
  v_premium := tiene_suscripcion_activa();

  select * into v_opo from oposiciones where slug = p_oposicion and activa;
  if not found then
    raise exception 'oposicion_desconocida' using errcode = 'P0001';
  end if;

  if p_modo in ('leccion', 'salto', 'tema') and coalesce(cardinality(p_temas), 0) = 1 then
    select coalesce(nivel, 1), coalesce(lecciones_nivel, 0)
    into v_nivel, v_lecciones
    from nivel_tema
    where usuario_id = v_uid and tema_id = p_temas[1];
    if not found then
      v_nivel := 1;
      v_lecciones := 0;
    end if;
    if v_nivel < 1 then
      v_nivel := 1;
    end if;
    if v_lecciones >= 3 and v_nivel < 5 then
      v_nivel := v_nivel + 1;
    end if;
  end if;

  if not v_premium then
    if p_modo = 'simulacro' then
      select count(*) into v_hechos from intentos
      where usuario_id = v_uid and modo = 'simulacro' and not es_importado;
      if v_hechos >= 1 then
        raise exception 'premium_requerido' using errcode = 'P0001';
      end if;
    elsif p_modo in ('tema', 'leccion') then
      if coalesce(cardinality(p_temas), 0) <> 1 or v_nivel >= 3 then
        raise exception 'premium_requerido' using errcode = 'P0001';
      end if;
      p_num := least(coalesce(p_num, 10), 10);
      select count(*) into v_hechos from intentos
      where usuario_id = v_uid and not es_importado and modo in ('tema', 'leccion')
        and (creado_en at time zone 'Europe/Madrid')::date = v_hoy;
      if v_hechos >= 2 then
        raise exception 'cuota_agotada' using errcode = 'P0001';
      end if;
    elsif p_modo in ('falladas', 'repaso') then
      p_num := least(coalesce(p_num, 10), 10);
      select count(*) into v_hechos from intentos
      where usuario_id = v_uid and not es_importado and modo in ('falladas', 'repaso')
        and (creado_en at time zone 'Europe/Madrid')::date = v_hoy;
      if v_hechos >= 1 then
        raise exception 'cuota_agotada' using errcode = 'P0001';
      end if;
    else
      raise exception 'premium_requerido' using errcode = 'P0001';
    end if;
  end if;

  if p_modo = 'leccion' and v_nivel = 5 then
    p_num := 20;
    v_penal := coalesce((v_opo.formato_simulacro ->> 'penalizacion')::numeric, 0);
  elsif p_modo = 'salto' then
    p_num := 15;
  end if;
  p_num := least(greatest(coalesce(p_num, 10), 5), 100);

  if p_modo = 'simulacro' then
    v_penal := coalesce((v_opo.formato_simulacro ->> 'penalizacion')::numeric, 0);
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
  elsif p_modo in ('falladas', 'repaso') then
    select array_agg(id) into v_preguntas from (
      select rp.pregunta_id as id
      from repaso_pregunta rp
      join preguntas p on p.id = rp.pregunta_id and p.estado = 'validada'
      join preguntas_oposiciones po on po.pregunta_id = p.id and po.oposicion_id = v_opo.id
      where rp.usuario_id = v_uid
        and rp.proxima_revision <= v_hoy
        and (cardinality(p_temas) = 0 or po.tema_id = any (p_temas))
      order by rp.proxima_revision, rp.actualizado_en
      limit p_num
    ) s;
    if coalesce(cardinality(v_preguntas), 0) = 0 then
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
    end if;
  elsif p_modo = 'leccion' then
    v_difs := case v_nivel
      when 1 then array[1]::smallint[]
      when 2 then array[1, 2]::smallint[]
      when 3 then array[2]::smallint[]
      when 4 then array[2, 3]::smallint[]
      else array[1, 2, 3]::smallint[]
    end;
    select array_agg(id) into v_preguntas from (
      select p.id
      from preguntas p
      join preguntas_oposiciones po on po.pregunta_id = p.id and po.oposicion_id = v_opo.id
      where p.estado = 'validada'
        and po.tema_id = any (p_temas)
        and p.dificultad = any (v_difs)
      order by exists (select 1 from respuestas r where r.usuario_id = v_uid and r.pregunta_id = p.id), random()
      limit p_num
    ) s;
    if coalesce(cardinality(v_preguntas), 0) = 0 then
      select array_agg(id) into v_preguntas from (
        select p.id
        from preguntas p
        join preguntas_oposiciones po on po.pregunta_id = p.id and po.oposicion_id = v_opo.id
        where p.estado = 'validada' and po.tema_id = any (p_temas)
        order by random()
        limit p_num
      ) s;
    end if;
  else
    select array_agg(id) into v_preguntas from (
      select p.id
      from preguntas p
      join preguntas_oposiciones po on po.pregunta_id = p.id and po.oposicion_id = v_opo.id
      where p.estado = 'validada'
        and (cardinality(p_temas) = 0 or po.tema_id = any (p_temas))
      order by exists (select 1 from respuestas r where r.usuario_id = v_uid and r.pregunta_id = p.id), random()
      limit p_num
    ) s;
  end if;

  if coalesce(cardinality(v_preguntas), 0) = 0 then
    raise exception 'sin_preguntas' using errcode = 'P0001';
  end if;

  insert into intentos (usuario_id, oposicion_id, modo, temas, preguntas, minutos, penalizacion, tema_nivel)
  values (
    v_uid, v_opo.id, p_modo, coalesce(p_temas, '{}'), v_preguntas,
    case when p_modo = 'simulacro' then (v_opo.formato_simulacro ->> 'minutos')::int end,
    case when p_modo = 'simulacro' then v_penal when p_modo = 'leccion' and v_nivel = 5 then v_penal else 0 end,
    case when p_modo in ('leccion', 'salto', 'tema') then v_nivel end
  )
  returning id into v_id;

  return v_id;
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
    'tema', greatest(0, 2 - v_tema) * 10,
    'repaso', case when v_repaso > 0 then 0 else 10 end,
    'simulacro', v_simulacros < 1,
    'ilimitado', false
  );
end;
$$;
