import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { appointments } from "../db/schema.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate, requireRole("admin"));

const listQuery = z.object({
  status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
});

router.get("/appointments", async (req, res, next) => {
  try {
    const query = listQuery.parse(req.query);
    const rows = await db.query.appointments.findMany({
      where: query.status
        ? eq(appointments.status, query.status)
        : undefined,
      orderBy: [desc(appointments.slot)],
      with: {
        patient: true,
        doctor: true,
      },
    });

    res.json({
      appointments: rows.map((a) => ({
        id: a.id,
        slot: new Date(a.slot).toISOString(),
        status: a.status,
        createdAt: a.createdAt,
        patient: {
          id: a.patient.id,
          name: a.patient.name,
          email: a.patient.email,
        },
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
});

router.post("/appointments/:id/confirm", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const appt = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
    });

    if (!appt) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    if (appt.status === "cancelled") {
      res.status(400).json({ error: "Cannot confirm a cancelled appointment" });
      return;
    }

    if (appt.status === "confirmed") {
      res.json({
        appointment: {
          id: appt.id,
          status: appt.status,
          slot: new Date(appt.slot).toISOString(),
        },
      });
      return;
    }

    try {
      const [updated] = await db
        .update(appointments)
        .set({ status: "confirmed" })
        .where(and(eq(appointments.id, id), eq(appointments.status, "pending")))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Appointment not found or not pending" });
        return;
      }

      res.json({
        appointment: {
          id: updated.id,
          status: updated.status,
          slot: new Date(updated.slot).toISOString(),
        },
      });
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        res.status(409).json({ error: "Slot conflict with another appointment" });
        return;
      }
      throw err;
    }
  } catch (e) {
    next(e);
  }
});

router.post("/appointments/:id/cancel", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const appt = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
    });

    if (!appt) {
      res.status(404).json({ error: "Appointment not found" });
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
      .where(eq(appointments.id, id))
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
});

export default router;
