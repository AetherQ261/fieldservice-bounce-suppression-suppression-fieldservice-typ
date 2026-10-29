import { createEmailClient } from "./infrai-email.js";
import { followUpRequest, sendTechnicianFollowUp } from "./suppression_service.js";

const to = process.env.DEMO_EMAIL_TO;
if (!to) throw new Error("DEMO_EMAIL_TO is required");

const request = followUpRequest.parse({
  workOrderId: "WO-1042",
  technicianId: "tech-17",
  to,
  subject: "Work order WO-1042 follow-up",
  body: "Please confirm the repair photos for WO-1042.",
  photoUrls: ["https://example.com/work-orders/WO-1042/photo-1.jpg"],
  dispatchStatus: "complete"
});

console.log(await sendTechnicianFollowUp(request, createEmailClient()));
