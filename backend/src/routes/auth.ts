import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post("/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, body.email))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db
      .insert(schema.users)
      .values({
        name: body.name,
        email: body.email,
        passwordHash,
      })
      .returning();

    reply.setCookie("session", String(user.id), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return reply.status(201).send({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    });
  });

  // Login
  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, body.email))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    // Set session cookie
    reply.setCookie("session", String(user.id), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
  });

  // Change password
  app.post("/change-password", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const { currentPassword, newPassword } = request.body as { currentPassword: string; newPassword: string };

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, parseInt(userId)))
      .limit(1);

    if (!user) return reply.status(401).send({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return reply.status(400).send({ error: "Current password is incorrect" });

    if (!newPassword || newPassword.length < 8) {
      return reply.status(400).send({ error: "New password must be at least 8 characters" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, parseInt(userId)));

    return { success: true };
  });

  // Logout
  app.post("/logout", async (request, reply) => {
    reply.clearCookie("session", { path: "/" });
    return { success: true };
  });

  // Get current user
  app.get("/me", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) {
      return reply.status(401).send({ error: "Not authenticated" });
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, parseInt(userId)))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ error: "User not found" });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      website: user.website,
      isPublic: user.isPublic,
      emailPublic: user.emailPublic,
    };
  });
}