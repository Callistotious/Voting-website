const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const MAX_RESENDS = 3;
const RESEND_COOLDOWN_SECONDS = 60;

function generateOtp() {
  // Random digits, not a predictable sequence.
  const otp = crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
  return otp;
}

function hashOtp(code) {
  return bcrypt.hashSync(code, 8);
}

function checkOtp(code, hash) {
  return bcrypt.compareSync(code, hash);
}

function expiryTimestamp() {
  const d = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  return d.toISOString();
}

module.exports = {
  OTP_LENGTH,
  OTP_TTL_MINUTES,
  MAX_ATTEMPTS,
  MAX_RESENDS,
  RESEND_COOLDOWN_SECONDS,
  generateOtp,
  hashOtp,
  checkOtp,
  expiryTimestamp
};
