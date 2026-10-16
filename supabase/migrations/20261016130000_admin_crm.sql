-- Listado y ficha del CRM, y el embudo agregado. Solo service role.
-- Idempotente. Ejecutar después de 20261016120000_eventos_crm.sql.

create or replace function public.admin_embudo(
  p_desde timestamptz default null,
  p_hasta timestamptz default null,
  p_origen text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_origen text := nullif(btrim(coalesce(p_origen, '')), '');
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;

  return (
    with gente as (
      select u.id, u.created_at
      from auth.users u
      left join perfil_estudio p on p.usuario_id = u.id
      where (
        v_origen is null
        or (v_origen = 'gclid' and coalesce(p.origen->>'gclid', '') <> '')
        or (v_origen <> 'gclid' and p.origen->>'utm_source' = v_origen)
      )
    ),
    pasos(id, orden) as (
      values
        ('registro', 1),
        ('test_inicio', 2),
        ('limite_gratis', 3),
        ('vista_precios', 4),
        ('checkout_inicio', 5),
        ('pago_ok', 6)
    )
    select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'total', s.total) order by s.orden), '[]'::jsonb)
    from (
      select pa.id, pa.orden,
        case
          when pa.id = 'registro' then (
            select count(*)::int from gente g
            where (p_desde is null or g.created_at >= p_desde)
              and (p_hasta is null or g.created_at < p_hasta)
          )
          else (
            select count(distinct e.usuario_id)::int
            from eventos e
            join gente g on g.id = e.usuario_id
            where e.tipo = pa.id
              and (p_desde is null or e.creado_en >= p_desde)
              and (p_hasta is null or e.creado_en < p_hasta)
          )
        end as total
      from pasos pa
    ) s
  );
end;
$$;

