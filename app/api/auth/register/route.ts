import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils";
import { signToken, hashPassword } from "@/lib/auth";
import { ajAuth } from "@/lib/arcjet";
import prisma from "@/lib/db";

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

    const { org, user } = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName, slug: generateSlug(orgName) },
      });
      const user = await tx.user.create({
        data: { name, email, password: hashed, role: "ADMIN", orgId: org.id },
      });
      return { org, user };
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      orgId: org.id,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: org.id },
        org: { id: org.id, name: org.name },
      },
    });

    response.cookies.set("erp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("erp_user", JSON.stringify({
      id: user.id, name: user.name, email: user.email, role: user.role, orgId: org.id,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return apiError(`Registration failed: ${(error as Error).message}`, 500);
  }
}
