export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getPollById, getVoterById, listCategoriesWithNominees } = require("../../../../../lib/db");
const { getVoterFromRequest } = require("../../../../../lib/session");

export async function GET(request, { params }) {
  const voterSession = getVoterFromRequest(request);
  if (!voterSession || voterSession.pollId !== params.pollId) {
    return NextResponse.json({ error: "Please verify your email first." }, { status: 401 });
  }

  const poll = await getPollById(params.pollId);
  if (!poll) return NextResponse.json({ error: "This poll doesn't exist." }, { status: 404 });
  if (poll.service_status === "locked") {
    return NextResponse.json({ error: "Voting is currently unavailable for this poll." }, { status: 403 });
  }
  if (poll.voting_status !== "open") {
    return NextResponse.json({ error: "Voting isn't open for this poll right now." }, { status: 403 });
  }

  const voter = await getVoterById(voterSession.sub);
  if (!voter) return NextResponse.json({ error: "Voter not found." }, { status: 404 });
  if (voter.status === "voted") {
    return NextResponse.json({ error: "You've already voted in this poll." }, { status: 409 });
  }

  const categories = await listCategoriesWithNominees(poll.id);
  return NextResponse.json({ pollName: poll.name, categories });
}