const { getPollOwnedByAdmin, getPollById } = require("./db");

async function loadOwnedPoll(admin, pollId) {
  if (!admin || admin.role !== "client_admin") return null;
  return getPollOwnedByAdmin(pollId, admin.sub);
}

// Same idea as loadOwnedPoll, but also lets the super admin manage ANY poll —
// this is the "full visibility and control" role from the Terms of Service.
async function loadManageablePoll(admin, pollId) {
  if (!admin) return null;
  if (admin.role === "super_admin") return getPollById(pollId);
  return loadOwnedPoll(admin, pollId);
}

module.exports = { loadOwnedPoll, loadManageablePoll };