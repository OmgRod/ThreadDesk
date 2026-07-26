import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getUserFromToken } from "../middleware/auth.js";

const reactionSchema = z.object({
  postId: z.number().optional(),
  commentId: z.number().optional(),
  type: z.enum(["like", "love", "laugh", "wow", "sad", "angry"]),
});

export async function reactionRoutes(app: FastifyInstance) {
  // Add reaction
  app.post("/", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const body = reactionSchema.parse(request.body);

    if (!body.postId && !body.commentId) {
      return reply.status(400).send({ error: "Must provide postId or commentId" });
    }

    // Check if reaction already exists
    const [existing] = await db
      .select()
      .from(schema.reactions)
      .where(
        and(
          eq(schema.reactions.userId, userId),
          body.postId ? eq(schema.reactions.postId!, body.postId) : undefined,
          body.commentId ? eq(schema.reactions.commentId!, body.commentId) : undefined,
          eq(schema.reactions.type, body.type)
        )
      )
      .limit(1);

    if (existing) {
      // Remove reaction if it exists (toggle)
      await db
        .delete(schema.reactions)
        .where(eq(schema.reactions.id, existing.id));
      return { action: "removed" };
    }

    const [reaction] = await db
      .insert(schema.reactions)
      .values({
        userId: userId,
        postId: body.postId || null,
        commentId: body.commentId || null,
        type: body.type,
      })
      .returning();

    return reply.status(201).send(reaction);
  });

  // Get reactions for a post
  app.get("/post/:postId", async (request, reply) => {
    const { postId } = request.params as { postId: string };
    const reactions = await db
      .select()
      .from(schema.reactions)
      .where(eq(schema.reactions.postId, parseInt(postId)));

    const counts: Record<string, number> = {};
    for (const r of reactions) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }

    return { counts, total: reactions.length };
  });
}