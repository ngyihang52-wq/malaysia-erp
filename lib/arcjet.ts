/**
 * Arcjet Security — Bot detection, rate limiting, attack protection
 * Shared instance used across all API routes
 *
 * When ARCJET_KEY is not set, a passthrough mock is used so the app
 * works without Arcjet configured (useful for dev / initial deploy).
 * Set ARCJET_KEY in Vercel env vars to enable full protection.
 */
import arcjet, { shield, fixedWindow, detectBot } from "@arcjet/next";
import { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ArcjetInstance = { protect: (req: NextRequest) => Promise<{ isDenied: () => boolean }> };

function makeMock(): ArcjetInstance {
  return { protect: async () => ({ isDenied: () => false }) };
}

function makeReal(key: string, rules: Parameters<typeof arcjet>[0]["rules"]): ArcjetInstance {
  return arcjet({ key, characteristics: ["ip.src"], rules });
}

const KEY = process.env.ARCJET_KEY;

// Main protection — applied to all API routes
export const aj: ArcjetInstance = KEY
  ? makeReal(KEY, [
      shield({ mode: "LIVE" }),
      fixedWindow({ mode: "LIVE", window: "1m", max: 100 }),
      detectBot({
        mode: "LIVE",
        allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
      }),
    ])
  : makeMock();

// Stricter rate limit for auth routes (login, signup)
export const ajAuth: ArcjetInstance = KEY
  ? makeReal(KEY, [
      shield({ mode: "LIVE" }),
      fixedWindow({ mode: "LIVE", window: "5m", max: 15 }),
      detectBot({ mode: "LIVE", allow: [] }),
    ])
  : makeMock();

// Stricter rate limit for sync routes (expensive operations)
export const ajSync: ArcjetInstance = KEY
  ? makeReal(KEY, [
      shield({ mode: "LIVE" }),
      fixedWindow({ mode: "LIVE", window: "1m", max: 10 }),
      detectBot({ mode: "LIVE", allow: [] }),
    ])
  : makeMock();
