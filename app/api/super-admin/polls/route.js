export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { listAllPollsWithStats } = require("../../../../lib/db");
const { getAdminFromRequest } = require("../../../../lib/session");

export async function GET(request) {
  const admin = getAdminFromRequest(request);
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const polls = await listAllPollsWithStats();
  return NextResponse.json({ polls });
}