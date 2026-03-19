import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ajAuth } from "@/lib/arcjet";
import { sendPasswordResetEmail } from "@/lib/email";
import { apiError } from "@/lib/utils";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  // Rate limit
  const decision = await ajAuth.protect(request);
  if (decision.isDenied()) {
    return apiError("Too many requests. Please wait before trying again.", 429);
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return apiError("Email is required.", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Always return success — never reveal if an email exists (security best practice)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Delete any existing reset tokens for this email
      await prisma.passwordResetToken.deleteMany({
        where: { email: normalizedEmail },
      });

      // Create a new 1-hour token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { email: normalizedEmail, token, expiresAt },
      });

      // Send the email (fire-and-forget — don't block response)
      sendPasswordResetEmail(normalizedEmail, token).catch((err) => {
        console.error("[forgot-password] Failed to send email:", err);
      });
    }

    // Return generic success regardless of whether user was found
    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("[forgot-password] Error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
