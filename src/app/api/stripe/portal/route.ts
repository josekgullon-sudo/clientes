import { NextResponse, type NextRequest } from "next/server";
import { origenWeb, stripe } from "@/lib/stripe";
import { supabaseServidor } from "@/lib/supabase/servidor";

/** Portal de cliente de Stripe: cambiar de plan, cancelar, facturas y método de pago. */
export async function POST(request: NextRequest) {
  const origen = origenWeb(request);
  const supabase = await supabaseServidor();
  const { data } = await supabase.from("suscripciones").select("stripe_customer_id").maybeSingle();
  if (!data?.stripe_customer_id) return NextResponse.redirect(`${origen}/suscripcion`, 303);

  const sesion = await stripe().billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${origen}/app/cuenta`,
    locale: "es",
  });
  return NextResponse.redirect(sesion.url, 303);
}
