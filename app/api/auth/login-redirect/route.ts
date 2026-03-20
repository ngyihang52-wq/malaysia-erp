import { NextRequest, NextResponse } from "next/server";
import { signToken, comparePassword } from "@/lib/auth";
import { ajAuth } from "@/lib/arcjet";
import prisma from "@/lib/db";

const NEXA_URL = process.env.NEXA_FRONTEND_URL || "https://nexa-commerce-sage.vercel.app";
const ERP_URL = process.env.NEXTAUTH_URL_PRODUCTION || "https://nexa-erp.com";

async function handleLogin(email: string | null, password: string | null) {
  if (!email || !password) {
    return NextResponse.redirect(new URL(NEXA_URL), 303);
  }

  const user = await prisma.user.findUnique({ where: { email }, include: { org: true } });
  if (!user || !user.org.isActive) {
    return NextResponse.redirect(new URL(NEXA_URL), 303);
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return NextResponse.redirect(new URL(NEXA_URL), 303);
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    orgId: user.orgId,
  });

  const response = NextResponse.redirect(new URL("/dashboard", ERP_URL), 303);

  response.cookies.set("erp_token", token, {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7,
  });

  response.cookies.set("erp_user", JSON.stringify({
    id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId,
  }), {
    httpOnly: false, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export async function GET(request: NextRequest) {
  const decision = await ajAuth.protect(request);
  if (decision.isDenied()) return NextResponse.redirect(new URL(NEXA_URL), 303);

  const { searchParams } = new URL(request.url);
  return handleLogin(searchParams.get("email"), searchParams.get("password"));
}

export async function POST(request: NextRequest) {
  try {
    const decision = await ajAuth.protect(request);
    if (decision.isDenied()) return NextResponse.redirect(new URL(NEXA_URL), 303);

    const formData = await request.formData();
    return handleLogin(formData.get("email") as string, formData.get("password") as string);
  } catch {
    return NextResponse.redirect(new URL(NEXA_URL), 303);
  }
}
