export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getPollById } = require("../../../../../lib/db");

export async function GET(request, { params }) {
  const poll = await getPollById(params.pollId);
  if (!poll) return NextResponse.json({ error: "This poll doesn't exist." }, { status: 404 });

  return NextResponse.json({
    pollName: poll.name,
    votingOpen: poll.voting_status === "open" && poll.service_status !== "locked",
    suspensionMessage: poll.suspension_message || "Voting's taking a little break — check back shortly!"
  });
}