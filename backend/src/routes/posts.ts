import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { WorkflowEngine } from "../services/workflowEngine.js";
import { getUserFromToken } from "../middleware/auth.js";

const createPostSchema = z.object({
  organizationId: z.number(),
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  visibility: z.enum(["public", "followers", "members", "unlisted"]).default("public"),
  published: z.boolean().default(false),
  scheduledDate: z.string().optional(),
  attachmentUrls: z.array(z.string()).optional(),
});

export async function postRoutes(app: FastifyInstance) {
  // Create post
  app.post("/", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const body = createPostSchema.parse(request.body);

    // Check membership
    const [member] = await db
      .select()
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.organizationId, body.organizationId),
          eq(schema.organizationMembers.userId, userId)
        )
      )
      .limit(1);

    if (!member || !["owner", "admin", "editor"].includes(member.role)) {
      return reply.status(403).send({ error: "Not authorized" });
    }

    const [post] = await db
      .insert(schema.posts)
      .values({
        organizationId: body.organizationId,
        authorId: userId,
        title: body.title,
        content: body.content,
        visibility: body.visibility,
        published: body.published,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      })
      .returning();

    if (body.attachmentUrls && body.attachmentUrls.length > 0) {
      await db.insert(schema.postAttachments).values(
        body.attachmentUrls.map((url) => ({
          postId: post.id,
          url,
          type: "image", // Assume images for now
        }))
      );
    }

    // Trigger workflows in the background
    WorkflowEngine.trigger(body.organizationId, "new_post", post).catch(console.error);

    return reply.status(201).send(post);
  });

  // Get posts for organization (public)
  app.get("/org/:orgId", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const posts = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        content: schema.posts.content,
        visibility: schema.posts.visibility,
        published: schema.posts.published,
        createdAt: schema.posts.createdAt,
        author: {
          id: schema.users.id,
          name: schema.users.name,
          avatar: schema.users.avatar,
        },
      })
      .from(schema.posts)
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .where(
        and(
          eq(schema.posts.organizationId, parseInt(orgId)),
          eq(schema.posts.published, true),
          eq(schema.posts.visibility, "public")
        )
      )
      .orderBy(desc(schema.posts.createdAt));

    return posts;
  });

  // Get single post
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [post] = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        content: schema.posts.content,
        visibility: schema.posts.visibility,
        published: schema.posts.published,
        scheduledDate: schema.posts.scheduledDate,
        createdAt: schema.posts.createdAt,
        updatedAt: schema.posts.updatedAt,
        organizationId: schema.posts.organizationId,
        author: {
          id: schema.users.id,
          name: schema.users.name,
          avatar: schema.users.avatar,
        },
        organization: {
          id: schema.organizations.id,
          name: schema.organizations.name,
          slug: schema.organizations.slug,
          logo: schema.organizations.logo,
        },
      })
      .from(schema.posts)
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .innerJoin(
        schema.organizations,
        eq(schema.posts.organizationId, schema.organizations.id)
      )
      .where(eq(schema.posts.id, id))
      .limit(1);

    if (!post) {
      return reply.status(404).send({ error: "Post not found" });
    }

    const attachments = await db
      .select()
      .from(schema.postAttachments)
      .where(eq(schema.postAttachments.postId, post.id));

    return { ...post, attachments };
  });

  // Update post
  app.put("/:id", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { id } = request.params as { id: string };
    const body = request.body as any;

    const [post] = await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.id, id))
      .limit(1);

    if (!post) return reply.status(404).send({ error: "Post not found" });

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

    if (!member || !["owner", "admin", "editor"].includes(member.role)) {
      return reply.status(403).send({ error: "Not authorized" });
    }

    const [updated] = await db
      .update(schema.posts)
      .set({
        title: body.title,
        content: body.content,
        visibility: body.visibility,
        published: body.published,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.posts.id, id))
      .returning();

    return updated;
  });

  // Delete post
  app.delete("/:id", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { id } = request.params as { id: string };

    const [post] = await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.id, id))
      .limit(1);

    if (!post) return reply.status(404).send({ error: "Post not found" });

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

    if (!member || !["owner", "admin", "editor"].includes(member.role)) {
      return reply.status(403).send({ error: "Not authorized" });
    }

    await db.delete(schema.posts).where(eq(schema.posts.id, id));
    return { success: true };
  });

  // Get dashboard posts (all posts for user's orgs)
  app.get("/dashboard/all", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const posts = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        published: schema.posts.published,
        visibility: schema.posts.visibility,
        createdAt: schema.posts.createdAt,
        organization: {
          id: schema.organizations.id,
          name: schema.organizations.name,
          slug: schema.organizations.slug,
        },
      })
      .from(schema.posts)
      .innerJoin(
        schema.organizationMembers,
        and(
          eq(schema.posts.organizationId, schema.organizationMembers.organizationId),
          eq(schema.organizationMembers.userId, userId)
        )
      )
      .innerJoin(
        schema.organizations,
        eq(schema.posts.organizationId, schema.organizations.id)
      )
      .orderBy(desc(schema.posts.createdAt));

    return posts;
  });
}
