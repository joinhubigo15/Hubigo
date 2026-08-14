import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { planPriceInr } from "../business-dashboard/billing.service";
import type { ListSubscriptionsQuery } from "../../schemas/admin.schema";

export async function listSubscriptions(query: ListSubscriptionsQuery) {
  const where: Prisma.SubscriptionWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.plan) where.plan = query.plan;

  const [total, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      orderBy: { startsAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const items = subscriptions.map((s) => ({
    id: s.id,
    ownerName: s.user.name,
    ownerEmail: s.user.email,
    plan: s.plan,
    status: s.status,
    paymentProvider: s.paymentProvider,
    amountInr: planPriceInr(s.plan),
    startsAt: s.startsAt.toISOString(),
    expiresAt: s.expiresAt?.toISOString() ?? null,
  }));

  return { items, total, page: query.page, pageSize: query.pageSize };
}
