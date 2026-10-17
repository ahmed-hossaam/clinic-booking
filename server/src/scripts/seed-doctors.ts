import "dotenv/config";
import { db } from "../db/index.js";
import { doctors } from "../db/schema.js";
import { pool } from "../db/index.js";

const SEED_DOCTORS = [
  { name: "Dr. Sarah Chen", specialty: "General Practice" },
  { name: "Dr. Michael Rivera", specialty: "Cardiology" },
  { name: "Dr. Emily Watson", specialty: "Dermatology" },
  { name: "Dr. James Okonkwo", specialty: "Pediatrics" },
  { name: "Dr. Lisa Park", specialty: "Orthopedics" },
  { name: "Dr. David Hughes", specialty: "General Practice" },
];

async function main() {
  const existing = await db.query.doctors.findMany();
  if (existing.length > 0) {
    console.log(`Doctors already seeded (${existing.length} records). Skipping.`);
    await pool.end();
    return;
  }

  await db.insert(doctors).values(SEED_DOCTORS);
  console.log(`Seeded ${SEED_DOCTORS.length} doctors.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
