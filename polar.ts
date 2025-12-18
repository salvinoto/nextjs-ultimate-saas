import { Polar } from "@polar-sh/sdk";

const globalForPolar = globalThis as unknown as {
  polar: Polar | undefined;
};

function createPolarClient(): Polar | null {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  
  if (!accessToken) {
    return null;
  }

  return new Polar({
    accessToken,
    server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
    debugLogger: process.env.NODE_ENV === "development" ? console : undefined,
  });
}

function getPolarClient(): Polar {
  if (!globalForPolar.polar) {
    const client = createPolarClient();
    if (!client) {
      throw new Error("Polar not configured. Please complete the setup wizard.");
    }
    globalForPolar.polar = client;
  }
  return globalForPolar.polar;
}

// Lazy proxy that only initializes Polar when first accessed
export const polar = new Proxy({} as Polar, {
  get(_, prop) {
    const client = getPolarClient();
    const value = client[prop as keyof Polar];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export function isPolarConfigured(): boolean {
  return !!process.env.POLAR_ACCESS_TOKEN;
}
