import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return apiError("Verification token is required");
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return apiError("Invalid verification token", 400);
    }

    if (record.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: record.id } });
      return apiError("Verification link has expired. Please request a new one.", 400);
    }

    // Mark email as verified
    await prisma.user.updateMany({
      where: { email: record.email },
      data: { emailVerified: true },
    });

    // Delete all verification tokens for this email
    await prisma.emailVerificationToken.deleteMany({
      where: { email: record.email },
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully. You can now sign in.",
    });
  } catch (error) {
    return apiError(`Verification failed: ${(error as Error).message}`, 500);
  }
}
