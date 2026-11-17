require("dotenv").config({ path: ".env.local" });
const { hashPassword } = require("./auth");
const { getAdminByEmailAndRole, createAdmin } = require("./db");

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env.local first.");
  process.exit(1);
}

(async () => {
  const existing = await getAdminByEmailAndRole(email, "super_admin");
  if (existing) {
    console.log(`Super admin ${email} already exists. Nothing to do.`);
    process.exit(0);
  }
  await createAdmin({ email, passwordHash: hashPassword(password), role: "super_admin", clientName: "Medsam" });
  console.log(`Super admin created: ${email}`);
  process.exit(0);
})();