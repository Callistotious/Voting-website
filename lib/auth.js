const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

// Admin session tokens (client admins + super admin). 12 hour expiry.
function signAdminToken(admin) {
  return jwt.sign(
    { sub: admin.id, role: admin.role, email: admin.email },
    SECRET,
    { expiresIn: "12h" }
  );
}

// Voter session tokens, issued only after a correct OTP. Short-lived:
// just long enough to fill out and submit one ballot.
function signVoterToken(voter) {
  return jwt.sign(
    { sub: voter.id, pollId: voter.poll_id, kind: "voter" },
    SECRET,
    { expiresIn: "20m" }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

module.exports = { hashPassword, verifyPassword, signAdminToken, signVoterToken, verifyToken };
