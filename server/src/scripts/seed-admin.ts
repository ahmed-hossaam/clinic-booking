import "dotenv/config";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, pool } from "../db/index.js";
import { users } from "../db/schema.js";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Clinic Admin";

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required in environment");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  const normalized = email.toLowerCase();
  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalized),
  });

  if (existing) {
    if (existing.role !== "admin") {
      console.error("A non-admin user already exists with this email");
      process.exit(1);
    }
    console.log("Admin user already exists. Skipping.");
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    name,
    email: normalized,
    passwordHash,
    role: "admin",
  });

  console.log(`Admin user created: ${normalized}`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
