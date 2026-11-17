export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getVoterById, resetVoter, deleteVoter } = require("../../../../../../../lib/db");
const { getAdminFromRequest } = require("../../../../../../../lib/session");
const { loadManageablePoll } = require("../../../../../../../lib/pollAccess");

export async function PATCH(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const voter = await getVoterById(params.voterId);
  if (!voter || voter.poll_id !== poll.id) return NextResponse.json({ error: "Voter not found." }, { status: 404 });

  if (voter.status === "voted") {
    return NextResponse.json({ error: "This voter has already voted — their status can't be reset." }, { status: 400 });
  }

  await resetVoter(voter.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const voter = await getVoterById(params.voterId);
  if (!voter || voter.poll_id !== poll.id) return NextResponse.json({ error: "Voter not found." }, { status: 404 });

  await deleteVoter(voter.id);
  return NextResponse.json({ ok: true });
}