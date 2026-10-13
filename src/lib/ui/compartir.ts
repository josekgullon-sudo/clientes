/**
 * Comparte una tarjeta con imagen (/api/tarjeta). En el móvil abre el menú de compartir con la imagen;
 * donde no se pueden compartir archivos, comparte el texto o lo copia.
 */
export async function compartirTarjeta(
  tipo: "racha" | "reto",
  n: number,
  texto: string,
  ruta: string,
): Promise<"compartido" | "copiado" | "cancelado"> {
  const url = `${window.location.origin}${ruta}`;
  try {
    const r = await fetch(`/api/tarjeta?tipo=${tipo}&n=${n}`);
    const archivo = new File([await r.blob()], `oposiciones-claras-${tipo}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ files: [archivo], text: `${texto} ${url}` });
      return "compartido";
    }
    if (navigator.share) {
      await navigator.share({ text: texto, url });
      return "compartido";
    }
    await navigator.clipboard.writeText(`${texto} ${url}`);
    return "copiado";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "cancelado";
    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      return "copiado";
    } catch {
      return "cancelado";
    }
  }
}
