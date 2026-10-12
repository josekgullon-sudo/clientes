export function Racha({ dias, protectores }: { dias: number; protectores?: number }) {
  return (
    <p className="text-[1.35rem] font-semibold">
      <span className="llama" aria-hidden="true">🔥 </span>
      <span className="sr-only">Racha: </span>
      {dias} {dias === 1 ? "día" : "días"}
      {protectores !== undefined && protectores > 0 && (
        <span className="mt-0.5 block text-[0.95rem] font-medium text-pizarra">
          {protectores} {protectores === 1 ? "protector" : "protectores"} de racha
        </span>
      )}
    </p>
  );
}
