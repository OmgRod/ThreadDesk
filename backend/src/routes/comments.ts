import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const createCommentSchema = z.object({
  postId: z.number(),
  content: z.string().min(1),
  parentId: z.number().optional(),
});

export async function commentRoutes(app: FastifyInstance) {
  // Create comment
  app.post("/", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const body = createCommentSchema.parse(request.body);

    const [comment] = await db
      .insert(schema.comments)
      .values({
        postId: body.postId,
        userId: parseInt(userId),
        content: body.content,
        parentId: body.parentId || null,
      })
      .returning();

    return reply.status(201).send(comment);
  });

  // Get comments for a post
  app.get("/post/:postId", async (request, reply) => {
    const { postId } = request.params as { postId: string };
    const comments = await db
      .select({
        id: schema.comments.id,
        content: schema.comments.content,
        parentId: schema.comments.parentId,
        createdAt: schema.comments.createdAt,
        user: {
          id: schema.users.id,
          name: schema.users.name,
          avatar: schema.users.avatar,
        },
      })
      .from(schema.comments)
      .innerJoin(schema.users, eq(schema.comments.userId, schema.users.id))
      .where(eq(schema.comments.postId, parseInt(postId)))
      .orderBy(desc(schema.comments.createdAt));

    return comments;
  });

  // Delete comment
  app.delete("/:id", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const { id } = request.params as { id: string };
    await db
      .delete(schema.comments)
      .where(
        and(
          eq(schema.comments.id, parseInt(id)),
          eq(schema.comments.userId, parseInt(userId))
        )
      );

    return { success: true };
  });
}