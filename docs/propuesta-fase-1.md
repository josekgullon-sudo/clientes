# Propuesta: identidad visual y plan de la fase 1

Estado: **pendiente de confirmación**. No se programa nada hasta que se apruebe.

## 1. Idea de identidad: «el temario subrayado»

Nada de SaaS genérico. La referencia es el material real de un opositor: el papel
del temario, la tinta, el subrayador y el lápiz del margen. La web se parece más a
un cuaderno de estudio bien ordenado que a un panel de control.

Reglas visuales que salen de esa idea:

- **Sin tarjetas con sombra.** Las secciones se separan con filetes finos (1 px),
  como en un documento. Radio de esquina pequeño (6 px), no píldoras.
- **Subrayado como marca.** La cita de la ley («Art. 21.3 · Ley 39/2015») aparece
  siempre con un trazo de subrayador ocre detrás. Es el gesto que se repite en
  toda la web: la home, la corrección y las páginas SEO.
- **Progreso como regla graduada.** En el test, la barra de avance es una fila de
  marcas, una por pregunta, que se van rellenando. Se lee de un vistazo cuánto falta.
- **Nota al margen.** La explicación de cada pregunta se muestra como una nota con
  un filete vertical a la izquierda, como una anotación en el margen del temario.
- **Sin degradados ni ilustraciones de relleno.** El color se reserva para
  significar algo: acierto, fallo, cita legal, acción principal.

## 2. Paleta (6 colores)

| Token        | Claro     | Oscuro    | Uso                                              |
|--------------|-----------|-----------|--------------------------------------------------|
| `papel`      | `#F6F2EA` | `#15191B` | Fondo. Blanco roto cálido, cansa menos la vista. |
| `tinta`      | `#1D2A31` | `#E8E3D8` | Texto principal y botón principal.               |
| `pizarra`    | `#56626A` | `#9EA8AE` | Texto secundario, filetes, estados inactivos.    |
| `pino`       | `#2E6A4E` | `#6FBF97` | Acierto y progreso.                              |
| `teja`       | `#A64B34` | `#E08C74` | Fallo, en tono cálido y suave, nunca rojo alarma.|
| `subrayador` | `#E9C25B` | `#8A6A1C` | Citas legales, resaltado, foco visible.          |

Fondos derivados para estados: acierto `#E3EFE7` / `#1C2E25`, fallo `#F5E4DD` / `#35211B`.
Todos los pares texto/fondo se comprobarán con AA (4,5:1 en texto normal) antes de
darlos por buenos. El foco del teclado es un contorno de 3 px en `tinta` con halo
`subrayador`, visible en ambos modos.

## 3. Tipografías (Google Fonts, autoalojadas con `next/font`)

- **Source Serif 4** para enunciados, explicaciones y textos legales. Serifa de
  lectura larga, con aire de documento oficial sin ser antigua.
  Cuerpo 18 px en móvil, interlineado 1,6, ancho máximo 65 caracteres.
- **Atkinson Hyperlegible Next** para interfaz, opciones y botones. Diseñada para
  máxima legibilidad (distingue bien 1/l/I, 0/O), coherente con el objetivo de
  accesibilidad. Opciones a 17 px.
- Cifras tabulares en contadores, tiempo y porcentajes para que no «bailen».

## 4. Wireframes (móvil, 380 px)

### Home

```
┌──────────────────────────────────────┐
│ [Nombre]                    Entrar   │
│──────────────────────────────────────│
│                                      │
│  Aprueba el Auxiliar                 │
│  Administrativo del Estado.          │
│                                      │
│  Test con la explicación de cada     │
│  respuesta y el artículo exacto      │
│  de la ley.                          │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │   Hacer un test de 10 preguntas  │ │  ← tinta, a lo ancho
│ └──────────────────────────────────┘ │
│  Sin registro. Unos 5 minutos.       │
│                                      │
│──────────────────────────────────────│
│  Así se corrige cada pregunta        │
│                                      │
│  ¿Plazo máximo para resolver si la   │
│  norma no fija otro?                 │
│  ✓ Tres meses                        │  ← fondo pino suave
│  ▍ La norma reguladora no puede      │
│  ▍ fijar más de seis meses salvo...  │  ← nota al margen
│  ▍ ▓Art. 21.3 · Ley 39/2015▓         │  ← subrayador
│──────────────────────────────────────│
│  Qué incluye                         │
│  01  Test por tema y mezclados       │
│  02  Repaso de tus fallos            │
│  03  Simulacros con el formato real  │
│  04  Tu progreso por tema            │
│──────────────────────────────────────│
│  Precio                              │
│  Mensual   X €/mes                   │
│  Anual     Y €/año   (ahorras Z %)   │
│  [ Empezar ]                         │
│──────────────────────────────────────│
│  Test gratis por ley                 │
│  Constitución · Ley 39/2015 · ...    │
│──────────────────────────────────────│
│  No somos una plataforma oficial ni  │
│  estamos vinculados al INAP.         │
│  Aviso legal · Privacidad · Cookies  │
└──────────────────────────────────────┘
```

