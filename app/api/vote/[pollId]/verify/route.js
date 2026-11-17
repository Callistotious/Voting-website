export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getPollById, getVoterByEmail, incrementOtpAttempts, clearOtp } = require("../../../../../lib/db");
const { checkOtp, MAX_ATTEMPTS } = require("../../../../../lib/otp");
const { signVoterToken } = require("../../../../../lib/auth");

export async function POST(request, { params }) {
  const poll = await getPollById(params.pollId);
  if (!poll) return NextResponse.json({ error: "This poll doesn't exist." }, { status: 404 });

  const { email, code } = await request.json();
  const normalized = (email || "").trim().toLowerCase();

  const voter = await getVoterByEmail(poll.id, normalized);
  if (!voter) return NextResponse.json({ error: "That email isn't on the voter list." }, { status: 404 });
  if (!voter.otp_hash) return NextResponse.json({ error: "Request a code first." }, { status: 400 });

  if ((voter.otp_attempts || 0) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 429 });
  }
  if (new Date(voter.otp_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });
  }

  const correct = checkOtp((code || "").trim(), voter.otp_hash);
  if (!correct) {
    await incrementOtpAttempts(voter.id);
    return NextResponse.json({ error: "That code isn't right." }, { status: 401 });
  }

  await clearOtp(voter.id);

  const token = signVoterToken(voter);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("medsam_voter_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 20
  });
  return res;
}