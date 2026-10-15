/** Referencia legal con el trazo de subrayador: «Art. 21.3 · Ley 39/2015». */
export function Cita({ articulo, ley }: { articulo: string; ley: string }) {
  // Los psicotécnicos no citan un artículo: el tipo de prueba va después de la etiqueta.
  const texto =
    ley === "Psicotécnico" ? `${ley} · ${articulo}` : `${/^art/i.test(articulo) ? articulo : `Art. ${articulo}`} · ${ley}`;
  return (
    <span className="subrayado font-sans text-[0.95rem] font-semibold whitespace-nowrap">
      {texto}
    </span>
  );
}
