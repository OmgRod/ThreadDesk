import { FastifyInstance } from "fastify";

export async function webhookRoutes(app: FastifyInstance) {
  // Receive incoming webhook
  app.post("/incoming/:orgId", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const body = request.body;

    // Process incoming webhook data
    // This would trigger workflows based on the incoming data
    console.log(`Incoming webhook for org ${orgId}:`, JSON.stringify(body));

    return { success: true, received: true };
  });

  // Test sending a webhook
  app.post("/send", async (request, reply) => {
    const body = request.body as { url: string; payload: any };

    try {
      const response = await fetch(body.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body.payload),
      });

      return {
        success: response.ok,
        status: response.status,
      };
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to send webhook",
        message: (error as Error).message,
      });
    }
  });
}