import type { PushSubscription } from "./push-subscription";

export interface PushMessage {
  title: string;
  body: string;
  url: string;
}

export interface PushSendResult {
  ok: boolean;
  /** True when the push service says this subscription is gone for good
   * (404/410) — the caller should delete it rather than retry later. */
  expired: boolean;
}

export interface PushSender {
  send(subscription: PushSubscription, message: PushMessage): Promise<PushSendResult>;
}
