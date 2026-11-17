export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getTallyForPoll } = require("../../../../../../lib/db");
const { getAdminFromRequest } = require("../../../../../../lib/session");
const { loadManageablePoll } = require("../../../../../../lib/pollAccess");

export async function GET(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const tally = await getTallyForPoll(poll.id);
  return NextResponse.json({ poll, tally });
}