import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { getUserFromToken } from "../middleware/auth.js";

export async function followerRoutes(app: FastifyInstance) {
  // Follow organization
  app.post("/:orgId", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { orgId } = request.params as { orgId: string };

    const [existing] = await db
      .select()
      .from(schema.followers)
      .where(
        and(
          eq(schema.followers.organizationId, parseInt(orgId)),
          eq(schema.followers.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      await db.delete(schema.followers).where(eq(schema.followers.id, existing.id));
      return { following: false };
    }

    await db.insert(schema.followers).values({
      organizationId: parseInt(orgId),
      userId: userId,
    });

    return { following: true };
  });

  // Check if following
  app.get("/:orgId/check", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return { following: false };
    const userId = user.id;

    const { orgId } = request.params as { orgId: string };

    const [existing] = await db
      .select()
      .from(schema.followers)
      .where(
        and(
          eq(schema.followers.organizationId, parseInt(orgId)),
          eq(schema.followers.userId, userId)
        )
      )
      .limit(1);

    return { following: !!existing };
  });

  // Get followed organizations
  app.get("/my", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

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
      .where(eq(schema.followers.userId, userId));

    return orgs;
  });
}