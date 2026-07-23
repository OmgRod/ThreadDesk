import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and, desc, sql } from "drizzle-orm";

export async function analyticsRoutes(app: FastifyInstance) {
  // Track event
  app.post("/track", async (request, reply) => {
    const body = request.body as any;
    await db.insert(schema.analyticsEvents).values({
      organizationId: body.organizationId,
      postId: body.postId || null,
      event: body.event,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    });
    return { success: true };
  });

  // Get analytics for organization
  app.get("/org/:orgId", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const orgIdNum = parseInt(orgId);

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
      totalViews: postViews.length,
      uniqueViews,
      totalComments: comments.length,
      totalReactions: reactions.length,
      totalFollowers: followers.length,
    };
  });
}