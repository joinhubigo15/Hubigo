import webpush from "web-push";
import { prisma } from "../lib/prisma";
import { env, pushEnabled } from "../config/env";

let configured = false;
function ensureConfigured(): boolean {
  if (!pushEnabled) return false;
  if (!configured) {
    webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
    configured = true;
  }
  return true;
}

export interface PushPayload {
  title: string;
  body?: string;
  type?: string;
  url?: string;
}

/** Sends a web-push notification to every device the user has subscribed from. Silently no-ops
 * if VAPID keys aren't configured — in-app Notification rows are the source of truth either way.
 * Dead subscriptions (device unsubscribed / browser cleared) are pruned on a 404/410 response. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}
