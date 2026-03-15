import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(
    new URL("http://localhost:5173")
  );
  response.cookies.delete("erp_token");
  response.cookies.delete("erp_user");
  return response;
}