create or replace function public.admin_usuarios(
  p_filtro text default 'todos',
  p_busqueda text default '',
  p_orden text default 'registro',
  p_limite int default 40,
  p_offset int default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_filtro text := coalesce(p_filtro, 'todos');
  v_q text := btrim(coalesce(p_busqueda, ''));
  v_orden text := case
    when p_orden in ('ultimo_acceso', 'tests', 'xp', 'registro') then p_orden
    else 'registro'
  end;
  v_limite int := least(greatest(coalesce(p_limite, 40), 1), 100);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_total int;
  v_filas jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;

  with cuentas as (
    select usuario_id, count(*)::int as tests
    from intentos
    where not es_importado
    group by usuario_id
  ),
  hechos as (
    select usuario_id,
      bool_or(tipo in ('test_inicio', 'test_fin')) as hizo_test,
      bool_or(tipo = 'limite_gratis') as limite,
      bool_or(tipo = 'vista_precios') as precios,
      bool_or(tipo = 'checkout_inicio') as checkout,
      bool_or(tipo = 'pago_ok') as pago,
      bool_or(tipo = 'cancelacion') as cancelo
    from eventos
    group by usuario_id
  ),
  base as (
    select
      u.id,
      u.email,
      u.created_at as registro,
      p.ultimo_acceso,
      coalesce(c.tests, 0) as tests,
      coalesce(s.plan, '') as plan,
      coalesce(s.estado, '') as estado,
      coalesce(p.racha_actual, 0) as racha,
      coalesce(p.xp_total, 0) as xp,
      (coalesce(c.tests, 0) > 0 or coalesce(h.hizo_test, false)) as hizo_test,
      coalesce(h.limite, false) as limite,
      coalesce(h.precios, false) as precios,
      coalesce(h.checkout, false) as checkout,
      (coalesce(h.pago, false) or s.estado in ('active', 'trialing', 'past_due')) as pago,
      coalesce(h.cancelo, false) as cancelo,
      s.fin_periodo
    from auth.users u
    left join perfil_estudio p on p.usuario_id = u.id
    left join suscripciones s on s.usuario_id = u.id
    left join cuentas c on c.usuario_id = u.id
    left join hechos h on h.usuario_id = u.id
    where (v_q = '' or u.email ilike '%' || replace(v_q, '%', '') || '%')
  ),
  filtrada as (
    select * from base
    where case v_filtro
      when 'sin_test' then not hizo_test
      when 'limite_sin_pago' then limite and not pago
      when 'precios_sin_pago' then (precios or checkout) and not pago
      when 'inactivos_7' then coalesce(ultimo_acceso, registro) < now() - interval '7 days'
      when 'premium_riesgo' then estado = 'past_due'
        or (estado in ('active', 'trialing') and cancelo)
        or (estado = 'canceled' and fin_periodo is not null and fin_periodo > now())
      else true
    end
  )
  select count(*)::int into v_total from filtrada;

  with cuentas as (
    select usuario_id, count(*)::int as tests
    from intentos
    where not es_importado
    group by usuario_id
  ),
  hechos as (
    select usuario_id,
      bool_or(tipo in ('test_inicio', 'test_fin')) as hizo_test,
      bool_or(tipo = 'limite_gratis') as limite,
      bool_or(tipo = 'vista_precios') as precios,
      bool_or(tipo = 'checkout_inicio') as checkout,
      bool_or(tipo = 'pago_ok') as pago,
      bool_or(tipo = 'cancelacion') as cancelo
    from eventos
    group by usuario_id
  ),
  base as (
    select
      u.id,
      u.email,
      u.created_at as registro,
      p.ultimo_acceso,
      coalesce(c.tests, 0) as tests,
      coalesce(s.plan, '') as plan,
      coalesce(s.estado, '') as estado,
      coalesce(p.racha_actual, 0) as racha,
      coalesce(p.xp_total, 0) as xp,
      (coalesce(c.tests, 0) > 0 or coalesce(h.hizo_test, false)) as hizo_test,
      coalesce(h.limite, false) as limite,
      coalesce(h.precios, false) as precios,
      coalesce(h.checkout, false) as checkout,
      (coalesce(h.pago, false) or s.estado in ('active', 'trialing', 'past_due')) as pago,
      coalesce(h.cancelo, false) as cancelo,
      s.fin_periodo
    from auth.users u
    left join perfil_estudio p on p.usuario_id = u.id
    left join suscripciones s on s.usuario_id = u.id
    left join cuentas c on c.usuario_id = u.id
    left join hechos h on h.usuario_id = u.id
    where (v_q = '' or u.email ilike '%' || replace(v_q, '%', '') || '%')
  ),
  filtrada as (
    select * from base
    where case v_filtro
      when 'sin_test' then not hizo_test
      when 'limite_sin_pago' then limite and not pago
      when 'precios_sin_pago' then (precios or checkout) and not pago
      when 'inactivos_7' then coalesce(ultimo_acceso, registro) < now() - interval '7 days'
      when 'premium_riesgo' then estado = 'past_due'
        or (estado in ('active', 'trialing') and cancelo)
        or (estado = 'canceled' and fin_periodo is not null and fin_periodo > now())
      else true
    end
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id,
    'email', f.email,
    'registro', f.registro,
    'ultimo_acceso', f.ultimo_acceso,
    'tests', f.tests,
    'plan', nullif(f.plan, ''),
    'estado', nullif(f.estado, ''),
    'racha', f.racha,
    'xp', f.xp,
    'hizo_test', f.hizo_test,
    'limite', f.limite,
    'precios', f.precios,
    'checkout', f.checkout,
    'pago', f.pago
  ) order by
    case when v_orden = 'ultimo_acceso' then f.ultimo_acceso end desc nulls last,
    case when v_orden = 'tests' then f.tests end desc,
    case when v_orden = 'xp' then f.xp end desc,
    f.registro desc
  ), '[]'::jsonb)
  into v_filas
  from (
    select * from filtrada
    order by
      case when v_orden = 'ultimo_acceso' then ultimo_acceso end desc nulls last,
      case when v_orden = 'tests' then tests end desc,
      case when v_orden = 'xp' then xp end desc,
      registro desc
    limit v_limite offset v_offset
  ) f;

  return jsonb_build_object('total', v_total, 'filas', v_filas);
end;
$$;

