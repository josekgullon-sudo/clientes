import type { ReactNode } from "react";
import { PRECIOS, SITIO, TITULAR, eur } from "@/lib/sitio";

/*
 * Textos legales base. Están redactados para este servicio, pero deben revisarlos
 * un profesional antes de publicar y completarse los datos del titular (TITULAR en sitio.ts).
 */

export type TextoLegal = { titulo: string; descripcion: string; contenido: ReactNode };

const Titular = () => (
  <ul>
    <li>Titular: {TITULAR.nombre}</li>
    <li>NIF: {TITULAR.nif}</li>
    <li>Domicilio: {TITULAR.domicilio}</li>
    <li>Correo: {TITULAR.email}</li>
    <li>{TITULAR.registro}</li>
  </ul>
);

export const TEXTOS: Record<string, TextoLegal> = {
  "aviso-legal": {
    titulo: "Aviso legal",
    descripcion: "Datos del titular y condiciones de uso de la web.",
    contenido: (
      <>
        <h2>Quién está detrás de {SITIO.nombre}</h2>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio
          electrónico (LSSI), te informamos de los datos del titular de esta web:
        </p>
        <Titular />
        <h2>No somos una web oficial</h2>
        <p>
          {SITIO.nombre} es una plataforma privada de preparación de oposiciones. {SITIO.avisoNoOficial} La información
          oficial sobre convocatorias, plazos y resultados está en el BOE y en la web del INAP.
        </p>
        <h2>Contenido</h2>
        <p>
          Las preguntas se elaboran a partir de los textos consolidados publicados en el BOE y de la documentación oficial
          de Microsoft. Revisamos cada pregunta, pero pueden contener errores o quedar desfasadas por reformas legales. Si
          detectas un error, escríbenos a {TITULAR.email}. El texto oficial de la ley prevalece siempre.
        </p>
        <h2>Propiedad intelectual</h2>
        <p>
          Las preguntas, explicaciones, el diseño y el código de la web pertenecen al titular. No se pueden copiar,
          distribuir ni reutilizar sin autorización. Los textos legales citados son de dominio público.
        </p>
        <h2>Uso de la web</h2>
        <p>
          Te comprometes a usar la web de forma lícita y a no extraer de forma masiva su contenido ni compartir tu cuenta
          con otras personas.
        </p>
        <h2>Ley aplicable</h2>
        <p>Estas condiciones se rigen por la ley española.</p>
      </>
    ),
  },

  privacidad: {
    titulo: "Política de privacidad",
    descripcion: "Qué datos tratamos, para qué y cuáles son tus derechos.",
    contenido: (
      <>
        <h2>Responsable</h2>
        <Titular />
        <h2>Qué datos tratamos y para qué</h2>
        <ul>
          <li>
            <strong>Tu cuenta:</strong> correo electrónico y, si entras con Google, tu nombre. Sirven para identificarte.
            Base legal: ejecución del contrato.
          </li>
          <li>
            <strong>Tu estudio:</strong> test realizados, respuestas, tiempos y aciertos. Sirven para corregir, mostrarte
            tu progreso y repasar tus fallos. Base legal: ejecución del contrato.
          </li>
          <li>
            <strong>Pagos y facturas:</strong> nombre, dirección de facturación, NIF si lo indicas y datos de la
            suscripción. Los datos de la tarjeta los trata Stripe; nosotros no los vemos. Base legal: ejecución del
            contrato y obligaciones fiscales.
          </li>
        </ul>
        <h2>Cuánto tiempo los guardamos</h2>
        <p>
          Mientras tengas la cuenta. Si la borras, eliminamos tus datos de estudio. Los datos de facturación se conservan
          el tiempo que exige la normativa fiscal y mercantil.
        </p>
        <h2>Con quién los compartimos</h2>
        <p>Solo con los proveedores que necesitamos para dar el servicio, con contrato de encargo de tratamiento:</p>
        <ul>
          <li>Supabase (base de datos y acceso).</li>
          <li>Stripe (pagos y facturación).</li>
          <li>Vercel (alojamiento de la web).</li>
        </ul>
        <p>
          Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo. Lo hacen con las garantías
          del RGPD, como las cláusulas contractuales tipo de la Comisión Europea o el Marco de Privacidad de Datos UE-EE. UU.
        </p>
        <p>No vendemos tus datos ni los usamos para publicidad.</p>
        <h2>Tus derechos</h2>
        <p>
          Puedes acceder, rectificar, suprimir, oponerte, limitar el tratamiento y pedir la portabilidad de tus datos
          escribiendo a {TITULAR.email}. Si crees que no hemos atendido bien tu petición, puedes reclamar ante la Agencia
          Española de Protección de Datos (aepd.es).
        </p>
      </>
    ),
  },

  cookies: {
    titulo: "Política de cookies",
    descripcion: "Qué cookies usamos y para qué.",
    contenido: (
      <>
        <h2>Solo usamos lo necesario</h2>
        <p>
          {SITIO.nombre} no usa cookies de publicidad ni de análisis de terceros. Solo usamos cookies y almacenamiento
          local técnicos, imprescindibles para que la web funcione. Por eso no necesitan tu consentimiento (artículo 22.2
          de la LSSI), aunque te informamos de ellas.
        </p>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Para qué</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>sb-*-auth-token</td>
              <td>Mantener tu sesión iniciada (Supabase)</td>
              <td>Hasta que cierras sesión</td>
            </tr>
            <tr>
              <td>tema (almacenamiento local)</td>
              <td>Recordar si prefieres el modo claro u oscuro</td>
              <td>Hasta que lo borras</td>
            </tr>
            <tr>
              <td>aviso-cookies (almacenamiento local)</td>
              <td>Recordar que has visto este aviso</td>
              <td>Hasta que lo borras</td>
            </tr>
          </tbody>
        </table>
        <p>
          Al pagar, Stripe usa sus propias cookies en su página de pago para prevenir el fraude. Puedes consultarlas en la
          política de cookies de Stripe.
        </p>
        <p>
          Puedes borrar las cookies desde la configuración de tu navegador. Si borras la de sesión, tendrás que volver a
          entrar.
        </p>
        <p>Si en el futuro añadimos cookies que requieran consentimiento, te lo pediremos antes de usarlas.</p>
      </>
    ),
  },

  condiciones: {
    titulo: "Condiciones de suscripción",
    descripcion: "Precio, renovación, cancelación y desistimiento.",
    contenido: (
      <>
        <h2>Qué incluye</h2>
        <p>
          Acceso a todos los test de la oposición, repaso de fallos, simulacros y panel de progreso mientras la suscripción
          esté activa. Sin suscripción puedes usar el test de prueba y los test gratuitos por ley.
        </p>
        <h2>Precio y pago</h2>
        <ul>
          <li>Plan mensual: {eur.format(PRECIOS.mensual)} al mes.</li>
          <li>Plan anual: {eur.format(PRECIOS.anual)} al año.</li>
        </ul>
        <p>
          Los precios incluyen el IVA. El pago se hace con tarjeta a través de Stripe y recibes la factura en tu correo.
        </p>
        <h2>Renovación y cancelación</h2>
        <p>
          La suscripción se renueva automáticamente al final de cada periodo. Puedes cancelarla cuando quieras desde «Tu
          cuenta» → «Gestionar suscripción». Si cancelas, mantienes el acceso hasta el final del periodo ya pagado y no se
          te vuelve a cobrar. No hay permanencia.
        </p>
        <h2>Derecho de desistimiento</h2>
        <p>
          Como consumidor, tienes 14 días naturales desde la contratación para desistir sin dar explicaciones, escribiendo
          a {TITULAR.email}. Al tratarse de contenido digital que empiezas a usar de inmediato, al contratar te pedimos tu
          consentimiento expreso para empezar ya y que aceptes que, una vez empezado, pierdes el derecho de desistimiento
          (artículo 103.m del texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios).
        </p>
        <h2>Cambios de precio</h2>
        <p>
          Si cambiamos el precio, te avisaremos por correo al menos 30 días antes de la siguiente renovación. Si no estás de
          acuerdo, puedes cancelar antes de esa fecha.
        </p>
        <h2>Sin garantía de aprobado</h2>
        <p>
          {SITIO.nombre} es una herramienta de estudio. No garantiza aprobar la oposición. {SITIO.avisoNoOficial}
        </p>
        <h2>Contacto</h2>
        <p>Para cualquier duda sobre tu suscripción, escríbenos a {TITULAR.email}.</p>
      </>
    ),
  },
};
