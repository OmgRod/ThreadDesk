import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, desc, inArray, and, sql } from "drizzle-orm";
import { getUserFromToken } from "../middleware/auth.js";

export async function feedRoutes(app: FastifyInstance) {
  // Get feed
  app.get("/", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const page = parseInt((request.query as any).page || "1");
    const limit = parseInt((request.query as any).limit || "20");
    const search = (request.query as any).search || "";
    const offset = (page - 1) * limit;

    // Get followed orgs
    const followed = await db
      .select()
      .from(schema.followers)
      .where(eq(schema.followers.userId, userId));

    if (followed.length === 0) {
      return { posts: [], hasMore: false, page };
    }

    const orgIds = followed.map((f) => f.organizationId);

    const posts = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        content: schema.posts.content,
        createdAt: schema.posts.createdAt,
        organization: {
          id: schema.organizations.id,
          name: schema.organizations.name,
          slug: schema.organizations.slug,
          logo: schema.organizations.logo,
        },
        author: {
          id: schema.users.id,
          name: schema.users.name,
          avatar: schema.users.avatar,
        },
      })
      .from(schema.posts)
      .innerJoin(
        schema.organizations,
        eq(schema.posts.organizationId, schema.organizations.id)
      )
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .where(
        and(
          inArray(schema.posts.organizationId, orgIds),
          eq(schema.posts.published, true),
          search
            ? sql`${schema.posts.title} ILIKE ${`%${search}%`} OR ${schema.posts.content} ILIKE ${`%${search}%`} OR ${schema.organizations.name} ILIKE ${`%${search}%`}`
            : undefined
        )
      )
      .orderBy(desc(schema.posts.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      posts,
      hasMore: posts.length === limit,
      page,
    };
  });
}