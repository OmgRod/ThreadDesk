import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { getUserFromToken } from "../middleware/auth.js";
import { AtpAgent } from "@atproto/api";
import { createBlueskyPost } from "../services/bluesky.js";

export async function blueskyRoutes(app: FastifyInstance) {
  // Connect/Login
  app.post("/connect", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });

    const { handle, password } = request.body as { handle: string; password: string };
    const agent = new AtpAgent({ service: "https://bsky.social" });
    
    try {
      const session = await agent.login({ identifier: handle, password });
      
      await db.insert(schema.blueskyConnections).values({
        userId: user.id,
        blueskyDid: session.data.did,
        blueskyHandle: session.data.handle,
        session: JSON.stringify(session.data),
      });

      return { success: true };
    } catch (error) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }
  });

  // Status
  app.get("/status", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });

    const [connection] = await db
      .select()
      .from(schema.blueskyConnections)
      .where(eq(schema.blueskyConnections.userId, user.id))
      .limit(1);

    if (!connection) return { connected: false };
    
    // Attempt to resolve handle to get avatar (optional, can be cached later)
    const agent = new AtpAgent({ service: "https://bsky.social" });
    const profile = await agent.getProfile({ actor: connection.blueskyDid });

    return { 
      connected: true, 
      handle: connection.blueskyHandle, 
      avatar: profile.data.avatar 
    };
  });

  // Disconnect
  app.post("/disconnect", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });

    await db
      .delete(schema.blueskyConnections)
      .where(eq(schema.blueskyConnections.userId, user.id));

    return { success: true };
  });

  // Post
  app.post("/post", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });

    const { text } = request.body as { text: string };
    
    try {
      await createBlueskyPost(user.id, text);
      return { success: true };
    } catch (error) {
      return reply.status(500).send({ error: "Failed to post" });
    }
  });
}
