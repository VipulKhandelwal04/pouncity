import "server-only";
import webpush from "web-push";
import type { PushMessage, PushSendResult, PushSender } from "./push-sender";
import type { PushSubscription } from "./push-subscription";
import { vapidPrivateKey, vapidPublicKey, vapidSubject } from "./env";

export class WebPushSender implements PushSender {
  constructor() {
    webpush.setVapidDetails(vapidSubject(), vapidPublicKey(), vapidPrivateKey());
  }

  async send(subscription: PushSubscription, message: PushMessage): Promise<PushSendResult> {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dhKey, auth: subscription.authKey },
        },
        JSON.stringify(message),
      );
      return { ok: true, expired: false };
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      const expired = statusCode === 404 || statusCode === 410;
      return { ok: false, expired };
    }
  }
}
