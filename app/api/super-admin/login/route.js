export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getAdminByEmailAndRole } = require("../../../../lib/db");
const { verifyPassword, signAdminToken } = require("../../../../lib/auth");

export async function POST(request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const admin = await getAdminByEmailAndRole(email.toLowerCase().trim(), "super_admin");
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return NextResponse.json({ error: "Those details don't match a super admin account." }, { status: 401 });
  }

  const token = signAdminToken(admin);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("medsam_admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return res;
}