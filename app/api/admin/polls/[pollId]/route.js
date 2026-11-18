export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { listCategoriesWithNominees, updatePollFields, deletePoll } = require("../../../../../lib/db");
const { getAdminFromRequest } = require("../../../../../lib/session");
const { loadManageablePoll } = require("../../../../../lib/pollAccess");

export async function GET(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const categories = await listCategoriesWithNominees(poll.id);
  return NextResponse.json({ poll, categories });
}

export async function PATCH(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const body = await request.json();
  const next = {
    name: body.name ?? poll.name,
    voting_status: body.votingStatus ?? poll.voting_status,
    otp_required: body.otpRequired !== undefined ? !!body.otpRequired : poll.otp_required,
    results_public: body.resultsPublic !== undefined ? !!body.resultsPublic : poll.results_public,
    open_voting: body.openVoting !== undefined ? !!body.openVoting : (poll.open_voting ?? false),
    suspension_message: body.suspensionMessage !== undefined ? body.suspensionMessage : (poll.suspension_message || "")
  };

  if (!["draft", "open", "closed"].includes(next.voting_status)) {
    return NextResponse.json({ error: "Invalid voting status." }, { status: 400 });
  }

  if (next.results_public && poll.service_status === "locked") {
    return NextResponse.json({ error: "Results can't be published while this poll is locked. Contact Medsam." }, { status: 403 });
  }

  await updatePollFields(poll.id, next);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  await deletePoll(poll.id);
  return NextResponse.json({ ok: true });
}