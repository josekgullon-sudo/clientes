-- Corrige terminar_intento: en la racha de aciertos seguidos se leía (r ->> 'respuesta')
-- sobre un registro de jsonb_array_elements ... with ordinality, que falla con
-- «operator does not exist: record ->> unknown» e impedía guardar cualquier test con sesión.
-- Misma función que en 20261012140200, con r.valor en esa consulta.

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
    select coalesce((r.valor ->> 'respuesta')::smallint = p.correcta, false) as acierto, p.id
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
