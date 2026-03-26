import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils";
import { signToken, comparePassword } from "@/lib/auth";
import { ajAuth } from "@/lib/arcjet";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const decision = await ajAuth.protect(request);
    if (decision.isDenied()) {
      return apiError("Too many login attempts. Please try again later.", 429);
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return apiError("Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { org: true },
    });

    if (!user || !user.org.isActive) {
      return apiError("Invalid email or password", 401);
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return apiError("Invalid email or password", 401);
    }

    // Block login if trial has expired
    if (
      user.org.plan === "trial" &&
      user.org.trialEndsAt &&
      user.org.trialEndsAt < new Date()
    ) {
      return Response.json(
        {
          success: false,
          error: "Your 14-day free trial has ended. Please contact support to continue.",
          trialExpired: true,
        },
        { status: 403 }
      );
    }

    // Block login if email is not verified
    if (!user.emailVerified) {
      return Response.json(
        { success: false, error: "Please verify your email before signing in.", requiresVerification: true, email: user.email },
        { status: 403 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId },
        token,
      },
    });

    response.cookies.set("erp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("erp_user", JSON.stringify({
      id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return apiError("Internal server error", 500);
  }
}
