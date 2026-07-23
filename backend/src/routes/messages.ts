import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and, desc, or } from "drizzle-orm";

export async function messageRoutes(app: FastifyInstance) {
  // Get conversation list (latest message per user)
  app.get("/", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });
    const uid = parseInt(userId);

    // Get all messages involving the user, ordered by most recent
    const allMessages = await db
      .select({
        id: schema.messages.id,
        senderId: schema.messages.senderId,
        receiverId: schema.messages.receiverId,
        content: schema.messages.content,
        read: schema.messages.read,
        createdAt: schema.messages.createdAt,
      })
      .from(schema.messages)
      .where(or(eq(schema.messages.senderId, uid), eq(schema.messages.receiverId, uid)))
      .orderBy(desc(schema.messages.createdAt));

    // Build conversation map (keyed by the other user's ID)
    const conversationsMap = new Map<number, any>();
    for (const msg of allMessages) {
      const otherId = msg.senderId === uid ? msg.receiverId : msg.senderId;
      if (!conversationsMap.has(otherId)) {
        conversationsMap.set(otherId, msg);
      }
    }

    // Fetch user details for each conversation partner
    const conversations = await Promise.all(
      Array.from(conversationsMap.entries()).map(async ([otherId, latestMsg]) => {
        const [u] = await db
          .select({
            id: schema.users.id,
            name: schema.users.name,
            avatar: schema.users.avatar,
            email: schema.users.email,
            emailPublic: schema.users.emailPublic,
          })
          .from(schema.users)
          .where(eq(schema.users.id, otherId))
          .limit(1);
        // Only expose email if the user has made it public
        const safeUser = u ? { id: u.id, name: u.name, avatar: u.avatar, email: u.emailPublic ? u.email : null } : null;
        return { user: safeUser, latestMessage: latestMsg };
      })
    );

    return conversations;
  });

  // Get messages with a specific user
  app.get("/:userId", async (request, reply) => {
    const sessionId = request.cookies.session;
    if (!sessionId) return reply.status(401).send({ error: "Not authenticated" });
    const uid = parseInt(sessionId);
    const { userId } = request.params as { userId: string };
    const otherId = parseInt(userId);

    const msgs = await db
      .select()
      .from(schema.messages)
      .where(
        or(
          and(eq(schema.messages.senderId, uid), eq(schema.messages.receiverId, otherId)),
          and(eq(schema.messages.senderId, otherId), eq(schema.messages.receiverId, uid))
        )
      )
      .orderBy(schema.messages.createdAt);

    // Mark received messages as read
    await db
      .update(schema.messages)
      .set({ read: true })
      .where(and(eq(schema.messages.receiverId, uid), eq(schema.messages.senderId, otherId)));

    return msgs;
  });

  // Send a message
  app.post("/", async (request, reply) => {
    const sessionId = request.cookies.session;
    if (!sessionId) return reply.status(401).send({ error: "Not authenticated" });
    const uid = parseInt(sessionId);
    const { receiverId, content } = request.body as { receiverId: number; content: string };

    if (!receiverId || !content?.trim()) {
      return reply.status(400).send({ error: "receiverId and content are required" });
    }

    if (receiverId === uid) {
      return reply.status(400).send({ error: "You cannot message yourself" });
    }

    const [msg] = await db
      .insert(schema.messages)
      .values({ senderId: uid, receiverId, content: content.trim() })
      .returning();

    return reply.status(201).send(msg);
  });

  // Search users to message
  app.get("/search/:query", async (request, reply) => {
    const sessionId = request.cookies.session;
    if (!sessionId) return reply.status(401).send({ error: "Not authenticated" });
    const uid = parseInt(sessionId);
    const { query } = request.params as { query: string };

    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatar: schema.users.avatar,
        email: schema.users.email,
        emailPublic: schema.users.emailPublic,
      })
      .from(schema.users)
      .limit(20);

    const filtered = users.filter(
      (u) =>
        u.id !== uid && // exclude self
        u.name.toLowerCase().includes(query.toLowerCase())
    ).map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      email: u.emailPublic ? u.email : null, // only show email if user made it public
    }));

    return filtered;
  });
}
