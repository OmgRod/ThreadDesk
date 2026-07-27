import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import { getUserFromToken } from "../middleware/auth.js";

export async function notificationRoutes(app: FastifyInstance) {
  // Get notifications
  app.get("/", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const notifications = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(50);

    return notifications;
  });

  // Mark as read
  app.put("/:id/read", async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    await db
      .update(schema.notifications)
      .set({ read: true })
      .where(
        and(
          eq(schema.notifications.id, parseInt(id)),
          eq(schema.notifications.userId, userId)
        )
      );

    return { success: true };
  });

  // Mark all as read
  app.put("/read-all", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    await db
      .update(schema.notifications)
      .set({ read: true })
      .where(eq(schema.notifications.userId, userId));

    return { success: true };
  });

  // Get unread count
  app.get("/unread-count", async (request) => {
    const user = await getUserFromToken(request);
    if (!user) return { count: 0 };
    const userId = user.id;

    const result = await db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.read, false)
        )
      );

    return { count: result.length };
  });
}