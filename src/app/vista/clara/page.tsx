import { ClaraDice } from "@/components/mascota/bocadillo";
import { Clara, type PoseClara } from "@/components/mascota/clara";

const poses: PoseClara[] = ["hola", "feliz", "celebra", "animo", "piensa", "duerme", "premium", "senala"];

/** Todas las poses de la mascota, para revisarlas. */
export default function VistaClara() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {poses.map((p) => (
          <figure key={p} className="tarjeta flex flex-col items-center p-4">
            <Clara pose={p} className="size-28" animada={false} />
            <figcaption className="mt-2 text-sm font-bold">{p}</figcaption>
          </figure>
        ))}
      </div>
      <ClaraDice pose="hola" className="mt-8">
        ¡Hola! Soy Clara. Te acompaño en cada test.
      </ClaraDice>
    </main>
  );
}
