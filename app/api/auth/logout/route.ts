import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(
    new URL("https://nexa-commerce-sage.vercel.app")
  );
  response.cookies.delete("erp_token");
  response.cookies.delete("erp_user");
  return response;
}
