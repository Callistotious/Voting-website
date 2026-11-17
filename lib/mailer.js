const nodemailer = require("nodemailer");

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendOtpEmail({ to, code, pollName }) {
  const transport = getTransport();

  // If SMTP isn't configured yet (local dev before .env.local is filled in),
  // log the code instead of crashing, so the flow is still testable.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[dev mode - no SMTP configured] OTP for ${to}: ${code}`);
    return { devMode: true };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || "Medsam Voting <no-reply@medsam.example>",
    to,
    subject: `Your voting code for ${pollName}`,
    text: `Your verification code is ${code}. It expires in 5 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:Georgia,serif;background:#0D1324;color:#F3EFE6;padding:32px;">
        <h2 style="color:#E9C77B;font-weight:normal;letter-spacing:0.5px;">${pollName}</h2>
        <p style="font-size:15px;">Your verification code is:</p>
        <p style="font-size:32px;letter-spacing:6px;color:#F3EFE6;font-weight:bold;">${code}</p>
        <p style="font-size:13px;color:#C9C3B4;">This code expires in 5 minutes. If you didn't request it, you can safely ignore this email.</p>
      </div>
    `
  });

  return { devMode: false };
}

module.exports = { sendOtpEmail };
