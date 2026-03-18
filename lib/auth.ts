import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  orgId: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const token =
    request.cookies.get("erp_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) throw new Error("Unauthorized");

  const payload = verifyToken(token);
  if (!payload || !payload.orgId) throw new Error("Unauthorized");

  return payload;
}
