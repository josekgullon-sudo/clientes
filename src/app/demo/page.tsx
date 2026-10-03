import type { Metadata } from "next";
import { TestPublico } from "@/components/test/test-publico";
import { preguntasPublicas } from "@/lib/datos/publicas";

export const metadata: Metadata = {
  title: "Test de prueba de 10 preguntas",
  description: "Prueba un test del Auxiliar Administrativo del Estado sin registrarte, con la explicación de cada respuesta.",
  robots: { index: false },
};

export default async function Demo() {
  const preguntas = await preguntasPublicas("demo");
  if (preguntas.length === 0) {
    return <p className="p-6">Aún no hay preguntas de prueba. Vuelve en un rato.</p>;
  }
  return <TestPublico preguntas={preguntas} salirA="/" />;
}
