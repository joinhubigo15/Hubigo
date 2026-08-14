import { prisma } from "../lib/prisma";
import { sendPushToUser } from "./push.service";

/** Central entry point for anything that needs to notify a user: writes the in-app Notification
 * row and best-effort fires a browser push alongside it. Use this instead of calling
 * prisma.notification.create directly so push stays in sync with every notification source. */
export async function notifyUser(
  userId: string,
  type: string,
  title: string,
  body?: string,
  url?: string
) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body },
  });

  sendPushToUser(userId, { title, body, type, url }).catch(() => {});

  return notification;
}
