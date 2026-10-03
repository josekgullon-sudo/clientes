import type Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { planDePrecio, stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/servidor";

/**
 * Mantiene la tabla `suscripciones` al día con Stripe.
 * Eventos a activar en Stripe: checkout.session.completed y customer.subscription.*.
 */
export async function POST(request: NextRequest) {
  const firma = request.headers.get("stripe-signature");
  const cuerpo = await request.text();
  let evento: Stripe.Event;
  try {
    evento = stripe().webhooks.constructEvent(cuerpo, firma ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "firma no válida" }, { status: 400 });
  }

  switch (evento.type) {
    case "checkout.session.completed": {
      const s = evento.data.object;
      if (s.mode === "subscription" && typeof s.subscription === "string") {
        await guardar(await stripe().subscriptions.retrieve(s.subscription), s.client_reference_id);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await guardar(evento.data.object);
      break;
  }
  return NextResponse.json({ recibido: true });
}

async function guardar(sub: Stripe.Subscription, usuarioRef?: string | null) {
  const admin = supabaseAdmin();
  const cliente = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  let usuario = usuarioRef ?? sub.metadata?.usuario_id ?? null;
  if (!usuario) {
    const { data } = await admin
      .from("suscripciones")
      .select("usuario_id")
      .eq("stripe_customer_id", cliente)
      .maybeSingle();
    usuario = data?.usuario_id ?? null;
  }
  if (!usuario) {
    console.error(`Webhook de Stripe sin usuario para el cliente ${cliente}`);
    return;
  }

  const item = sub.items.data[0];
  const { error } = await admin.from("suscripciones").upsert(
    {
      usuario_id: usuario,
      stripe_customer_id: cliente,
      stripe_subscription_id: sub.id,
      plan: planDePrecio(item?.price.id),
      estado: sub.status,
      fin_periodo: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
      actualizada_en: new Date().toISOString(),
    },
    { onConflict: "usuario_id" },
  );
  if (error) throw new Error(`No se pudo guardar la suscripción: ${error.message}`);
}
