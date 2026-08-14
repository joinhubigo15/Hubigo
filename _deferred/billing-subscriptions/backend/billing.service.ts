import { prisma } from "../../lib/prisma";
import type { SubscriptionPlan } from "@prisma/client";

const PLAN_PRICE_INR: Record<SubscriptionPlan, number> = {
  FREE: 0,
  PRO: 999,
  PREMIUM: 2499,
  ENTERPRISE: 7999,
};

export async function getBillingOverview(userId: string) {
  const [active, history] = await Promise.all([
    prisma.subscription.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: { startsAt: "desc" } }),
    prisma.subscription.findMany({ where: { userId }, orderBy: { startsAt: "desc" }, take: 20 }),
  ]);

  return {
    activePlan: active?.plan ?? "FREE",
    activeSubscription: active,
    history,
  };
}

/**
 * No real payment gateway is configured yet (Razorpay/Stripe key needed) — this mirrors the
 * GST/MSME "mock provider" pattern already used elsewhere in this codebase (see
 * verification-provider.factory.ts): it creates a real, persisted Subscription row immediately
 * rather than actually charging a card. Swap this for a real gateway call (create order, verify
 * webhook signature, THEN create the row) once a gateway key exists — the DB shape and the
 * dashboard UI built against it don't need to change either way.
 */
export async function upgradeSubscriptionMock(userId: string, plan: SubscriptionPlan) {
  await prisma.subscription.updateMany({ where: { userId, status: "ACTIVE" }, data: { status: "CANCELLED" } });

  return prisma.subscription.create({
    data: {
      userId,
      plan,
      status: "ACTIVE",
      paymentProvider: "mock",
      paymentId: `mock_${Date.now()}`,
      startsAt: new Date(),
      expiresAt: plan === "FREE" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

export function planPriceInr(plan: SubscriptionPlan): number {
  return PLAN_PRICE_INR[plan];
}
