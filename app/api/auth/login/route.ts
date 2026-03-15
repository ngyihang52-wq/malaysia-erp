import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils";
import { signToken } from "@/lib/auth";
import { DEMO_USERS } from "@/lib/demo-users";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return apiError("Email and password are required");
    }

    const user = DEMO_USERS.find((u) => u.email === email && u.password === password);

    if (!user) {
      return apiError("Invalid email or password", 401);
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
      },
    });

    // httpOnly token for API auth
    response.cookies.set("erp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    // readable user cookie for client-side display
    response.cookies.set("erp_user", JSON.stringify({
      id: user.id, name: user.name, email: user.email, role: user.role,
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
