import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";

export async function userRoutes(app: FastifyInstance) {
  // Get public user profile
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const requesterId = request.cookies.session ? parseInt(request.cookies.session) : null;

    const [user] = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
        bio: schema.users.bio,
        website: schema.users.website,
        isPublic: schema.users.isPublic,
        emailPublic: schema.users.emailPublic,
      })
      .from(schema.users)
      .where(eq(schema.users.id, parseInt(id)))
      .limit(1);

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    // Allow self to see own profile regardless of privacy
    if (!user.isPublic && requesterId !== user.id) {
      return reply.status(403).send({ error: "This profile is private" });
    }

    // Get public organizations the user is a member of
    const orgs = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        slug: schema.organizations.slug,
        logo: schema.organizations.logo,
        role: schema.organizationMembers.role,
      })
      .from(schema.organizationMembers)
      .innerJoin(
        schema.organizations,
        eq(schema.organizationMembers.organizationId, schema.organizations.id)
      )
      .where(
        and(
          eq(schema.organizationMembers.userId, parseInt(id)),
          eq(schema.organizationMembers.isPublic, true)
        )
      );

    // Hide email unless it's public or the requester is the user themselves
    const email = (user.emailPublic || requesterId === user.id) ? user.email : null;

    return { ...user, email, organizations: orgs };
  });

  // Update own profile
  app.put("/me", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const body = request.body as any;

    const [updatedUser] = await db
      .update(schema.users)
      .set({
        name: body.name,
        avatar: body.avatar,
        bio: body.bio,
        website: body.website,
        isPublic: body.isPublic,
        emailPublic: body.emailPublic,
      })
      .where(eq(schema.users.id, parseInt(userId)))
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
        bio: schema.users.bio,
        website: schema.users.website,
        isPublic: schema.users.isPublic,
        emailPublic: schema.users.emailPublic,
      });

    return updatedUser;
  });

  // Delete own account
  app.delete("/me", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    // Delete user from db (cascades to posts, comments, etc)
    await db.delete(schema.users).where(eq(schema.users.id, parseInt(userId)));

    // Clear session cookie
    reply.clearCookie("session", { path: "/" });

    return { success: true };
  });
}
