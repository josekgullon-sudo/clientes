-- Agregados del panel /admin. Solo los ejecuta el service role.
-- Lee las tablas reales: intentos, actividad_diaria, respuestas, preguntas y leyes.

create or replace function public.resumen_admin()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'tests_por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', dia::text, 'total', total))
      from (
        select (terminado_en at time zone 'Europe/Madrid')::date as dia,
               count(*)::int as total
        from intentos
        where terminado_en is not null
          and terminado_en >= now() - interval '30 days'
        group by 1
      ) s
    ), '[]'::jsonb),
    'activos_7d', (
      select count(*)::int from (
        select usuario_id from actividad_diaria
        where dia >= ((now() at time zone 'Europe/Madrid')::date - 6)
        union
        select usuario_id from intentos
        where coalesce(terminado_en, creado_en) >= now() - interval '7 days'
      ) u
    ),
    'fallos', coalesce((
      select jsonb_agg(fila) from (
        select jsonb_build_object(
          'id', p.id,
          'fallos', count(*) filter (where not r.acertada)::int,
          'respuestas', count(*)::int,
          'enunciado', left(p.enunciado, 160),
          'articulo', p.articulo,
          'ley', coalesce(l.nombre_corto, 'Sin ley')
        ) as fila
        from respuestas r
        join preguntas p on p.id = r.pregunta_id
        left join leyes l on l.id = p.ley_id
        group by p.id, p.enunciado, p.articulo, l.nombre_corto
        having count(*) filter (where not r.acertada) > 0
        order by count(*) filter (where not r.acertada) desc, p.id
        limit 10
      ) q
    ), '[]'::jsonb),
    'por_ley', coalesce((
      select jsonb_agg(jsonb_build_object(
        'ley', ley,
        'respuestas', respuestas,
        'usuarios', usuarios
      ))
      from (
        select coalesce(l.nombre_corto, 'Sin ley') as ley,
               count(*)::int as respuestas,
               count(distinct r.usuario_id)::int as usuarios
        from respuestas r
        join preguntas p on p.id = r.pregunta_id
        left join leyes l on l.id = p.ley_id
        group by 1
      ) q
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.resumen_admin() from public;
revoke all on function public.resumen_admin() from anon, authenticated;
grant execute on function public.resumen_admin() to service_role;
