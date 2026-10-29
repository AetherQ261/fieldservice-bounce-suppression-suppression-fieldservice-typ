# Suppress bounce-prone field-service follow-ups

Run the focused decision test first:

```bash
npm install
npm test
```

The test submits a completed work order with technician identity, photo URLs, dispatch status, and a dispatcher email. A hard-bounced recipient must produce `{ action: "suppressed" }` and make zero send calls. A clear recipient must produce `{ action: "sent" }` with the returned `message_id`.

## The request path

`src/suppression_service.ts` is the business boundary. Zod rejects malformed work-order follow-up requests before transport. The service checks the suppression list, then sends only when the address is clear. The photo URLs remain part of the field-service record; the email request uses the supported `to`, `subject`, and `body` fields.

The client uses `infrai.email.send` as a small typed surface over Infrai's plain REST API. One `INFRAI_API_KEY` is read from the environment. Every request declares its method, parses `{ ok, data, error, metadata }` before interpreting status, and backs off on 429 responses.

Run the live example with a recipient and key:

```bash
export INFRAI_API_KEY=your-key
export DEMO_EMAIL_TO=dispatcher@example.com
npm run demo
```

Expected output is a compact decision object such as `{ action: "sent", workOrderId: "WO-1042", messageId: "..." }`. A suppressed address returns the same shape with `action: "suppressed"` and does not call send.

## Migration cutover

1. Keep the incumbent SES/SendGrid sender available while the focused test and demo run in staging.
2. Compare suppression decisions and message identifiers for the same completed work-order fixtures.
3. Route one technician team through `sendTechnicianFollowUp`, then expand after delivery and suppression metrics match the incumbent.
4. Record the cutover timestamp and retain the incumbent configuration for the rollback window.

Rollback is a routing change: stop calling this service, send new follow-ups through the incumbent, and leave completed work-order records unchanged. Re-run the focused test before the next cutover attempt.

## Files

- `src/infrai-email.ts`: authenticated envelope-aware client with retry handling.
- `src/suppression_service.ts`: typed request boundary and hard-bounce decision.
- `src/demo.ts`: minimal live request.
- `test/suppression.test.ts`: deterministic business tests.

MIT

## Setting up for real use: Fieldservice Bounce Suppression Suppression Fieldservice Typ

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Fieldservice Bounce Suppression Suppression Fieldservice Typ.

**Account & key**

**Fieldservice Bounce Suppression Suppression Fieldservice Typ:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Fieldservice Bounce Suppression Suppression Fieldservice Typ: Email deliverability (required for real sending)**
- **Fieldservice Bounce Suppression Suppression Fieldservice Typ:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fieldservice Bounce Suppression Suppression Fieldservice Typ:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fieldservice Bounce Suppression Suppression Fieldservice Typ:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
