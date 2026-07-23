import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, desc, count } from "drizzle-orm";

export async function adminRoutes(app: FastifyInstance) {
  // Middleware to check admin (user id 1 for simplicity)
  async function checkAdmin(request: any, reply: any) {
    const userId = request.cookies.session;
    if (!userId || parseInt(userId) !== 1) {
      return reply.status(403).send({ error: "Not authorized" });
    }
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

    return {
      users: userCount.count,
      organizations: orgCount.count,
      posts: postCount.count,
    };
  });

  // Get all users
  app.get("/users", async (request, reply) => {
    await checkAdmin(request, reply);

    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(100);

    return users;
  });

  // Get all organizations
  app.get("/organizations", async (request, reply) => {
    await checkAdmin(request, reply);

    const orgs = await db
      .select()
      .from(schema.organizations)
      .orderBy(desc(schema.organizations.createdAt))
      .limit(100);

    return orgs;
  });

  // Delete user
  app.delete("/users/:id", async (request, reply) => {
    await checkAdmin(request, reply);

    const { id } = request.params as { id: string };
    await db.delete(schema.users).where(eq(schema.users.id, parseInt(id)));
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
}