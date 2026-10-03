import "server-only";
import Stripe from "stripe";

let cliente: Stripe | null = null;

export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Falta STRIPE_SECRET_KEY");
  cliente ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return cliente;
}

export const PLANES = {
  mensual: () => process.env.STRIPE_PRICE_MENSUAL,
  anual: () => process.env.STRIPE_PRICE_ANUAL,
} as const;

export type Plan = keyof typeof PLANES;

export function planDePrecio(priceId: string | undefined): Plan | null {
  if (!priceId) return null;
  if (priceId === PLANES.mensual()) return "mensual";
  if (priceId === PLANES.anual()) return "anual";
  return null;
}

export function origenWeb(request: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
}
