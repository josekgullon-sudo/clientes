/** Referencia legal con el trazo de subrayador: «Art. 21.3 · Ley 39/2015». */
export function Cita({ articulo, ley }: { articulo: string; ley: string }) {
  const art = /^art/i.test(articulo) ? articulo : `Art. ${articulo}`;
  return (
    <span className="subrayado font-sans text-[0.95rem] font-semibold whitespace-nowrap">
      {art} · {ley}
    </span>
  );
}
