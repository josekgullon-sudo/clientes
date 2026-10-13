-- Perfil público (alias y avatar), liga semanal por XP y cofre diario.
-- El alias y el avatar por defecto se derivan del id, así nadie aparece con su correo.

alter table perfil_estudio
  add column if not exists alias text,
  add column if not exists avatar text,
  add column if not exists en_liga boolean not null default true;

create table if not exists cofres_diarios (
  usuario_id uuid references auth.users (id) on delete cascade,
  dia date not null,
  xp int not null,
  abierto_en timestamptz not null default now(),
  primary key (usuario_id, dia)
);

alter table cofres_diarios enable row level security;
drop policy if exists "ver los míos" on cofres_diarios;
create policy "ver los míos" on cofres_diarios for select using (usuario_id = auth.uid());
revoke all on cofres_diarios from anon, authenticated;
grant select on cofres_diarios to authenticated;

insert into logros (catalogo_id, nombre, descripcion, icono, orden) values
  ('primer-cofre', 'Primer cofre', 'Has abierto tu primer cofre diario.', 'cofre', 15),
  ('cofres-7', 'Coleccionista', 'Has abierto siete cofres diarios.', 'cofre', 75),
  ('liga-podio', 'Podio', 'Has estado entre los tres primeros de tu liga.', 'liga', 105)
on conflict (catalogo_id) do nothing;

-- Mismo orden que AVATARES en src/lib/estudio/perfil.ts.
create or replace function public._avatares()
returns text[]
language sql
immutable
as $$
  select array['zorro', 'panda', 'buho', 'tortuga', 'pinguino', 'leon', 'koala', 'rana', 'tigre', 'conejo', 'oso', 'pulpo'];
$$;

-- El alias por defecto nombra al animal del avatar: «Zorro Tenaz», «Búho Veloz»…
create or replace function public._alias_defecto(p_uid uuid, p_avatar text)
returns text
language sql
immutable
as $$
  select
    (array['Zorro', 'Panda', 'Búho', 'Tortuga', 'Pingüino', 'León', 'Koala', 'Rana', 'Tigre', 'Conejo', 'Oso', 'Pulpo'])
      [coalesce(array_position(public._avatares(), p_avatar), 1)]
    || ' '
    || (array['Tenaz', 'Veloz', 'Audaz', 'Constante', 'Valiente', 'Brillante', 'Paciente', 'Alegre', 'Firme', 'Feliz', 'Capaz', 'Genial'])
      [1 + abs(hashtext(reverse(p_uid::text))) % 12];
$$;

create or replace function public._avatar_defecto(p_uid uuid)
returns text
language sql
immutable
as $$
  select (public._avatares())[1 + abs(hashtext(p_uid::text || 'a')) % 12];
$$;

create or replace function public.mi_perfil_publico()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_p perfil_estudio%rowtype;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  perform public.asegurar_perfil();
  select * into v_p from perfil_estudio where usuario_id = v_uid;
  return jsonb_build_object(
    'alias', coalesce(v_p.alias, public._alias_defecto(v_uid, coalesce(v_p.avatar, public._avatar_defecto(v_uid)))),
    'avatar', coalesce(v_p.avatar, public._avatar_defecto(v_uid)),
    'en_liga', v_p.en_liga,
    'personalizado', v_p.alias is not null
  );
end;
$$;

