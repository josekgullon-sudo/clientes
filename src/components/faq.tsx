import { Plus } from "lucide-react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="tarjeta divide-y divide-filete">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-papel-hundido text-pizarra transition group-open:rotate-45 group-open:bg-pino-suave group-open:text-pino" aria-hidden="true">
              <Plus size={16} strokeWidth={2.6} />
            </span>
          </summary>
          <p className="px-5 pb-5 text-pizarra">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
