import { AtpAgent } from "@atproto/api";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";

export async function getBlueskyAgent(userId: string) {
  const [connection] = await db
    .select()
    .from(schema.blueskyConnections)
    .where(eq(schema.blueskyConnections.userId, userId))
    .limit(1);

  if (!connection) return null;

  const agent = new AtpAgent({ service: "https://bsky.social" });
  await agent.resumeSession(JSON.parse(connection.session));
  return agent;
}

export async function createBlueskyPost(userId: string, text: string) {
  const agent = await getBlueskyAgent(userId);
  if (!agent) throw new Error("Bluesky not connected");

  return await agent.post({
    text,
    createdAt: new Date().toISOString(),
  });
}
