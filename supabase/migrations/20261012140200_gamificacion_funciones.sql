-- Funciones que usan los modos leccion, repaso y salto.
-- Van después de añadir esos valores al enum.

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
      if v_hechos >= 1 then
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
    join oposiciones o on o.id = t.oposicion_id and o.slug = 'aux-age'
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
    join oposiciones o on o.id = t.oposicion_id and o.slug = 'aux-age'
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
  v_protectores int;
  v_anterior int;
  v_reparable timestamptz;
  v_reparacion int;
  v_xp int;
  v_nivel_subido boolean := false;
  v_corona text;
  v_seguidas int := 0;
  v_mejor int := 0;
  v_r record;
  v_logros text[];
  v_recien boolean := false;
  v_racha_nueva boolean := false;
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
    v_int.id, p.id, v_int.usuario_id,
    (r ->> 'respuesta')::smallint,
    coalesce((r ->> 'respuesta')::smallint = p.correcta, false),
    (r ->> 'tiempo_ms')::int
  from jsonb_array_elements(p_respuestas) r
  join preguntas p on p.id = r ->> 'pregunta_id'
  where p.id = any (v_int.preguntas)
  on conflict do nothing;

  for v_r in
    select coalesce((r ->> 'respuesta')::smallint = p.correcta, false) as acierto, p.id
    from jsonb_array_elements(p_respuestas) with ordinality as r(valor, ord)
    join preguntas p on p.id = r.valor ->> 'pregunta_id'
    where p.id = any (v_int.preguntas)
    order by r.ord
  loop
    if v_r.acierto then
      v_seguidas := v_seguidas + 1;
      v_mejor := greatest(v_mejor, v_seguidas);
    else
      v_seguidas := 0;
    end if;
    perform public._aplicar_repaso(v_int.usuario_id, v_r.id, v_r.acierto, v_hoy);
  end loop;

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

  if v_int.modo = 'leccion' and coalesce(cardinality(v_int.temas), 0) = 1 and v_total > 0 then
    if v_int.tema_nivel = 5 then
      if v_int.aciertos * 10 >= v_total * 7 then
        v_corona := case when v_int.aciertos * 10 >= v_total * 8 then 'oro' else 'plata' end;
        insert into nivel_tema (usuario_id, tema_id, nivel, lecciones_nivel, corona)
        values (v_int.usuario_id, v_int.temas[1], 5, 3, v_corona)
        on conflict (usuario_id, tema_id) do update set
          nivel = 5,
          lecciones_nivel = 3,
          corona = coalesce(nivel_tema.corona, excluded.corona),
          actualizado_en = now()
        where nivel_tema.corona is null;
        v_nivel_subido := true;
      end if;
    elsif v_int.aciertos * 10 >= v_total * 7 then
      insert into nivel_tema (usuario_id, tema_id, nivel, lecciones_nivel)
      values (v_int.usuario_id, v_int.temas[1], coalesce(v_int.tema_nivel, 1), 1)
      on conflict (usuario_id, tema_id) do update set
        lecciones_nivel = nivel_tema.lecciones_nivel + 1,
        actualizado_en = now();
      update nivel_tema set
        nivel = nivel + 1,
        lecciones_nivel = 0
      where usuario_id = v_int.usuario_id and tema_id = v_int.temas[1]
        and lecciones_nivel >= 3 and nivel < 5;
      v_nivel_subido := found;
    end if;
  elsif v_int.modo = 'salto' and coalesce(cardinality(v_int.temas), 0) = 1 and v_int.aciertos >= 12 then
    insert into nivel_tema (usuario_id, tema_id, nivel, lecciones_nivel)
    values (v_int.usuario_id, v_int.temas[1], 3, 0)
    on conflict (usuario_id, tema_id) do update set
      nivel = greatest(nivel_tema.nivel, 3),
      lecciones_nivel = case when nivel_tema.nivel < 3 then 0 else nivel_tema.lecciones_nivel end,
      actualizado_en = now()
    where nivel_tema.nivel < 3;
    v_nivel_subido := true;
  end if;

  v_xp := coalesce(v_int.aciertos, 0) * 10 + coalesce(v_int.fallos, 0) * 2;
  if v_int.modo in ('falladas', 'repaso') then
    v_xp := round(v_xp * 1.5);
  end if;
  if v_int.modo in ('tema', 'leccion') and v_total > 0 and v_int.aciertos = v_total then
    v_xp := v_xp + 20;
  end if;
  if v_nivel_subido then
    v_xp := v_xp + 50;
  end if;
  if v_int.modo = 'simulacro' then
    v_xp := v_xp + 150;
  end if;

  perform public.asegurar_perfil();
  select objetivo_diario, racha_actual, ultimo_dia_activo, protectores, racha_anterior, reparable_hasta, lecciones_reparacion
  into v_objetivo, v_racha, v_ultimo, v_protectores, v_anterior, v_reparable, v_reparacion
  from perfil_estudio where usuario_id = v_int.usuario_id;

  if not v_int.es_importado then
    select coalesce(objetivo_cumplido, false) into v_ya
    from actividad_diaria where usuario_id = v_int.usuario_id and dia = v_hoy;

    insert into actividad_diaria (usuario_id, dia, preguntas, aciertos, xp, objetivo_cumplido)
    values (v_int.usuario_id, v_hoy, v_total, coalesce(v_int.aciertos, 0), v_xp, v_total >= v_objetivo)
    on conflict (usuario_id, dia) do update set
      preguntas = actividad_diaria.preguntas + excluded.preguntas,
      aciertos = actividad_diaria.aciertos + excluded.aciertos,
      xp = actividad_diaria.xp + excluded.xp,
      objetivo_cumplido = (actividad_diaria.preguntas + excluded.preguntas) >= v_objetivo;

    select objetivo_cumplido into v_ahora
    from actividad_diaria where usuario_id = v_int.usuario_id and dia = v_hoy;
    v_recien := v_ahora and not coalesce(v_ya, false);

    if v_reparable is not null and v_reparable > now() and v_int.modo in ('leccion', 'tema', 'repaso', 'falladas') then
      v_reparacion := coalesce(v_reparacion, 0) + 1;
      if v_reparacion >= 2 then
        v_racha := coalesce(v_anterior, 0) + 1;
        v_ultimo := v_hoy;
        v_reparable := null;
        v_reparacion := 0;
        v_racha_nueva := true;
      end if;
    end if;

    if v_recien and v_ultimo is distinct from v_hoy then
      if v_ultimo = v_hoy - 2 and coalesce(v_protectores, 0) > 0 then
        v_protectores := v_protectores - 1;
        insert into actividad_diaria (usuario_id, dia, protector_usado, objetivo_cumplido)
        values (v_int.usuario_id, v_hoy - 1, true, true)
        on conflict (usuario_id, dia) do update set protector_usado = true, objetivo_cumplido = true;
        v_racha := v_racha + 1;
      elsif v_ultimo is null or v_ultimo < v_hoy - 1 then
        v_anterior := v_racha;
        v_reparable := now() + interval '24 hours';
        v_reparacion := 0;
        v_racha := 1;
      elsif v_ultimo = v_hoy - 1 then
        v_racha := v_racha + 1;
      end if;
      v_ultimo := v_hoy;
      v_racha_nueva := true;
    end if;

    update perfil_estudio set
      xp_total = xp_total + v_xp,
      racha_actual = v_racha,
      racha_maxima = greatest(racha_maxima, v_racha),
      ultimo_dia_activo = v_ultimo,
      protectores = v_protectores,
      racha_anterior = coalesce(v_anterior, racha_anterior),
      reparable_hasta = v_reparable,
      lecciones_reparacion = coalesce(v_reparacion, 0)
    where usuario_id = v_int.usuario_id;

    insert into eventos_xp (usuario_id, intento_id, motivo, xp)
    values (v_int.usuario_id, v_int.id, v_int.modo::text, v_xp);
  end if;

  v_logros := public._revisar_logros(v_int.usuario_id, v_int.modo, v_mejor, v_int.puntuacion, v_total);

  update intentos set
    xp = v_xp,
    meta = jsonb_build_object(
      'xp', v_xp,
      'racha', v_racha,
      'racha_nueva', v_racha_nueva,
      'objetivo_cumplido', coalesce(v_ahora, false),
      'recien_cumplido', v_recien,
      'nivel_subido', v_nivel_subido,
      'corona', v_corona,
      'logros', to_jsonb(coalesce(v_logros, '{}')),
      'seguidas', v_mejor
    )
  where id = v_int.id
  returning * into v_int;

  return v_int;
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
  from public.progreso_por_tema('aux-age') t
  left join nivel_tema n on n.tema_id = t.tema_id and n.usuario_id = auth.uid();
