export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { listClientAdmins, getAdminByEmail, createAdmin } = require("../../../../lib/db");
const { hashPassword } = require("../../../../lib/auth");
const { getAdminFromRequest } = require("../../../../lib/session");

function requireSuperAdmin(request) {
  const admin = getAdminFromRequest(request);
  if (!admin || admin.role !== "super_admin") return null;
  return admin;
}

export async function GET(request) {
  const admin = requireSuperAdmin(request);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const clients = await listClientAdmins();
  return NextResponse.json({ clients });
}

export async function POST(request) {
  const admin = requireSuperAdmin(request);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const { email, password, clientName } = await request.json();
  if (!email || !password || !clientName) {
    return NextResponse.json({ error: "Client name, email and password are required." }, { status: 400 });
  }

  const existing = await getAdminByEmail(email.toLowerCase().trim());
  if (existing) {
    return NextResponse.json({ error: "That email already has an account." }, { status: 409 });
  }

  const newId = await createAdmin({
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    role: "client_admin",
    clientName
  });

  return NextResponse.json({ ok: true, id: newId });
}