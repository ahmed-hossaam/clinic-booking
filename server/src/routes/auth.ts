import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { config } from "../config.js";
import { authenticate, type JwtPayload } from "../middleware/auth.js";

const router = Router();

const signupSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setAuthCookie(res: import("express").Response, payload: JwtPayload) {
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function publicUser(row: typeof users.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
  };
}

router.post("/signup", async (req, res, next) => {
  try {
    const body = signupSchema.parse(req.body);
    const existing = await db.query.users.findFirst({
      where: eq(users.email, body.email.toLowerCase()),
    });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [created] = await db
      .insert(users)
      .values({
        name: body.name.trim(),
        email: body.email.toLowerCase(),
        passwordHash,
        role: "patient",
      })
      .returning();

    const payload: JwtPayload = {
      sub: created.id,
      email: created.email,
      role: created.role,
      name: created.name,
    };
    setAuthCookie(res, payload);
    res.status(201).json({ user: publicUser(created) });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await db.query.users.findFirst({
      where: eq(users.email, body.email.toLowerCase()),
    });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    setAuthCookie(res, payload);
    res.json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? "none" : "lax",
    path: "/",
  });
  res.json({ ok: true });
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user!.sub),
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

export default router;
