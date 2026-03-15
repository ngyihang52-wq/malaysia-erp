import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { DEMO_USERS } from "@/lib/demo-users";

function handleLogin(email: string | null, password: string | null) {
  if (!email || !password) {
    return NextResponse.redirect(new URL("http://localhost:5173"), 303);
  }

  const user = DEMO_USERS.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return NextResponse.redirect(new URL("http://localhost:5173"), 303);
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.redirect(
    new URL("/dashboard", "http://localhost:3000"),
    303
  );

  response.cookies.set("erp_token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  response.cookies.set(
    "erp_user",
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }),
    {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    }
  );

  return response;
}

// GET handler — login via query params (used by NexaCommerce redirect)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const password = searchParams.get("password");
  return handleLogin(email, password);
}

// POST handler — login via form data
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    return handleLogin(email, password);
  } catch {
    return NextResponse.redirect(new URL("http://localhost:5173"), 303);
  }
}
