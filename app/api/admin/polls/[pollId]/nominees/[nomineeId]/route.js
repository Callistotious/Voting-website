export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getNominee, updateNominee, deleteNominee } = require("../../../../../../../lib/db");
const { getAdminFromRequest } = require("../../../../../../../lib/session");
const { loadManageablePoll } = require("../../../../../../../lib/pollAccess");

export async function PATCH(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const nominee = await getNominee(poll.id, params.nomineeId);
  if (!nominee) return NextResponse.json({ error: "Nominee not found." }, { status: 404 });

  const { name, photoUrl } = await request.json();
  await updateNominee(nominee.id, { name: name?.trim(), photoUrl });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const nominee = await getNominee(poll.id, params.nomineeId);
  if (!nominee) return NextResponse.json({ error: "Nominee not found." }, { status: 404 });

  await deleteNominee(nominee.id);
  return NextResponse.json({ ok: true });
}