create or replace function public.guardar_perfil_publico(p_alias text, p_avatar text, p_en_liga boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alias text := nullif(btrim(regexp_replace(coalesce(p_alias, ''), '\s+', ' ', 'g')), '');
begin
  if auth.uid() is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  if v_alias is not null and (char_length(v_alias) not between 3 and 20 or v_alias !~ '^[[:alnum:]áéíóúüñÁÉÍÓÚÜÑ ._-]+$') then
    raise exception 'alias_invalido' using errcode = 'P0001';
  end if;
  if p_avatar is not null and not (p_avatar = any (public._avatares())) then
    raise exception 'avatar_invalido' using errcode = 'P0001';
  end if;
  perform public.asegurar_perfil();
  update perfil_estudio set
    alias = v_alias,
    avatar = coalesce(p_avatar, avatar),
    en_liga = coalesce(p_en_liga, en_liga)
  where usuario_id = auth.uid();
end;
$$;

-- Clasificación de la semana (lunes a domingo, hora de Madrid) por XP ganada.
-- Devuelve los 30 primeros y, si no está entre ellos, la fila de quien consulta.
create or replace function public.liga_semanal()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_lunes date := date_trunc('week', now() at time zone 'Europe/Madrid')::date;
  v_desde timestamptz := v_lunes::timestamp at time zone 'Europe/Madrid';
  v_res jsonb;
  v_pos int;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  perform public.asegurar_perfil();

  with xp as (
    select usuario_id, sum(xp)::int as xp
    from eventos_xp
    where creado_en >= v_desde
    group by usuario_id
  ),
  base as (
    select
      p.usuario_id,
      coalesce(x.xp, 0) as xp,
      coalesce(p.alias, public._alias_defecto(p.usuario_id, coalesce(p.avatar, public._avatar_defecto(p.usuario_id)))) as alias,
      coalesce(p.avatar, public._avatar_defecto(p.usuario_id)) as avatar,
      p.racha_actual
    from perfil_estudio p
    left join xp x on x.usuario_id = p.usuario_id
    where (p.en_liga and coalesce(x.xp, 0) > 0) or p.usuario_id = v_uid
  ),
  orden as (
    select *, row_number() over (order by xp desc, racha_actual desc, usuario_id) as pos from base
  )
  select
    jsonb_build_object(
      'inicio', v_lunes,
      'fin', v_lunes + 6,
      'participantes', count(*),
      'filas', coalesce(jsonb_agg(jsonb_build_object(
        'pos', pos,
        'alias', alias,
        'avatar', avatar,
        'xp', xp,
        'racha', racha_actual,
        'yo', usuario_id = v_uid
      ) order by pos) filter (where pos <= 30 or usuario_id = v_uid), '[]'::jsonb)
    ),
    max(pos) filter (where usuario_id = v_uid)
  into v_res, v_pos
  from orden;

  if v_pos is not null and v_pos <= 3
    and exists (select 1 from eventos_xp where usuario_id = v_uid and creado_en >= v_desde)
    and (select count(*) from perfil_estudio where en_liga) >= 5 then
    perform public._conceder_logro(v_uid, 'liga-podio');
  end if;

  return v_res || jsonb_build_object('mi_posicion', v_pos);
end;
$$;

-- Cofre del día: se abre una vez al cumplir las dos misiones diarias y da XP extra.
create or replace function public.abrir_cofre()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
  v_objetivo int;
  v_act actividad_diaria%rowtype;
  v_xp int;
  v_logros text[] := '{}';
  v_n int;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  perform public.asegurar_perfil();

  select xp into v_xp from cofres_diarios where usuario_id = v_uid and dia = v_hoy;
  if found then
    return jsonb_build_object('xp', v_xp, 'ya_abierto', true, 'logros', '[]'::jsonb);
  end if;

  select objetivo_diario into v_objetivo from perfil_estudio where usuario_id = v_uid;
  select * into v_act from actividad_diaria where usuario_id = v_uid and dia = v_hoy;
  if coalesce(v_act.preguntas, 0) < v_objetivo or coalesce(v_act.aciertos, 0) < ceil(v_objetivo * 0.7) then
    raise exception 'cofre_cerrado' using errcode = 'P0001';
  end if;

  v_xp := (array[10, 15, 15, 20, 20, 25, 30, 50])[1 + floor(random() * 8)::int];

  insert into cofres_diarios (usuario_id, dia, xp) values (v_uid, v_hoy, v_xp);
  update perfil_estudio set xp_total = xp_total + v_xp where usuario_id = v_uid;
  update actividad_diaria set xp = xp + v_xp where usuario_id = v_uid and dia = v_hoy;
  insert into eventos_xp (usuario_id, motivo, xp) values (v_uid, 'cofre', v_xp);

  select count(*) into v_n from cofres_diarios where usuario_id = v_uid;
  if public._conceder_logro(v_uid, 'primer-cofre') then
    v_logros := v_logros || 'primer-cofre'::text;
  end if;
  if v_n >= 7 and public._conceder_logro(v_uid, 'cofres-7') then
    v_logros := v_logros || 'cofres-7'::text;
  end if;

  return jsonb_build_object('xp', v_xp, 'ya_abierto', false, 'logros', to_jsonb(v_logros));
end;
$$;

revoke all on function public._avatares, public._alias_defecto(uuid, text), public._avatar_defecto from public, anon;
revoke all on function public.mi_perfil_publico, public.guardar_perfil_publico, public.liga_semanal, public.abrir_cofre from public, anon;
grant execute on function public.mi_perfil_publico, public.guardar_perfil_publico, public.liga_semanal, public.abrir_cofre to authenticated;
