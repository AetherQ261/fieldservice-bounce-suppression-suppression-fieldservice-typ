import { z } from "zod";
import type { EmailClient } from "./infrai-email.js";

export const followUpRequest = z.object({
  workOrderId: z.string().min(1),
  technicianId: z.string().min(1),
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  photoUrls: z.array(z.string().url()).max(8),
  dispatchStatus: z.enum(["assigned", "en_route", "complete"])
});

export type FollowUpRequest = z.infer<typeof followUpRequest>;

export type FollowUpResult =
  | { action: "suppressed"; workOrderId: string; reason: "hard_bounce" }
  | { action: "sent"; workOrderId: string; messageId: string };

export async function sendTechnicianFollowUp(input: FollowUpRequest, email: EmailClient): Promise<FollowUpResult> {
  const suppression = await email.suppressionCheck(input.to);
  if (suppression.suppressed) {
    return { action: "suppressed", workOrderId: input.workOrderId, reason: "hard_bounce" };
  }
  const sent = await email.send({ to: input.to, subject: input.subject, body: input.body });
  return { action: "sent", workOrderId: input.workOrderId, messageId: sent.message_id };
}
