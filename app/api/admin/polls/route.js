export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { listPollsForAdmin, createPoll } = require("../../../../lib/db");
const { getAdminFromRequest } = require("../../../../lib/session");

export async function GET(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const polls = await listPollsForAdmin(admin.sub);
  return NextResponse.json({ polls });
}

export async function POST(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const { name } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Give the poll a name." }, { status: 400 });
  }

  const pollId = await createPoll({ ownerAdminId: admin.sub, name: name.trim() });
  return NextResponse.json({ ok: true, id: pollId });
}