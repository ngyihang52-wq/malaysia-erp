import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils";
import { requireAuth, hashPassword } from "@/lib/auth";
import { aj } from "@/lib/arcjet";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const decision = await aj.protect(request);
  if (decision.isDenied()) return apiError("Request blocked", 403);

  const auth = await requireAuth(request).catch(() => null);
  if (!auth) return apiError("Unauthorized", 401);

  const users = await prisma.user.findMany({
    where: { orgId: auth.orgId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ success: true, data: users });
}

export async function POST(request: NextRequest) {
  const decision = await aj.protect(request);
  if (decision.isDenied()) return apiError("Request blocked", 403);

  const auth = await requireAuth(request).catch(() => null);
  if (!auth) return apiError("Unauthorized", 401);
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return apiError("Only admins can create users", 403);
  }

  const { name, email, password, role } = await request.json();
  if (!name || !email || !password || !role) return apiError("All fields are required");
  if (password.length < 8) return apiError("Password must be at least 8 characters");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return apiError("An account with this email already exists", 409);

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role, orgId: auth.orgId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ success: true, data: user });
}

export async function PATCH(request: NextRequest) {
  const decision = await aj.protect(request);
  if (decision.isDenied()) return apiError("Request blocked", 403);

  const auth = await requireAuth(request).catch(() => null);
  if (!auth) return apiError("Unauthorized", 401);
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return apiError("Only admins can update users", 403);
  }

  const { userId, name, role } = await request.json();
  if (!userId) return apiError("userId is required");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.orgId !== auth.orgId) return apiError("User not found", 404);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { ...(name && { name }), ...(role && { role }) },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest) {
  const decision = await aj.protect(request);
  if (decision.isDenied()) return apiError("Request blocked", 403);

  const auth = await requireAuth(request).catch(() => null);
  if (!auth) return apiError("Unauthorized", 401);
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return apiError("Only admins can remove users", 403);
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return apiError("userId is required");
  if (userId === auth.userId) return apiError("Cannot remove yourself", 400);

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.orgId !== auth.orgId) return apiError("User not found", 404);

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true, data: { deleted: true } });
}
