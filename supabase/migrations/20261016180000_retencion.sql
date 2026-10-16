-- Test de nivel (una vez) y test de hoy (las mismas 10 para toda la oposición).
-- Ejecutar DESPUÉS de 20261016180000_modos.sql, en otra pasada del editor:
-- el valor nuevo del enum no se puede usar en la misma transacción.
-- Idempotente. No guarda IP, ni el texto de las respuestas, ni datos de pago.

alter table public.perfil_estudio
  add column if not exists nivel_omitido_en timestamptz;

create table if not exists public.test_del_dia (
  oposicion_id uuid not null references public.oposiciones (id) on delete cascade,
  dia date not null,
  preguntas text[] not null,
  primary key (oposicion_id, dia)
);

alter table public.test_del_dia enable row level security;
revoke all on public.test_del_dia from public, anon, authenticated;

-- Misma selección para todo el mundo: una pregunta de cada tema, ordenada por md5(fecha:id).
create or replace function public.preguntas_del_dia(p_oposicion uuid, p_dia date)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_preguntas text[];
begin
  select preguntas into v_preguntas
  from public.test_del_dia
  where oposicion_id = p_oposicion and dia = p_dia;
  if found then
    return v_preguntas;
  end if;

  select coalesce(array_agg(id order by turno, tema_orden, id_orden), '{}')
  into v_preguntas
  from (
    select id, turno, tema_orden, id_orden
    from (
      select p.id,
             row_number() over (
               partition by po.tema_id
               order by md5(p_dia::text || ':' || p.id)
             ) as turno,
             md5(p_dia::text || ':' || po.tema_id::text) as tema_orden,
             md5(p_dia::text || ':' || p.id) as id_orden
      from public.preguntas p
      join public.preguntas_oposiciones po
        on po.pregunta_id = p.id and po.oposicion_id = p_oposicion
      where p.estado = 'validada'
    ) s
    order by turno, tema_orden, id_orden
    limit 10
  ) t;

  if coalesce(cardinality(v_preguntas), 0) = 0 then
    return '{}';
  end if;

  insert into public.test_del_dia (oposicion_id, dia, preguntas)
  values (p_oposicion, p_dia, v_preguntas)
  on conflict (oposicion_id, dia) do nothing;

  select preguntas into v_preguntas
  from public.test_del_dia
  where oposicion_id = p_oposicion and dia = p_dia;
  return coalesce(v_preguntas, '{}');
end;
$$;

create or replace function public.omitir_nivel()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  perform public.asegurar_perfil();
  update public.perfil_estudio
  set nivel_omitido_en = coalesce(nivel_omitido_en, now())
  where usuario_id = auth.uid();
end;
$$;

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
  v_abierto uuid;
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

  if p_modo = 'nivel' then
    select i.id into v_abierto
    from intentos i
    where i.usuario_id = v_uid and i.modo = 'nivel' and not i.es_importado and i.terminado_en is null
    order by i.creado_en desc
    limit 1;
    if v_abierto is not null then
      return v_abierto;
    end if;
    if exists (
      select 1 from intentos i
      where i.usuario_id = v_uid and i.modo = 'nivel' and not i.es_importado and i.terminado_en is not null
    ) then
      raise exception 'ya_hecho' using errcode = 'P0001';
    end if;
  elsif p_modo = 'hoy' then
    select i.id into v_abierto
    from intentos i
    where i.usuario_id = v_uid and i.modo = 'hoy' and not i.es_importado
      and (i.creado_en at time zone 'Europe/Madrid')::date = v_hoy
      and i.terminado_en is null
    order by i.creado_en desc
    limit 1;
    if v_abierto is not null then
      return v_abierto;
    end if;
    if exists (
      select 1 from intentos i
      where i.usuario_id = v_uid and i.modo = 'hoy' and not i.es_importado
        and (i.creado_en at time zone 'Europe/Madrid')::date = v_hoy
        and i.terminado_en is not null
    ) then
      raise exception 'ya_hecho' using errcode = 'P0001';
    end if;
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
      where usuario_id = v_uid and not es_importado and modo in ('tema', 'leccion', 'hoy')
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
    elsif p_modo = 'nivel' then
      p_num := 10;
    elsif p_modo = 'hoy' then
      p_num := 10;
      select count(*) into v_hechos from intentos
      where usuario_id = v_uid and not es_importado and modo in ('tema', 'leccion', 'hoy')
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
  if p_modo in ('nivel', 'hoy') then
    p_num := 10;
  end if;

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
  elsif p_modo = 'nivel' then
    select coalesce(array_agg(id order by turno, azar), '{}') into v_preguntas
    from (
      select id, turno, azar
      from (
        select p.id,
               row_number() over (partition by po.tema_id order by random()) as turno,
               random() as azar
        from preguntas p
        join preguntas_oposiciones po on po.pregunta_id = p.id and po.oposicion_id = v_opo.id
        where p.estado = 'validada'
      ) s
      order by turno, azar
      limit p_num
    ) t;
  elsif p_modo = 'hoy' then
    v_preguntas := public.preguntas_del_dia(v_opo.id, v_hoy);
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
  where usuario_id = v_uid and not es_importado and modo in ('tema', 'leccion', 'hoy')
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
  'email_enviado',
  'nivel_fin',
  'nivel_salto'
));

create or replace function public.registrar_evento(
  p_tipo text,
  p_meta jsonb default '{}'::jsonb,
  p_usuario uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_meta jsonb := '{}'::jsonb;
  v_clave text;
  v_valor text;
  v_servicio boolean := auth.role() = 'service_role';
  v_propios text[] := array[
    'registro', 'onboarding_fin', 'test_inicio', 'test_fin',
    'limite_gratis', 'vista_precios', 'checkout_inicio',
    'nivel_fin', 'nivel_salto'
  ];
  v_todos text[] := v_propios || array['pago_ok', 'pago_fallido', 'cancelacion'];
begin
  if p_tipo is null or not (p_tipo = any (v_todos)) then
    raise exception 'tipo_invalido' using errcode = 'P0001';
  end if;
  if v_servicio then
    v_uid := p_usuario;
  else
    if auth.uid() is null or not (p_tipo = any (v_propios)) then
      raise exception 'no_permitido' using errcode = 'P0001';
    end if;
    v_uid := auth.uid();
  end if;
  if v_uid is null then
    return;
  end if;

  if p_tipo in ('registro', 'onboarding_fin', 'nivel_fin', 'nivel_salto') and exists (
    select 1 from public.eventos where usuario_id = v_uid and tipo = p_tipo
  ) then
    return;
  end if;

  if jsonb_typeof(p_meta) = 'object' then
    for v_clave, v_valor in
      select key, value #>> '{}'
      from jsonb_each(p_meta)
    loop
      if v_clave in ('modo', 'intento', 'motivo', 'plan', 'metodo')
         and v_valor is not null
         and length(v_valor) between 1 and 80
         and v_valor !~ '[\n\r]' then
        v_meta := v_meta || jsonb_build_object(v_clave, v_valor);
      end if;
    end loop;
  end if;

  insert into public.eventos (usuario_id, tipo, meta)
  values (v_uid, p_tipo, v_meta);
end;
$$;

revoke all on function public.preguntas_del_dia(uuid, date) from public, anon, authenticated;
revoke all on function public.omitir_nivel() from public, anon;
grant execute on function public.omitir_nivel() to authenticated;
