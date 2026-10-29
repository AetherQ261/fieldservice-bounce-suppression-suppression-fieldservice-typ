import assert from "node:assert/strict";
import { test } from "node:test";
import { followUpRequest, sendTechnicianFollowUp } from "../src/suppression_service.js";

const input = followUpRequest.parse({
  workOrderId: "WO-1",
  technicianId: "tech-1",
  to: "dispatcher@example.com",
  subject: "WO-1 photos",
  body: "Photos are ready.",
  photoUrls: [],
  dispatchStatus: "complete"
});

test("a hard-bounced dispatcher is suppressed before email send", async () => {
  let sends = 0;
  const result = await sendTechnicianFollowUp(input, {
    suppressionCheck: async () => ({ suppressed: true }),
    send: async () => { sends += 1; return { message_id: "unused" }; }
  });
  assert.deepEqual(result, { action: "suppressed", workOrderId: "WO-1", reason: "hard_bounce" });
  assert.equal(sends, 0);
});

test("a clear recipient receives the work-order follow-up", async () => {
  const result = await sendTechnicianFollowUp(input, {
    suppressionCheck: async () => ({ suppressed: false }),
    send: async (payload) => ({ message_id: `sent:${payload.to}` })
  });
  assert.deepEqual(result, { action: "sent", workOrderId: "WO-1", messageId: "sent:dispatcher@example.com" });
});
