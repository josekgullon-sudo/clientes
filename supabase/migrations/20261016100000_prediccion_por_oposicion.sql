-- La predicción de nota usa la penalización y la escala de cada examen (formato_simulacro):
-- un tercio sobre 50 en el Auxiliar y el Administrativo, un cuarto sobre 10 en Agente de la Hacienda Pública.

create or replace function public._nota_parte(p_raw numeric, p_peso numeric, p_mitad numeric, p_escala numeric)
returns jsonb
language sql
immutable
as $$
  select case
    when p_peso <= 0 then null
    else (
      with n as (
        select round(least(p_escala, greatest(0, (p_raw / p_peso) * p_escala))::numeric, 1) as nota
      )
      select jsonb_build_object(
        'nota', nota,
        'bajo', round(greatest(0, nota - p_mitad), 1),
        'alto', round(least(p_escala, nota + p_mitad), 1)
      )
      from n
    )
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
  v_formato jsonb;
  v_pen numeric;
  v_escala numeric;
  v_parte int;
begin
  if v_uid is null then
    return jsonb_build_object('suficiente', false, 'respuestas', 0);
  end if;

  select formato_simulacro into v_formato from oposiciones where slug = v_opo;
  v_pen := coalesce((v_formato ->> 'penalizacion')::numeric, 1.0 / 3);
  v_escala := coalesce((v_formato ->> 'escala')::numeric, 50);

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
    v_puntos := v_prob - (1 - v_prob) * v_pen * 0.9;
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
    'escala', v_escala,
    'parte1', public._nota_parte(v_raw1, v_peso1, v_mitad * v_escala / 50, v_escala),
    'parte2', public._nota_parte(v_raw2, v_peso2, v_mitad * v_escala / 50, v_escala),
    'debilidades', v_debil
  );
end;
$$;

revoke execute on function public._nota_parte(numeric, numeric, numeric, numeric) from anon, public, authenticated;
