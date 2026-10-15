import { LlamaRacha } from "@/components/test/llama-racha";

/** La llama de aciertos seguidos en cada tamaño, para revisarla. */
export default function VistaLlama() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <ul className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map((n) => (
          <li key={n} className="tarjeta grid h-24 place-items-center">
            <LlamaRacha combo={n} />
          </li>
        ))}
      </ul>
    </main>
  );
}
