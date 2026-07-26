import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, desc, count, sql } from "drizzle-orm";
import { getUserFromToken } from "../middleware/auth.js";
export async function adminRoutes(app: FastifyInstance) {
  // Middleware to check admin status
  async function checkAdmin(request: any, reply: any) {
    const user = await getUserFromToken(request);

    if (!user || !user.isAdmin) {
      return reply.status(403).send({ error: "Not authorized" });
    }
    return user;
  }

  // Get platform stats

  app.get("/stats", async (request, reply) => {
    await checkAdmin(request, reply);

    const [userCount] = await db
      .select({ count: count() })
      .from(schema.users);
    const [orgCount] = await db
      .select({ count: count() })
      .from(schema.organizations);
    const [postCount] = await db
      .select({ count: count() })
      .from(schema.posts);
    const [messageCount] = await db
      .select({ count: count() })
      .from(schema.messages);

    // Trend: Users joined in last 7 days
    const userTrends = await db
      .select({
        date: sql<string>`DATE(${schema.users.createdAt})`,
        count: count(),
      })
      .from(schema.users)
      .groupBy(sql`DATE(${schema.users.createdAt})`)
      .orderBy(desc(sql`DATE(${schema.users.createdAt})`))
      .limit(7);

    // Trend: Messages sent in last 7 days
    const messageTrends = await db
      .select({
        date: sql<string>`DATE(${schema.messages.createdAt})`,
        count: count(),
      })
      .from(schema.messages)
      .groupBy(sql`DATE(${schema.messages.createdAt})`)
      .orderBy(desc(sql`DATE(${schema.messages.createdAt})`))
      .limit(7);

    return {
      users: userCount.count,
      organizations: orgCount.count,
      posts: postCount.count,
      messages: messageCount.count,
      userTrends: userTrends.reverse(),
      messageTrends: messageTrends.reverse(),
    };
  });

  // Get all users
  app.get("/users", async (request, reply) => {
    await checkAdmin(request, reply);
    const { page = 1, search = "" } = request.query as { page?: number; search?: string };
    const limit = 20;
    const offset = (page - 1) * limit;

    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        createdAt: schema.users.createdAt,
        isAdmin: schema.users.isAdmin,
        plan: schema.users.plan,
        maxOrganizations: schema.users.maxOrganizations,
        maxPostsPerMonth: schema.users.maxPostsPerMonth,
        hasAnalytics: schema.users.hasAnalytics,
        allowTeamMembers: schema.users.allowTeamMembers,
      })
      .from(schema.users)
      .where(
        search
          ? sql`${schema.users.name} ILIKE ${`%${search}%`} OR ${schema.users.email} ILIKE ${`%${search}%`}`
          : undefined
      )
      .orderBy(desc(schema.users.createdAt))
      .limit(limit)
      .offset(offset);

    return users;
  });

  // Get all organizations
  app.get("/organizations", async (request, reply) => {
    await checkAdmin(request, reply);
    const { page = 1, search = "" } = request.query as { page?: number; search?: string };
    const limit = 20;
    const offset = (page - 1) * limit;

    const orgs = await db
      .select()
      .from(schema.organizations)
      .where(
        search
          ? sql`${schema.organizations.name} ILIKE ${`%${search}%`} OR ${schema.organizations.slug} ILIKE ${`%${search}%`}`
          : undefined
      )
      .orderBy(desc(schema.organizations.createdAt))
      .limit(limit)
      .offset(offset);

    return orgs;
  });

  // Update user
  app.put("/users/:id", async (request, reply) => {
    await checkAdmin(request, reply);

    const { id } = request.params as { id: string };
    const { 
      name, 
      email, 
      isAdmin, 
      plan,
      maxOrganizations, 
      maxMessagesPerMonth, 
      allowedIntegrations, 
      hasAnalytics, 
      allowTeamMembers 
    } = request.body as any;

    await db
      .update(schema.users)
      .set({
        name,
        email,
        isAdmin,
        plan,
        maxOrganizations: maxOrganizations ?? null,
        maxPostsPerMonth: maxMessagesPerMonth ?? null,
        allowedIntegrations: allowedIntegrations ? JSON.stringify(allowedIntegrations) : null,
        hasAnalytics: hasAnalytics ?? false,
        allowTeamMembers: allowTeamMembers ?? false,
      })
      .where(eq(schema.users.id, id));

    return { success: true };
  });

  // Update user limits
  app.put("/users/:id/limits", async (request, reply) => {
    await checkAdmin(request, reply);

    const { id } = request.params as { id: string };
    const { 
      maxOrganizations, 
      maxMessagesPerMonth, 
      allowedIntegrations, 
      hasAnalytics, 
      allowTeamMembers 
    } = request.body as {
      maxOrganizations?: number;
      maxMessagesPerMonth?: number;
      allowedIntegrations?: string[];
      hasAnalytics?: boolean;
      allowTeamMembers?: boolean;
    };

    await db
      .update(schema.users)
      .set({
        maxOrganizations: maxOrganizations ?? null,
        maxPostsPerMonth: maxMessagesPerMonth ?? null,
        allowedIntegrations: allowedIntegrations ? JSON.stringify(allowedIntegrations) : null,
        hasAnalytics: hasAnalytics ?? false,
        allowTeamMembers: allowTeamMembers ?? false,
      })
      .where(eq(schema.users.id, id));

    return { success: true };
  });

  // Delete user
  app.delete("/users/:id", async (request, reply) => {
    await checkAdmin(request, reply);

    const { id } = request.params as { id: string };
    await db.delete(schema.users).where(eq(schema.users.id, id));
    return { success: true };
  });

  // Delete organization
  app.delete("/organizations/:id", async (request, reply) => {
    await checkAdmin(request, reply);

    const { id } = request.params as { id: string };
    await db
      .delete(schema.organizations)
      .where(eq(schema.organizations.id, parseInt(id)));
    return { success: true };
  });

  // Update organization
  app.put("/organizations/:id", async (request, reply) => {
    await checkAdmin(request, reply);

    const { id } = request.params as { id: string };
    const { name, description, website, verified } = request.body as {
      name?: string;
      description?: string;
      website?: string;
      verified?: boolean;
    };

    await db
      .update(schema.organizations)
      .set({
        name: name,
        description: description,
        website: website,
        verified: verified,
      })
      .where(eq(schema.organizations.id, parseInt(id)));

    return { success: true };
  });
}