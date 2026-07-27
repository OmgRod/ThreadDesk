import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and, sql, count } from "drizzle-orm";
import { getUserFromToken } from "../middleware/auth.js";

export async function analyticsRoutes(app: FastifyInstance) {
  // Track event
  app.post("/track", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });

    const body = request.body as any;
    await db.insert(schema.analyticsEvents).values({
      organizationId: body.organizationId,
      postId: body.postId || null,
      event: body.event,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    });
    return { success: true };
  });

  // Get analytics for organization
  app.get("/org/:orgId", async (request, _reply) => {
    const user = await getUserFromToken(request);
    if (!user) return _reply.status(401).send({ error: "Not authenticated" });

    if (user.plan === "free" && !user.isAdmin) {
      return _reply.status(403).send({ error: "Analytics requires a Starter plan or higher" });
    }

    const { orgId } = request.params as { orgId: string };
    const orgIdNum = parseInt(orgId);

    // Fetch daily views for the last 7 days
    const dailyViews = await db
      .select({
        date: sql<string>`DATE(${schema.analyticsEvents.createdAt})`,
        count: count(),
      })
      .from(schema.analyticsEvents)
      .where(
        and(
          eq(schema.analyticsEvents.organizationId, orgIdNum),
          eq(schema.analyticsEvents.event, "view")
        )
      )
      .groupBy(sql`DATE(${schema.analyticsEvents.createdAt})`)
      .orderBy(sql`DATE(${schema.analyticsEvents.createdAt}) DESC`)
      .limit(7);

    const postViews = await db
      .select()
      .from(schema.analyticsEvents)
      .where(
        and(
          eq(schema.analyticsEvents.organizationId, orgIdNum),
          eq(schema.analyticsEvents.event, "view")
        )
      );

    const uniqueViews = new Set(postViews.map((v) => v.metadata)).size;

    const comments = await db
      .select()
      .from(schema.comments)
      .innerJoin(
        schema.posts,
        eq(schema.comments.postId, schema.posts.id)
      )
      .where(eq(schema.posts.organizationId, orgIdNum));

    const reactions = await db
      .select()
      .from(schema.reactions)
      .innerJoin(
        schema.posts,
        eq(schema.reactions.postId, schema.posts.id)
      )
      .where(eq(schema.posts.organizationId, orgIdNum));

    const followers = await db
      .select()
      .from(schema.followers)
      .where(eq(schema.followers.organizationId, orgIdNum));

    return {
      dailyViews: dailyViews.reverse(), // oldest to newest
      totalViews: postViews.length,
      uniqueViews,
      totalComments: comments.length,
      totalReactions: reactions.length,
      totalFollowers: followers.length,
    };
  });
}