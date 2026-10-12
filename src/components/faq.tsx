export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((f) => (
        <details key={f.q} className="tarjeta group p-0">
          <summary className="cursor-pointer list-none px-5 py-4 font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-3">
              {f.q}
              <span aria-hidden className="text-pizarra transition group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="px-5 pb-4 text-pizarra">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
