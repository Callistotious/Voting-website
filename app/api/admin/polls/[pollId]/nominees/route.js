export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getCategory, createNominee } = require("../../../../../../lib/db");
const { getAdminFromRequest } = require("../../../../../../lib/session");
const { loadManageablePoll } = require("../../../../../../lib/pollAccess");

export async function POST(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const { categoryId, name, photoUrl } = await request.json();
  const category = await getCategory(poll.id, categoryId);
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
  if (!name || !name.trim()) return NextResponse.json({ error: "Give the nominee a name." }, { status: 400 });

  const nomineeId = await createNominee(poll.id, category.id, { name: name.trim(), photoUrl });
  return NextResponse.json({ ok: true, id: nomineeId });
}