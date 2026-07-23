import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";

export async function notificationRoutes(app: FastifyInstance) {
  // Get notifications
  app.get("/", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const notifications = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, parseInt(userId)))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(50);

    return notifications;
  });

  // Mark as read
  app.put("/:id/read", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const { id } = request.params as { id: string };

    await db
      .update(schema.notifications)
      .set({ read: true })
      .where(
        and(
          eq(schema.notifications.id, parseInt(id)),
          eq(schema.notifications.userId, parseInt(userId))
        )
      );

    return { success: true };
  });

  // Mark all as read
  app.put("/read-all", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    await db
      .update(schema.notifications)
      .set({ read: true })
      .where(eq(schema.notifications.userId, parseInt(userId)));

    return { success: true };
  });

  // Get unread count
  app.get("/unread-count", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return { count: 0 };

    const result = await db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, parseInt(userId)),
          eq(schema.notifications.read, false)
        )
      );

    return { count: result.length };
  });
}