Lista numerada con filetes en lugar de la típica rejilla de tres tarjetas con iconos.

### Pantalla de test (respondiendo)

```
┌──────────────────────────────────────┐
│ ✕           7 de 20          12:40   │  ← salir · posición · tiempo (solo simulacro)
│ ▮▮▮▮▮▮▯▯▯▯▯▯▯▯▯▯▯▯▯▯                 │  ← regla graduada
│                                      │
│ Tema 3 · Ley 39/2015                 │  ← pizarra, pequeño
│                                      │
│ Según la Ley 39/2015, ¿cuál es el    │
│ plazo máximo para notificar la       │  ← serifa 18 px
│ resolución expresa cuando la norma   │
│ reguladora no fija otro?             │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ A  Un mes                        │ │  ← bloques de 56 px mín.
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ B  Tres meses                    │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ C  Seis meses                    │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ D  Diez días                     │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Siguiente                     →  │ │  ← fijo abajo, zona del pulgar
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

- Sin menú, sin banners, sin pie de página.
- «Siguiente» está desactivado hasta elegir opción (en simulacro se puede dejar en blanco).
- Teclado: 1-4 o A-D para elegir, Intro para seguir.

### Pantalla de test (corrección inmediata, modo estudio)

```
│ ┌──────────────────────────────────┐ │
│ │ A  Un mes                    ✕   │ │  ← teja suave (tu respuesta)
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ B  Tres meses                ✓   │ │  ← pino suave
│ └──────────────────────────────────┘ │
│   ...                                │
│ ▍ Es la B. Si la norma no fija       │
│ ▍ plazo, este será de tres meses.    │
│ ▍ «...el plazo máximo será de tres   │
│ ▍ meses.»                            │
│ ▍ ▓Art. 21.3 · Ley 39/2015▓          │
│                                      │
│ [ Siguiente → ]                      │
```

Tono: «Es la B» y el motivo. Nunca «¡Incorrecto!».

## 5. Plan de la fase 1

Cada paso es uno o varios commits pequeños y se revisa a 380 px antes de cerrarlo.

1. **Base del proyecto.** Next.js (App Router) + TypeScript + Tailwind; tokens de
   color, tipografías, modo oscuro (sistema + interruptor), foco visible,
   `prefers-reduced-motion`. Página de muestra con los componentes base.
2. **Base de datos.** Migraciones de Supabase con el modelo de datos, RLS por
   usuario en `intentos`, `respuestas` y `suscripciones`, y semilla con la
   oposición y los temas del Auxiliar AGE.
3. **Banco de preguntas.** Esquema con Zod y los cuatro scripts
   (`validar-formato`, `duplicados`, `estadisticas`, `importar`).
   Primer lote: Constitución y Ley 39/2015 (necesarios para demo y SEO).
4. **Motor de test + demo pública.** Pantalla de test, corrección y resumen final;
   la demo de 10 preguntas de la landing funciona sin registro.
5. **Cuentas.** Enlace mágico y Google con Supabase Auth.
6. **Modos de test.** Por tema, mezclando temas, falladas y simulacro con formato
   configurable (nº de preguntas, tiempo, penalización).
7. **Progreso.** Acierto por tema, temas flojos y racha de días.
8. **Pagos.** Stripe Checkout (mensual y anual), portal de cliente, webhooks,
   IVA con Stripe Tax y bloqueo del contenido sin suscripción.
9. **SEO.** Páginas «Test de la Ley 39/2015», «Test de la Constitución»… con 10
   preguntas gratis, metadatos y datos estructurados.
10. **Legal.** Aviso legal, privacidad, condiciones, banner de cookies y aviso
    de que no es una plataforma oficial.

## 6. Decisiones pendientes

- Nombre del producto (y dominio, si ya lo hay).
- Precios mensual y anual.
- Formato del simulacro: propongo tomarlo de la última convocatoria publicada en
  el BOE y dejarlo configurable por oposición.
- Textos del BOE para `/fuentes`: desde este entorno no hay acceso a boe.es.
- Cuentas de Supabase, Stripe y Vercel: se trabaja con variables de entorno y
  hacen falta las claves para probar de extremo a extremo.
