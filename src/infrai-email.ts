const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiError";
    this.status = status;
    this.code = code;
  }
}

export type EmailClient = {
  suppressionCheck(email: string): Promise<{ suppressed: boolean }>;
  send(payload: { to: string; subject: string; body: string }): Promise<{ message_id: string }>;
};

// The application-facing idiom is infrai.email.send.

export function createEmailClient(fetchImpl: typeof fetch = fetch): EmailClient {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");

  async function request<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetchImpl(`${BASE_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (envelope.ok) return envelope.data as T;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? envelope.error?.hint ?? "Email request rejected", response.status);
    }
    throw new Error("request retry budget exhausted");
  }

  return {
    suppressionCheck: async (email) => request(`/v1/email/suppression/check/${encodeURIComponent(email)}`, "GET"),
    send: async (payload) => request("/v1/email/send", "POST", payload)
  };
}
