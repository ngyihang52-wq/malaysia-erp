import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { DEMO_USERS } from "@/lib/demo-users";

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

  const demoUser = DEMO_USERS.find((u) => u.id === payload.userId);

  return NextResponse.json({
    success: true,
    data: {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      name: demoUser?.name || payload.email.split("@")[0],
    },
  });
}
