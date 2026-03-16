/**
 * Arcjet Security — Bot detection, rate limiting, attack protection
 * Shared instance used across all API routes
 */
import arcjet, { shield, fixedWindow, detectBot } from "@arcjet/next";

// Main protection — applied to all API routes
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["ip.src"],
  rules: [
    // Shield — blocks SQL injection, XSS, and other common attacks
    shield({ mode: "LIVE" }),

    // Rate limiting — 100 requests per minute per IP
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 100,
    }),

    // Bot detection — block automated scripts and AI scrapers
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",   // Allow Google, Bing crawlers
        "CATEGORY:MONITOR",          // Allow uptime monitors
        "CATEGORY:PREVIEW",          // Allow link preview bots (Slack, Discord)
      ],
    }),
  ],
});

// Stricter rate limit for auth routes (login, signup)
export const ajAuth = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    fixedWindow({
      mode: "LIVE",
      window: "5m",
      max: 15, // Only 15 login attempts per 5 minutes
    }),
    detectBot({
      mode: "LIVE",
      allow: [],
    }),
  ],
});

// Stricter rate limit for sync routes (expensive operations)
export const ajSync = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 10, // Only 10 sync requests per minute
    }),
    detectBot({
      mode: "LIVE",
      allow: [],
    }),
  ],
});
