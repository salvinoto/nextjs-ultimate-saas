import { Resend } from "resend";

const globalForResend = globalThis as unknown as {
  resend: Resend | undefined;
};

function createResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY || "re_123";
  return new Resend(apiKey);
}

function getResendClient(): Resend {
  if (!globalForResend.resend) {
    globalForResend.resend = createResendClient();
  }
  return globalForResend.resend;
}

// Lazy proxy that only initializes Resend when first accessed
export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    const client = getResendClient();
    const value = client[prop as keyof Resend];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export function isEmailConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY;
  return !!apiKey && apiKey !== "re_123";
}
