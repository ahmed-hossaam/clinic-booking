import { Router } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { appointments, doctors } from "../db/schema.js";
import { authenticate } from "../middleware/auth.js";
import { config } from "../config.js";
import { generateSlotCandidates } from "../utils/slots.js";

const router = Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const specialty = typeof req.query.specialty === "string"
      ? req.query.specialty.trim()
      : undefined;

    const all = specialty
      ? await db.query.doctors.findMany({
          where: eq(doctors.specialty, specialty),
          orderBy: (d, { asc }) => [asc(d.name)],
        })
      : await db.query.doctors.findMany({
          orderBy: (d, { asc }) => [asc(d.name)],
        });

    res.json({ doctors: all });
  } catch (e) {
    next(e);
  }
});

router.get("/specialties", authenticate, async (_req, res, next) => {
  try {
    const rows = await db
      .selectDistinct({ specialty: doctors.specialty })
      .from(doctors)
      .orderBy(doctors.specialty);
    res.json({ specialties: rows.map((r) => r.specialty) });
  } catch (e) {
    next(e);
  }
});

const availabilityQuery = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
    .optional(),
});

router.get("/:doctorId/availability", authenticate, async (req, res, next) => {
  try {
    const doctorId = Array.isArray(req.params.doctorId)
      ? req.params.doctorId[0]
      : req.params.doctorId;
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, doctorId),
    });
    if (!doctor) {
      res.status(404).json({ error: "Doctor not found" });
      return;
    }

    const query = availabilityQuery.parse(req.query);
    const now = new Date();
    const candidates = generateSlotCandidates(now, config.daysAhead);

    let filtered = candidates;
    if (query.date) {
      filtered = candidates.filter((slot) => {
        const d = new Intl.DateTimeFormat("en-CA", {
          timeZone: config.clinicTimezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(slot);
        return d === query.date;
      });
    }

    const booked = await db
      .select({ slot: appointments.slot })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          inArray(appointments.status, ["pending", "confirmed"])
        )
      );

    const bookedSet = new Set(
      booked.map((b) => new Date(b.slot).toISOString())
    );

    const available = filtered
      .filter((s) => !bookedSet.has(s.toISOString()))
      .map((s) => s.toISOString());

    res.json({
      doctor: { id: doctor.id, name: doctor.name, specialty: doctor.specialty },
      timezone: config.clinicTimezone,
      slots: available,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
