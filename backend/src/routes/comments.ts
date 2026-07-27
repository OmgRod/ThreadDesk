import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { getUserFromToken } from "../middleware/auth.js";

const createCommentSchema = z.object({
  postId: z.number(),
  content: z.string().min(1),
  parentId: z.number().optional(),
});

export async function commentRoutes(app: FastifyInstance) {
    // Create comment
    app.post("/", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;
    const body = createCommentSchema.parse(request.body);

    const [comment] = await db
      .insert(schema.comments)
      .values({
        postId: body.postId,
        userId: userId,
        content: body.content,
        parentId: body.parentId || null,
      })
      .returning();

    return reply.status(201).send(comment);
  });

  // Get comments for a post
  app.get("/post/:postId", async (request) => {
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
    const { id } = request.params as { id: string };
    
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const [comment] = await db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.id, parseInt(id)))
      .limit(1);

    if (!comment) return reply.status(404).send({ error: "Comment not found" });

    // Check if user is author OR org owner/admin
    const [post] = await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.id, comment.postId))
      .limit(1);

    const isAuthor = comment.userId === userId;
    let isOrgAdmin = false;

    if (post) {
      const [member] = await db
        .select()
        .from(schema.organizationMembers)
        .where(
          and(
            eq(schema.organizationMembers.organizationId, post.organizationId),
            eq(schema.organizationMembers.userId, userId)
          )
        )
        .limit(1);
      if (member && ["owner", "admin"].includes(member.role)) {
        isOrgAdmin = true;
      }
    }

    if (!isAuthor && !isOrgAdmin) {
      return reply.status(403).send({ error: "Not authorized" });
    }

    await db.delete(schema.comments).where(eq(schema.comments.id, parseInt(id)));

    return { success: true };
  });
}