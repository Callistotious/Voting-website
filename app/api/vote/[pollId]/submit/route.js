export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getPollById, getVoterById, submitBallot } = require("../../../../../lib/db");
const { getVoterFromRequest } = require("../../../../../lib/session");

export async function POST(request, { params }) {
  const voterSession = getVoterFromRequest(request);
  if (!voterSession || voterSession.pollId !== params.pollId) {
    return NextResponse.json({ error: "Please verify your email first." }, { status: 401 });
  }

  const poll = await getPollById(params.pollId);
  if (!poll) return NextResponse.json({ error: "This poll doesn't exist." }, { status: 404 });
  if (poll.service_status === "locked" || poll.voting_status !== "open") {
    return NextResponse.json({ error: "Voting isn't open right now." }, { status: 403 });
  }

  const voter = await getVoterById(voterSession.sub);
  if (!voter) return NextResponse.json({ error: "Voter not found." }, { status: 404 });
  if (voter.status === "voted") {
    return NextResponse.json({ error: "You've already voted in this poll." }, { status: 409 });
  }

  const { selections } = await request.json();
  if (!selections || typeof selections !== "object" || Object.keys(selections).length === 0) {
    return NextResponse.json({ error: "Pick at least one nominee before submitting." }, { status: 400 });
  }

  try {
    await submitBallot({ pollId: poll.id, voterId: voter.id, selections });
  } catch (err) {
    if (err.message === "ALREADY_VOTED") {
      return NextResponse.json({ error: "You've already voted in this poll." }, { status: 409 });
    }
    if (err.message === "INVALID_SELECTION") {
      return NextResponse.json({ error: "One of your selections isn't valid. Please refresh and try again." }, { status: 400 });
    }
    throw err;
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("medsam_voter_token", "", { path: "/", maxAge: 0 });
  return res;
}