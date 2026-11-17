export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getPollById, getTallyForPoll } = require("../../../../lib/db");

export async function GET(request, { params }) {
  const poll = await getPollById(params.pollId);
  if (!poll) return NextResponse.json({ error: "This poll doesn't exist." }, { status: 404 });

  if (poll.service_status === "locked") {
    return NextResponse.json({ unavailable: true, reason: "locked" });
  }
  if (!poll.results_public) {
    return NextResponse.json({ unavailable: true, reason: "not_published" });
  }

  const tally = await getTallyForPoll(poll.id);
  return NextResponse.json({ pollName: poll.name, tally });
}