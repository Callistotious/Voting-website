export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { createCategory } = require("../../../../../../lib/db");
const { getAdminFromRequest } = require("../../../../../../lib/session");
const { loadManageablePoll } = require("../../../../../../lib/pollAccess");

export async function POST(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const { name } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Give the category a name." }, { status: 400 });
  }

  const categoryId = await createCategory(poll.id, name.trim());
  return NextResponse.json({ ok: true, id: categoryId });
}