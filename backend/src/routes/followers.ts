import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";

export async function followerRoutes(app: FastifyInstance) {
  // Follow organization
  app.post("/:orgId", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const { orgId } = request.params as { orgId: string };

    const [existing] = await db
      .select()
      .from(schema.followers)
      .where(
        and(
          eq(schema.followers.organizationId, parseInt(orgId)),
          eq(schema.followers.userId, parseInt(userId))
        )
      )
      .limit(1);

    if (existing) {
      await db.delete(schema.followers).where(eq(schema.followers.id, existing.id));
      return { following: false };
    }

    await db.insert(schema.followers).values({
      organizationId: parseInt(orgId),
      userId: parseInt(userId),
    });

    return { following: true };
  });

  // Check if following
  app.get("/:orgId/check", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return { following: false };

    const { orgId } = request.params as { orgId: string };

    const [existing] = await db
      .select()
      .from(schema.followers)
      .where(
        and(
          eq(schema.followers.organizationId, parseInt(orgId)),
          eq(schema.followers.userId, parseInt(userId))
        )
      )
      .limit(1);

    return { following: !!existing };
  });

  // Get followed organizations
  app.get("/my", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const orgs = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        slug: schema.organizations.slug,
        logo: schema.organizations.logo,
        verified: schema.organizations.verified,
      })
      .from(schema.followers)
      .innerJoin(
        schema.organizations,
        eq(schema.followers.organizationId, schema.organizations.id)
      )
      .where(eq(schema.followers.userId, parseInt(userId)));

    return orgs;
  });
}