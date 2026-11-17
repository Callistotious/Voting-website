export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getPollById, updatePollServiceStatus, writeAuditLog } = require("../../../../../../lib/db");
const { getAdminFromRequest } = require("../../../../../../lib/session");

const VALID = ["active", "grace", "locked"];

export async function PATCH(request, { params }) {
  const admin = getAdminFromRequest(request);
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { serviceStatus } = await request.json();
  if (!VALID.includes(serviceStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const poll = await getPollById(params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  await updatePollServiceStatus(params.pollId, serviceStatus);
  await writeAuditLog({
    pollId: params.pollId,
    actor: admin.email,
    action: "service_status_change",
    detail: `${poll.service_status} -> ${serviceStatus}`
  });

  return NextResponse.json({ ok: true });
}