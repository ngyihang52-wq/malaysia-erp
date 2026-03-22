import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils";
import { ajAuth } from "@/lib/arcjet";
import { sendVerificationEmail } from "@/lib/email";
import prisma from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const decision = await ajAuth.protect(request);
    if (decision.isDenied()) {
      return apiError("Too many requests. Please try again later.", 429);
    }

    const { email } = await request.json();

    if (!email) {
      return apiError("Email is required");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || user.emailVerified) {
      return Response.json({
        success: true,
        message: "If that email exists and is unverified, a new verification link has been sent.",
      });
    }

    // Delete old tokens for this email
    await prisma.emailVerificationToken.deleteMany({
      where: { email },
    });

    // Create new token (24-hour expiry)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.emailVerificationToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send email (fire-and-forget)
    sendVerificationEmail(email, token).catch(console.error);

    return Response.json({
      success: true,
      message: "If that email exists and is unverified, a new verification link has been sent.",
    });
  } catch (error) {
    return apiError(`Failed to resend: ${(error as Error).message}`, 500);
  }
}
