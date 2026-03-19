import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return apiError("Token and password are required.", 400);
    }

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters.", 400);
    }

    // Find the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return apiError("Invalid or expired reset link.", 400);
    }

    // Check expiry
    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return apiError(
        "This reset link has expired. Please request a new one.",
        400
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return apiError("Account not found.", 404);
    }

    // Hash new password and update user
    const hashedPassword = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      // Delete all reset tokens for this email
      prisma.passwordResetToken.deleteMany({
        where: { email: resetToken.email },
      }),
      // Invalidate all existing sessions so user must re-login
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("[reset-password] Error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}

// GET — validate token (used by the page on load to show an error early)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return apiError("Token is required.", 400);
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return apiError("Invalid or expired reset link.", 400);
  }

  return NextResponse.json({ valid: true, email: resetToken.email });
}