$$;

create or replace function public.marcar_repaso(p_pregunta text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
begin
  if auth.uid() is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  insert into repaso_pregunta (usuario_id, pregunta_id, intervalo_dias, facilidad, repeticiones, proxima_revision, actualizado_en)
  values (auth.uid(), p_pregunta, 0, 2.5, 0, v_hoy, now())
  on conflict (usuario_id, pregunta_id) do update set
    proxima_revision = v_hoy,
    actualizado_en = now();
end;
$$;

create or replace function public.reportar_pregunta(p_pregunta text, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  insert into reportes_pregunta (usuario_id, pregunta_id, motivo)
  values (auth.uid(), p_pregunta, left(coalesce(p_motivo, ''), 500));
end;
$$;

create or replace function public.mantenimiento_rachas()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
  v_n int := 0;
  v_p perfil_estudio%rowtype;
begin
  for v_p in
    select * from perfil_estudio
    where racha_actual > 0 and (ultimo_dia_activo is null or ultimo_dia_activo < v_hoy - 1)
  loop
    if v_p.ultimo_dia_activo = v_hoy - 2 and v_p.protectores > 0 then
      update perfil_estudio set
        protectores = protectores - 1,
        ultimo_dia_activo = v_hoy - 1
      where usuario_id = v_p.usuario_id;
      insert into actividad_diaria (usuario_id, dia, protector_usado, objetivo_cumplido)
      values (v_p.usuario_id, v_hoy - 1, true, true)
      on conflict (usuario_id, dia) do update set protector_usado = true, objetivo_cumplido = true;
    else
      update perfil_estudio set
        racha_anterior = racha_actual,
        reparable_hasta = now() + interval '24 hours',
        lecciones_reparacion = 0,
        racha_actual = 0
      where usuario_id = v_p.usuario_id;
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

create or replace function public.usuarios_recordatorio()
returns table (usuario_id uuid, email text, racha int, tipo text)
language sql
security definer
set search_path = public
as $$
  with hoy as (select (now() at time zone 'Europe/Madrid')::date as d)
  select p.usuario_id, u.email::text, p.racha_actual, 'racha'::text
  from perfil_estudio p
  join auth.users u on u.id = p.usuario_id
  cross join hoy
  where p.recordatorio_email
    and p.racha_actual >= 2
    and (p.ultimo_dia_activo is null or p.ultimo_dia_activo < hoy.d)
    and not exists (
      select 1 from notificaciones_enviadas n
      where n.usuario_id = p.usuario_id and n.tipo = 'racha' and n.canal = 'email'
        and (n.enviada_en at time zone 'Europe/Madrid')::date = hoy.d
    )
  union all
  select p.usuario_id, u.email::text, p.racha_actual, 'reactivacion'::text
  from perfil_estudio p
  join auth.users u on u.id = p.usuario_id
  cross join hoy
  where p.recordatorio_email
    and p.ultimo_dia_activo in (hoy.d - 3, hoy.d - 7, hoy.d - 14)
    and not exists (
      select 1 from notificaciones_enviadas n
      where n.usuario_id = p.usuario_id and n.tipo = 'reactivacion' and n.canal = 'email'
        and (n.enviada_en at time zone 'Europe/Madrid')::date = hoy.d
    );
$$;

revoke execute on function public._aplicar_repaso(uuid, text, boolean, date) from anon, public, authenticated;
revoke execute on function public._conceder_logro(uuid, text) from anon, public, authenticated;
revoke execute on function public._revisar_logros(uuid, modo_test, int, numeric, int) from anon, public, authenticated;
revoke execute on function public.mantenimiento_rachas() from anon, public, authenticated;
revoke execute on function public.usuarios_recordatorio() from anon, public, authenticated;
grant execute on function public.camino_temas() to authenticated;
grant execute on function public.marcar_repaso(text) to authenticated;
grant execute on function public.reportar_pregunta(text, text) to authenticated;
grant execute on function public.mantenimiento_rachas() to service_role;
grant execute on function public.usuarios_recordatorio() to service_role;
grant insert on public.notificaciones_enviadas to service_role;
