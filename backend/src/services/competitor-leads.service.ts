import { Prisma, LeadType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { notifyUser } from "./notifications.service";

const COMPETITOR_COUNT = 2;

interface RecordInteractionParams {
  businessId: string;
  userId: string | null;
  type: LeadType;
}

const DIRECT_ACTION_LABEL: Record<LeadType, string> = {
  VIEW: "viewed your business profile",
  CALL: "called your business",
  WHATSAPP: "messaged you on WhatsApp",
  EMAIL: "emailed your business",
  FORM: "filled out your contact form",
};

/**
 * Creates a Lead and, if the business has an owner, a Notification — but only once per
 * user+business(+sourceBusinessId) ever, so a visitor who views/calls/messages a business
 * repeatedly (across sessions, days, or weeks) still only ever appears once in the owner's
 * Leads CRM instead of piling up a duplicate row per visit.
 */
async function createLeadIfNotDuped(params: {
  businessId: string;
  sourceBusinessId: string | null;
  userId: string;
  type: LeadType;
  phone: string | null;
  email: string | null;
  message: string;
  ownerId: string | null;
  notificationTitle: string;
}): Promise<void> {
  const alreadyExists = await prisma.lead.findFirst({
    where: {
      businessId: params.businessId,
      sourceBusinessId: params.sourceBusinessId,
      userId: params.userId,
    },
    select: { id: true },
  });
  if (alreadyExists) return;

  await prisma.lead.create({
    data: {
      businessId: params.businessId,
      sourceBusinessId: params.sourceBusinessId,
      userId: params.userId,
      type: params.type,
      phone: params.phone,
      email: params.email,
      message: params.message,
      status: "NEW",
    },
  });

  if (params.ownerId) {
    await notifyUser(params.ownerId, "lead", params.notificationTitle, params.message);
  }
}

/**
 * When a logged-in user views/calls/WhatsApps a business:
 *  1. The business itself gets a direct lead with the visitor's contact info (the core "you got
 *     a lead" flow — works regardless of plan tier).
 *  2. If — and only if — that business is on the BASIC plan, the nearest 2 OTHER businesses
 *     sharing the same primary category AND on a paid plan (premium/elite) also get a
 *     "competitor lead" for the same visitor (sourceBusinessId set). A premium/elite business's
 *     own visitor leads are never routed to competitors — lead protection is part of what paying
 *     for the plan buys you.
 * No-ops for anonymous users (nothing to attribute to). Direct leads don't need coordinates/
 * category (every business can get its own leads); competitor routing does, since it needs to
 * find nearby same-category paid businesses.
 */
export async function recordBusinessInteraction({ businessId, userId, type }: RecordInteractionParams): Promise<void> {
  if (!userId) return;

  const [business, user] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        planTier: true,
        lat: true,
        lng: true,
        categories: { where: { isPrimary: true }, select: { categoryId: true } },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, phone: true } }),
  ]);

  if (!business || !user) return;

  await createLeadIfNotDuped({
    businessId: business.id,
    sourceBusinessId: null,
    userId,
    type,
    phone: user.phone,
    email: user.email,
    message: `${user.name} ${DIRECT_ACTION_LABEL[type]}. Here are their details.`,
    ownerId: business.ownerId,
    notificationTitle: "New lead 🎉",
  });

  // Lead protection: a premium/elite business's own visitors never get routed to competitors.
  if (business.planTier !== "basic") return;

  if (business.lat == null || business.lng == null) return;
  const primaryCategoryId = business.categories[0]?.categoryId;
  if (!primaryCategoryId) return;

  const candidates = await prisma.$queryRaw<{ id: string; owner_id: string | null; distance_km: number }[]>(Prisma.sql`
    SELECT b.id, b.owner_id,
      6371 * acos(LEAST(1, GREATEST(-1,
        cos(radians(${business.lat}::float8)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians(${business.lng}::float8))
        + sin(radians(${business.lat}::float8)) * sin(radians(b.lat))
      ))) AS distance_km
    FROM businesses b
    JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = true AND bc.category_id = ${primaryCategoryId}
    WHERE b.id != ${businessId}
      AND b.plan_tier != 'basic'::"PlanTier"
      AND b.status = 'approved'::"BusinessStatus"
      AND b.deleted_at IS NULL
      AND b.owner_id IS NOT NULL
      AND b.lat IS NOT NULL AND b.lng IS NOT NULL
    ORDER BY distance_km ASC
    LIMIT ${COMPETITOR_COUNT}
  `);

  const message = `${user.name} was checking out "${business.name}" nearby — a potential customer in your category. Here are their details.`;

  for (const candidate of candidates) {
    await createLeadIfNotDuped({
      businessId: candidate.id,
      sourceBusinessId: businessId,
      userId,
      type,
      phone: user.phone,
      email: user.email,
      message,
      ownerId: candidate.owner_id,
      notificationTitle: "New competitor lead 🎯",
    });
  }
}
