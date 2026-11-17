export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { listVoters, bulkAddVoters } = require("../../../../../../lib/db");
const { getAdminFromRequest } = require("../../../../../../lib/session");
const { loadManageablePoll } = require("../../../../../../lib/pollAccess");

export async function GET(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const voters = await listVoters(poll.id);
  return NextResponse.json({ voters });
}

export async function POST(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const { raw } = await request.json();
  if (!raw || !raw.trim()) {
    return NextResponse.json({ error: "Paste at least one email." }, { status: 400 });
  }

  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows = [];
  const skipped = [];
  for (const line of lines) {
    const [emailRaw, ...rest] = line.split(",");
    const email = (emailRaw || "").trim().toLowerCase();
    const name = rest.join(",").trim();
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!looksLikeEmail) {
      skipped.push(line);
      continue;
    }
    rows.push({ email, name: name || null });
  }

  const added = await bulkAddVoters(poll.id, rows);
  return NextResponse.json({ ok: true, added, skipped });
}