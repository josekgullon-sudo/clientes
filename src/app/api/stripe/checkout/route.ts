import { NextResponse, type NextRequest } from "next/server";
import { PLANES, origenWeb, stripe, type Plan } from "@/lib/stripe";
import { supabaseAdmin, supabaseServidor } from "@/lib/supabase/servidor";

/** Abre Stripe Checkout para el plan elegido. IVA calculado por Stripe Tax. */
export async function POST(request: NextRequest) {
  const origen = origenWeb(request);
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origen}/entrar?siguiente=/suscripcion`, 303);

  const datos = await request.formData();
  const plan = datos.get("plan") as Plan;
  const precio = PLANES[plan]?.();
  if (!precio) return NextResponse.redirect(`${origen}/suscripcion?error=plan`, 303);

  const admin = supabaseAdmin();
  const { data: fila } = await admin
    .from("suscripciones")
    .select("stripe_customer_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  let cliente = fila?.stripe_customer_id;
  if (!cliente) {
    const c = await stripe().customers.create({
      email: user.email,
      metadata: { usuario_id: user.id },
    });
    cliente = c.id;
    await admin
      .from("suscripciones")
      .upsert({ usuario_id: user.id, stripe_customer_id: cliente }, { onConflict: "usuario_id" });
  }

  const sesion = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: cliente,
    client_reference_id: user.id,
    line_items: [{ price: precio, quantity: 1 }],
    subscription_data: { metadata: { usuario_id: user.id } },
    automatic_tax: { enabled: true },
    customer_update: { address: "auto", name: "auto" },
    tax_id_collection: { enabled: true },
    billing_address_collection: "required",
    allow_promotion_codes: true,
    // Consentimiento para empezar ya y renuncia al desistimiento (contenido digital, art. 103.m TRLGDCU).
    // Requiere configurar la URL de las condiciones en el panel de Stripe.
    consent_collection: { terms_of_service: "required" },
    custom_text: {
      terms_of_service_acceptance: {
        message:
          "Acepto las condiciones de suscripción y pido acceder ya al contenido. Entiendo que, al empezar, pierdo el derecho de desistimiento.",
      },
    },
    locale: "es",
    success_url: `${origen}/app?suscripcion=ok`,
    cancel_url: `${origen}/suscripcion`,
  });

  return NextResponse.redirect(sesion.url!, 303);
}
