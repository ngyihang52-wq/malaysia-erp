import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils";
import { hashPassword } from "@/lib/auth";
import { ajAuth } from "@/lib/arcjet";
import { sendVerificationEmail } from "@/lib/email";
import prisma from "@/lib/db";
import crypto from "crypto";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) + "-" + Math.random().toString(36).slice(2, 7);
}

export async function POST(request: NextRequest) {
  try {
    const decision = await ajAuth.protect(request);
    if (decision.isDenied()) {
      return apiError("Too many requests. Please try again later.", 429);
    }

    const { orgName, name, email, password } = await request.json();

    if (!orgName || !name || !email || !password) {
      return apiError("All fields are required");
    }

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("An account with this email already exists", 409);
    }

    const hashed = await hashPassword(password);

    const { user } = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName, slug: generateSlug(orgName) },
      });
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashed,
          role: "ADMIN",
          orgId: org.id,
          emailVerified: false,
        },
      });
      return { org, user };
    });

    // Create verification token (24-hour expiry)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    await prisma.emailVerificationToken.create({
      data: {
        email: user.email,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email (fire-and-forget)
    sendVerificationEmail(email, verificationToken).catch(console.error);

    // Do NOT auto-login — require email verification first
    return Response.json({
      success: true,
      data: { requiresVerification: true, email: user.email },
    });
  } catch (error) {
    return apiError(`Registration failed: ${(error as Error).message}`, 500);
  }
}
