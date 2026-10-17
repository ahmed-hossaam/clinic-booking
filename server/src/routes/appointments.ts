import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { appointments, doctors } from "../db/schema.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { config } from "../config.js";
import {
  generateSlotCandidates,
  isPastSlot,
  isSlotOnSchedule,
} from "../utils/slots.js";

const router = Router();

const bookSchema = z.object({
  doctorId: z.string().uuid(),
  slot: z
    .string()
    .min(1)
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid ISO datetime"),
});

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

router.get(
  "/mine",
  authenticate,
  requireRole("patient"),
  async (req, res, next) => {
    try {
      const rows = await db.query.appointments.findMany({
        where: eq(appointments.patientId, req.user!.sub),
        orderBy: [desc(appointments.slot)],
        with: {
          doctor: true,
        },
      });

      res.json({
        appointments: rows.map((a) => ({
          id: a.id,
          slot: new Date(a.slot).toISOString(),
          status: a.status,
          createdAt: a.createdAt,
          doctor: {
            id: a.doctor.id,
            name: a.doctor.name,
            specialty: a.doctor.specialty,
          },
        })),
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/",
  authenticate,
  requireRole("patient"),
  async (req, res, next) => {
    try {
      const body = bookSchema.parse(req.body);
      const slotDate = new Date(body.slot);

      if (Number.isNaN(slotDate.getTime())) {
        res.status(400).json({ error: "Invalid slot datetime" });
        return;
      }

      if (isPastSlot(slotDate)) {
        res.status(400).json({ error: "Cannot book a past appointment slot" });
        return;
      }

      if (!isSlotOnSchedule(slotDate)) {
        res.status(400).json({ error: "Slot is outside clinic hours or interval" });
        return;
      }

      const allowed = generateSlotCandidates(new Date(), config.daysAhead);
      if (!allowed.some((s) => s.toISOString() === slotDate.toISOString())) {
        res.status(400).json({ error: "Slot is not available for booking" });
        return;
      }

      const doctor = await db.query.doctors.findFirst({
        where: eq(doctors.id, body.doctorId),
      });
      if (!doctor) {
        res.status(404).json({ error: "Doctor not found" });
        return;
      }

      try {
        const [created] = await db
          .insert(appointments)
          .values({
            patientId: req.user!.sub,
            doctorId: body.doctorId,
            slot: slotDate,
            status: "pending",
          })
          .returning();

        res.status(201).json({
          appointment: {
            id: created.id,
            slot: new Date(created.slot).toISOString(),
            status: created.status,
            doctor: {
              id: doctor.id,
              name: doctor.name,
              specialty: doctor.specialty,
            },
          },
        });
      } catch (err) {
        if (isUniqueViolation(err)) {
          res.status(409).json({ error: "This slot is no longer available" });
          return;
        }
        throw err;
      }
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/:id/cancel",
  authenticate,
  requireRole("patient"),
  async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const appt = await db.query.appointments.findFirst({
        where: eq(appointments.id, id),
      });

      if (!appt) {
        res.status(404).json({ error: "Appointment not found" });
        return;
      }

      if (appt.patientId !== req.user!.sub) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      if (appt.status === "cancelled") {
        res.json({
          appointment: {
            id: appt.id,
            status: "cancelled",
            slot: new Date(appt.slot).toISOString(),
          },
        });
        return;
      }

      const [updated] = await db
        .update(appointments)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(appointments.id, id),
            eq(appointments.patientId, req.user!.sub)
          )
        )
        .returning();

      res.json({
        appointment: {
          id: updated.id,
          status: updated.status,
          slot: new Date(updated.slot).toISOString(),
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
