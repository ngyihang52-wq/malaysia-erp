import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("erp_token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || user.email.split("@")[0],
      orgId: user.orgId,
    },
  });
}
