import { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const workflowSchema = z.object({
  organizationId: z.number().int(),
  name: z.string().min(1).max(255),
  trigger: z.enum(["new_post", "scheduled", "incoming_webhook"]),
  triggerConfig: z.string().optional(),
  actions: z.string(), // JSON string
});

export async function workflowRoutes(app: FastifyInstance) {
  // Create workflow
  app.post("/", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const body = workflowSchema.parse(request.body);

    // Check membership
    const [member] = await db
      .select()
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.organizationId, body.organizationId),
          eq(schema.organizationMembers.userId, parseInt(userId))
        )
      )
      .limit(1);

    if (!member || !["owner", "admin", "editor"].includes(member.role)) {
      return reply.status(403).send({ error: "Not authorized" });
    }

    const [workflow] = await db
      .insert(schema.workflows)
      .values({
        organizationId: body.organizationId,
        name: body.name,
        trigger: body.trigger,
        triggerConfig: body.triggerConfig,
        actions: body.actions,
      })
      .returning();

    return reply.status(201).send(workflow);
  });

  // Get workflows for organization
  app.get("/org/:orgId", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const workflows = await db
      .select()
      .from(schema.workflows)
      .where(eq(schema.workflows.organizationId, parseInt(orgId)))
      .orderBy(desc(schema.workflows.createdAt));

    return workflows;
  });

  // Update workflow
  app.put("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const [updated] = await db
      .update(schema.workflows)
      .set({
        name: body.name,
        trigger: body.trigger,
        triggerConfig: body.triggerConfig,
        actions: body.actions,
        active: body.active,
        updatedAt: new Date(),
      })
      .where(eq(schema.workflows.id, parseInt(id)))
      .returning();

    return updated;
  });

  // Delete workflow
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await db
      .delete(schema.workflows)
      .where(eq(schema.workflows.id, parseInt(id)));

    return { success: true };
  });
}