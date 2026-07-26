import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getUserFromToken } from "../middleware/auth.js";

const createOrgSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  website: z.string().optional(),
});

export async function organizationRoutes(app: FastifyInstance) {
  // List all organizations
  app.get("/", async (request, reply) => {
    const orgs = await db.select().from(schema.organizations);
    return orgs;
  });

  // Create organization
  app.post("/", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    // Check plan limits
    const existingOrgs = await db
      .select()
      .from(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.userId, userId), eq(schema.organizationMembers.role, "owner")));

    const orgCount = existingOrgs.length;
    let limit = 1;
    if (user.plan === "starter") limit = 3;
    else if (user.plan === "pro" || user.plan === "business") limit = Infinity;

    // Use custom limit if set
    const effectiveLimit = user.maxOrganizations ?? limit;

    if (orgCount >= effectiveLimit && !user.isAdmin) {
      return reply.status(403).send({
        error: "Plan limit reached",
        message: `Your current plan allows up to ${effectiveLimit} organization(s). Please upgrade to create more.`,
      });
    }

    const body = createOrgSchema.parse(request.body);

    const existing = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, body.slug))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Slug already taken" });
    }

    const [org] = await db
      .insert(schema.organizations)
      .values({
        name: body.name,
        slug: body.slug,
        description: body.description,
        website: body.website,
      })
      .returning();

    // Make creator the owner
    await db.insert(schema.organizationMembers).values({
      organizationId: org.id,
      userId: userId,
      role: "owner",
    });

    return reply.status(201).send(org);
  });

  // Get organization by slug (public)
  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const [org] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, slug))
      .limit(1);

    if (!org) {
      return reply.status(404).send({ error: "Organization not found" });
    }

    const memberCount = await db
      .select()
      .from(schema.organizationMembers)
      .where(eq(schema.organizationMembers.organizationId, org.id));

    const followerCount = await db
      .select()
      .from(schema.followers)
      .where(eq(schema.followers.organizationId, org.id));

    const publicMembers = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatar: schema.users.avatar,
        role: schema.organizationMembers.role,
      })
      .from(schema.organizationMembers)
      .innerJoin(schema.users, eq(schema.organizationMembers.userId, schema.users.id))
      .where(
        and(
          eq(schema.organizationMembers.organizationId, org.id),
          eq(schema.organizationMembers.isPublic, true)
        )
      );

    return {
      ...org,
      memberCount: memberCount.length,
      followerCount: followerCount.length,
      publicMembers,
    };
  });

  // Update organization
  app.put("/:id", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { id } = request.params as { id: string };
    const body = request.body as any;

    const [member] = await db
      .select()
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.organizationId, parseInt(id)),
          eq(schema.organizationMembers.userId, userId)
        )
      )
      .limit(1);

    if (!member || !["owner", "admin"].includes(member.role)) {
      return reply.status(403).send({ error: "Not authorized" });
    }

    const [org] = await db
      .update(schema.organizations)
      .set({
        name: body.name,
        description: body.description,
        website: body.website,
        logo: body.logo,
        banner: body.banner,
      })
      .where(eq(schema.organizations.id, parseInt(id)))
      .returning();

    return org;
  });

  // Delete organization
  app.delete("/:id", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { id } = request.params as { id: string };

    // Check if user is owner
    const [member] = await db
      .select()
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.organizationId, parseInt(id)),
          eq(schema.organizationMembers.userId, userId),
          eq(schema.organizationMembers.role, "owner")
        )
      )
      .limit(1);

    if (!member) {
      return reply.status(403).send({ error: "Only the owner can delete an organization" });
    }

    await db
      .delete(schema.organizations)
      .where(eq(schema.organizations.id, parseInt(id)));

    return { success: true };
  });

  // Get organization members
  app.get("/:id/members", async (request, reply) => {
    const { id } = request.params as { id: string };
    const members = await db
      .select({
        id: schema.organizationMembers.id,
        role: schema.organizationMembers.role,
        isPublic: schema.organizationMembers.isPublic,
        userId: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
      })
      .from(schema.organizationMembers)
      .innerJoin(
        schema.users,
        eq(schema.organizationMembers.userId, schema.users.id)
      )
      .where(eq(schema.organizationMembers.organizationId, parseInt(id)));

    return members;
  });

  // Remove member
  app.delete("/:id/members/:memberId", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { id, memberId } = request.params as { id: string; memberId: string };

    const [member] = await db
      .select()
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.organizationId, parseInt(id)),
          eq(schema.organizationMembers.userId, userId)
        )
      )
      .limit(1);

    if (!member || !["owner", "admin"].includes(member.role)) {
      return reply.status(403).send({ error: "Not authorized" });
    }

    await db
      .delete(schema.organizationMembers)
      .where(eq(schema.organizationMembers.id, parseInt(memberId)));

    return { success: true };
  });

  // --- INVITES ---

  // Send invite by email
  app.post("/:id/invites", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { id } = request.params as { id: string };
    const { email, role } = request.body as { email: string; role: string };

    if (user.email.toLowerCase() === email.toLowerCase()) {
      return reply.status(400).send({ error: "You cannot invite yourself" });
    }

    // Check caller is admin/owner
    const [caller] = await db
      .select()
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.organizationId, parseInt(id)),
          eq(schema.organizationMembers.userId, userId)
        )
      )
      .limit(1);

    if (!caller || !["owner", "admin"].includes(caller.role)) {
      return reply.status(403).send({ error: "Not authorized" });
    }

    // Get org name for notification
    const [org] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, parseInt(id)))
      .limit(1);

    // Create the invite
    const [invite] = await db
      .insert(schema.organizationInvites)
      .values({
        organizationId: parseInt(id),
        email: email.toLowerCase(),
        role: (role || "viewer") as any,
      })
      .onConflictDoNothing()
      .returning();

    if (!invite) {
      return reply.status(409).send({ error: "An invite for this email already exists" });
    }

    // If user already exists, send them a notification
    const [targetUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1);

    if (targetUser) {
      await db.insert(schema.notifications).values({
        userId: targetUser.id,
        type: "org_invite",
        title: `Invitation to join ${org.name}`,
        message: `You've been invited to join ${org.name} as a ${role || "viewer"}.`,
        link: `/invites/${invite.id}`,
        read: false,
      }).onConflictDoNothing();
    }

    return reply.status(201).send(invite);
  });

  // List pending invites for an org
  app.get("/:id/invites", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { id } = request.params as { id: string };
    const invites = await db
      .select()
      .from(schema.organizationInvites)
      .where(
        and(
          eq(schema.organizationInvites.organizationId, parseInt(id)),
          eq(schema.organizationInvites.status, "pending")
        )
      );

    return invites;
  });

  // Revoke an invite
  app.delete("/:id/invites/:inviteId", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { inviteId } = request.params as { id: string; inviteId: string };
    await db
      .delete(schema.organizationInvites)
      .where(eq(schema.organizationInvites.id, parseInt(inviteId)));

    return { success: true };
  });

  // Accept an invite
  app.post("/invites/:inviteId/accept", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { inviteId } = request.params as { inviteId: string };

    const [invite] = await db
      .select()
      .from(schema.organizationInvites)
      .where(eq(schema.organizationInvites.id, parseInt(inviteId)))
      .limit(1);

    if (!invite) return reply.status(404).send({ error: "Invite not found" });
    if (invite.status !== "pending") return reply.status(400).send({ error: "Invite already actioned" });

    // Verify email matches
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return reply.status(403).send({ error: "This invite is not for your account" });
    }

    // Add to org
    await db.insert(schema.organizationMembers).values({
      organizationId: invite.organizationId,
      userId: userId,
      role: invite.role,
    }).onConflictDoNothing();

    // Mark invite accepted
    await db
      .update(schema.organizationInvites)
      .set({ status: "accepted" })
      .where(eq(schema.organizationInvites.id, parseInt(inviteId)));

    // Mark related notification as read
    await db
      .update(schema.notifications)
      .set({ read: true })
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.link, `/invites/${inviteId}`)
        )
      );

    return { success: true };
  });

  // Decline an invite
  app.post("/invites/:inviteId/decline", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { inviteId } = request.params as { inviteId: string };

    await db
      .update(schema.organizationInvites)
      .set({ status: "declined" })
      .where(eq(schema.organizationInvites.id, parseInt(inviteId)));

    return { success: true };
  });

  // Toggle my visibility in organization
  app.put("/:id/members/me/visibility", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { id } = request.params as { id: string };
    const { isPublic } = request.body as { isPublic: boolean };

    const [updated] = await db
      .update(schema.organizationMembers)
      .set({ isPublic })
      .where(
        and(
          eq(schema.organizationMembers.organizationId, parseInt(id)),
          eq(schema.organizationMembers.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: "Member not found" });
    }

    return updated;
  });

  // Get user's organizations
  app.get("/user/mine", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const orgs = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        slug: schema.organizations.slug,
        description: schema.organizations.description,
        logo: schema.organizations.logo,
        role: schema.organizationMembers.role,
      })
      .from(schema.organizationMembers)
      .innerJoin(
        schema.organizations,
        eq(schema.organizationMembers.organizationId, schema.organizations.id)
      )
      .where(eq(schema.organizationMembers.userId, userId));

    return orgs;
  });
}