create or replace function public.admin_usuario(p_uid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_opo text;
  v jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;
  if not exists (select 1 from auth.users where id = p_uid) then
    return null;
  end if;

  select coalesce(oposicion, 'aux-age') into v_opo
  from perfil_estudio where usuario_id = p_uid;
  v_opo := coalesce(v_opo, 'aux-age');

  select jsonb_build_object(
    'usuario', (
      select jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'registro', u.created_at,
        'ultimo_acceso', p.ultimo_acceso,
        'origen', coalesce(p.origen, '{}'::jsonb),
        'plan', s.plan,
        'estado', s.estado,
        'fin_periodo', s.fin_periodo,
        'stripe_customer_id', s.stripe_customer_id,
        'racha', coalesce(p.racha_actual, 0),
        'xp', coalesce(p.xp_total, 0),
        'onboarding', coalesce(p.onboarding_completado, false)
      )
      from auth.users u
      left join perfil_estudio p on p.usuario_id = u.id
      left join suscripciones s on s.usuario_id = u.id
      where u.id = p_uid
    ),
    'embudo', coalesce((
      select jsonb_agg(jsonb_build_object('tipo', tipo, 'fecha', fecha) order by fecha)
      from (
        select tipo, min(creado_en) as fecha
        from eventos
        where usuario_id = p_uid
        group by tipo
      ) e
    ), '[]'::jsonb),
    'tests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id,
        'modo', modo,
        'tema', tema,
        'ley', ley,
        'nota', nota,
        'fecha', fecha,
        'duracion', duracion,
        'terminado', terminado
      ) order by fecha desc)
      from (
        select
          i.id,
          i.modo::text as modo,
          case when cardinality(i.temas) = 1 then (
            select t.numero::text || '. ' || t.titulo from temas t where t.id = i.temas[1]
          ) end as tema,
          (
            select l.nombre_corto
            from preguntas pr
            left join leyes l on l.id = pr.ley_id
            where pr.id = i.preguntas[1]
          ) as ley,
          i.puntuacion as nota,
          i.creado_en as fecha,
          coalesce(i.duracion_segundos, case when i.terminado_en is not null
            then extract(epoch from i.terminado_en - i.creado_en)::int end) as duracion,
          i.terminado_en is not null as terminado
        from intentos i
        where i.usuario_id = p_uid and not i.es_importado
        order by i.creado_en desc
        limit 40
      ) t
    ), '[]'::jsonb),
    'progreso', coalesce((
      with ultima as (
        select distinct on (r.pregunta_id) r.pregunta_id, r.acertada
        from respuestas r
        where r.usuario_id = p_uid
        order by r.pregunta_id, r.respondida_en desc
      )
      select jsonb_agg(jsonb_build_object(
        'numero', numero,
        'titulo', titulo,
        'bloque', bloque,
        'total', total,
        'vistas', vistas,
        'dominadas', dominadas
      ) order by numero)
      from (
        select t.numero, t.titulo, t.bloque,
          count(pr.id)::int as total,
          count(u.pregunta_id)::int as vistas,
          count(u.pregunta_id) filter (where u.acertada)::int as dominadas
        from temas t
        join oposiciones o on o.id = t.oposicion_id and o.slug = v_opo
        left join preguntas_oposiciones po on po.tema_id = t.id
        left join preguntas pr on pr.id = po.pregunta_id and pr.estado = 'validada'
        left join ultima u on u.pregunta_id = pr.id
        group by t.id
      ) g
    ), '[]'::jsonb),
    'falladas', coalesce((
      select jsonb_agg(fila) from (
        select jsonb_build_object(
          'id', pr.id,
          'enunciado', left(pr.enunciado, 160),
          'articulo', pr.articulo,
          'ley', coalesce(l.nombre_corto, 'Sin ley'),
          'fallos', count(*) filter (where not r.acertada)::int,
          'respuestas', count(*)::int
        ) as fila
        from respuestas r
        join preguntas pr on pr.id = r.pregunta_id
        left join leyes l on l.id = pr.ley_id
        where r.usuario_id = p_uid
        group by pr.id, pr.enunciado, pr.articulo, l.nombre_corto
        having count(*) filter (where not r.acertada) > 0
        order by count(*) filter (where not r.acertada) desc
        limit 8
      ) q
    ), '[]'::jsonb),
    'eventos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id,
        'tipo', tipo,
        'meta', meta,
        'creado_en', creado_en
      ) order by creado_en desc)
      from (
        select id, tipo, meta, creado_en
        from eventos
        where usuario_id = p_uid
        order by creado_en desc
        limit 80
      ) ev
    ), '[]'::jsonb),
    'notas', '[]'::jsonb
  ) into v;

  return v;
end;
$$;

revoke all on function public.admin_embudo(timestamptz, timestamptz, text) from public, anon, authenticated;
revoke all on function public.admin_usuarios(text, text, text, int, int) from public, anon, authenticated;
revoke all on function public.admin_usuario(uuid) from public, anon, authenticated;
grant execute on function public.admin_embudo(timestamptz, timestamptz, text) to service_role;
grant execute on function public.admin_usuarios(text, text, text, int, int) to service_role;
grant execute on function public.admin_usuario(uuid) to service_role;
