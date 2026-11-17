export const runtime = "nodejs";
import { NextResponse } from "next/server";
const { getCategory, renameCategory, deleteCategory } = require("../../../../../../../lib/db");
const { getAdminFromRequest } = require("../../../../../../../lib/session");
const { loadManageablePoll } = require("../../../../../../../lib/pollAccess");

export async function PATCH(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const category = await getCategory(poll.id, params.categoryId);
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  const { name } = await request.json();
  if (!name || !name.trim()) return NextResponse.json({ error: "Name can't be empty." }, { status: 400 });

  await renameCategory(category.id, name.trim());
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const admin = getAdminFromRequest(request);
  const poll = await loadManageablePoll(admin, params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

  const category = await getCategory(poll.id, params.categoryId);
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  await deleteCategory(poll.id, category.id);
  return NextResponse.json({ ok: true });
}