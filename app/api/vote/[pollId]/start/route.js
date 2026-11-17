export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getPollById, getVoterByEmail, createVoter, setOtp } = require("../../../../../lib/db");
const { generateOtp, hashOtp, expiryTimestamp, MAX_RESENDS, RESEND_COOLDOWN_SECONDS } = require("../../../../../lib/otp");
const { sendOtpEmail } = require("../../../../../lib/mailer");
const { signVoterToken } = require("../../../../../lib/auth");

export async function POST(request, { params }) {
  const poll = await getPollById(params.pollId);
  if (!poll) return NextResponse.json({ error: "This poll doesn't exist." }, { status: 404 });
  if (poll.service_status === "locked") {
    return NextResponse.json({ error: "Voting is currently unavailable for this poll." }, { status: 403 });
  }
  if (poll.voting_status !== "open") {
    return NextResponse.json({ error: "Voting isn't open for this poll right now." }, { status: 403 });
  }

  const { email } = await request.json();
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return NextResponse.json({ error: "Enter your email." }, { status: 400 });

  let voter = await getVoterByEmail(poll.id, normalized);
  if (!voter) {
    if (!poll.open_voting) {
      return NextResponse.json({ error: "That email isn't on the voter list for this poll." }, { status: 404 });
    }
    voter = await createVoter(poll.id, normalized);
  }
  if (voter.status === "voted") {
    return NextResponse.json({ error: "This email has already voted." }, { status: 409 });
  }

  // OTP turned off for this poll — skip straight to a voting session.
  if (!poll.otp_required) {
    const token = signVoterToken(voter);
    const res = NextResponse.json({ ok: true, otpRequired: false });
    res.cookies.set("medsam_voter_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 20
    });
    return res;
  }

  // OTP required — same flow as before.
  if (voter.otp_last_sent_at) {
    const secondsSinceLast = (Date.now() - new Date(voter.otp_last_sent_at).getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code.` },
        { status: 429 }
      );
    }
    if ((voter.otp_resends || 0) >= MAX_RESENDS) {
      return NextResponse.json({ error: "Too many code requests. Contact the organizer for help." }, { status: 429 });
    }
  }

  const code = generateOtp();
  const codeHash = hashOtp(code);
  await setOtp(voter.id, {
    hash: codeHash,
    expiresAt: expiryTimestamp(),
    resends: (voter.otp_resends || 0) + 1
  });

  await sendOtpEmail({ to: normalized, code, pollName: poll.name });
  return NextResponse.json({ ok: true, otpRequired: true });
}