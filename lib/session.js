const { verifyToken } = require("./auth");

function getCookie(req, name) {
  const header = req.headers.get("cookie") || "";
  const match = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

function getAdminFromRequest(req) {
  const token = getCookie(req, "medsam_admin_token");
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || (payload.role !== "client_admin" && payload.role !== "super_admin")) return null;
  return payload;
}

function getVoterFromRequest(req) {
  const token = getCookie(req, "medsam_voter_token");
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.kind !== "voter") return null;
  return payload;
}

module.exports = { getCookie, getAdminFromRequest, getVoterFromRequest };
