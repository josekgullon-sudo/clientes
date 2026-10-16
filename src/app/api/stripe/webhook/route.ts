import type Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { registrarEventoAdmin } from "@/lib/crm/eventos";
import { planDePrecio, stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/servidor";

/**
 * Mantiene la tabla `suscripciones` al día con Stripe.
 * Eventos a activar en Stripe: checkout.session.completed, invoice.payment_failed y customer.subscription.*.
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
        const sub = await stripe().subscriptions.retrieve(s.subscription);
        await guardar(sub, s.client_reference_id);
        const usuario = s.client_reference_id ?? sub.metadata?.usuario_id;
        if (usuario) await registrarEventoAdmin(usuario, "pago_ok", { plan: planDe(sub) });
      }
      break;
    }
    case "invoice.payment_failed": {
      const factura = evento.data.object;
      const usuario = await usuarioDeCliente(typeof factura.customer === "string" ? factura.customer : factura.customer?.id);
      if (usuario) await registrarEventoAdmin(usuario, "pago_fallido", {});
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      const sub = evento.data.object;
      await guardar(sub);
      const usuario = sub.metadata?.usuario_id ?? (await usuarioDeCliente(typeof sub.customer === "string" ? sub.customer : sub.customer.id));
      const cancela = evento.type === "customer.subscription.deleted" || sub.status === "canceled" || sub.cancel_at_period_end;
      if (usuario && cancela) await registrarEventoAdmin(usuario, "cancelacion", { plan: planDe(sub) });
      break;
    }
  }
  return NextResponse.json({ recibido: true });
}

function planDe(sub: Stripe.Subscription) {
  return planDePrecio(sub.items.data[0]?.price.id) ?? "";
}

async function usuarioDeCliente(cliente: string | null | undefined) {
  if (!cliente) return null;
  const { data } = await supabaseAdmin()
    .from("suscripciones")
    .select("usuario_id")
    .eq("stripe_customer_id", cliente)
    .maybeSingle();
  return data?.usuario_id ?? null;
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
