import { FastifyInstance, FastifyRequest } from "fastify";
import { db } from "../db/index.js";
import { schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const LEMON_SQUEEZY_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "";

// Helper to get raw body
const getRawBody = (req: FastifyRequest) => {
    return (req as any).rawBody || JSON.stringify(req.body);
};

export async function webhookRoutes(app: FastifyInstance) {
  // Lemon Squeezy Webhook
  app.post("/lemon", {
      config: {
          rawBody: true
      }
  }, async (request, reply) => {
    const rawBody = getRawBody(request);
    const signature = request.headers["x-signature"] as string;

    if (!signature) {
      return reply.status(400).send({ error: "No signature" });
    }

    const hmac = crypto.createHmac("sha256", LEMON_SQUEEZY_WEBHOOK_SECRET);
    const digest = hmac.update(rawBody).digest("hex");

    if (signature !== digest) {
      return reply.status(401).send({ error: "Invalid signature" });
    }

    const payload = request.body as any;
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;
    const userId = customData?.user_id;

    if (!userId) {
      return reply.status(200).send({ message: "No user ID in custom data" });
    }

    const attributes = payload.data.attributes;
    const subscriptionId = payload.data.id;

    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const variantId = attributes.variant_id.toString();
      let plan: "free" | "starter" | "pro" | "business" = "free";

      // Map variant IDs to plans (these should be in env or a config)
      if (variantId === process.env.LS_STARTER_VARIANT_ID) plan = "starter";
      else if (variantId === process.env.LS_PRO_VARIANT_ID) plan = "pro";
      else if (variantId === process.env.LS_BUSINESS_VARIANT_ID) plan = "business";

      // Update user plan
      await db.update(schema.users).set({ plan }).where(eq(schema.users.id, userId));

      // Upsert subscription
      const [existingSub] = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.lemonSqueezyId, subscriptionId))
        .limit(1);

      const subData = {
        userId: userId,
        lemonSqueezyId: subscriptionId,
        orderId: attributes.order_id?.toString(),
        variantId: variantId,
        productId: attributes.product_id.toString(),
        status: attributes.status as any,
        cardBrand: attributes.card_brand,
        cardLastFour: attributes.card_last_four,
        renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
        endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
        updatedAt: new Date(),
      };

      if (existingSub) {
        await db.update(schema.subscriptions).set(subData).where(eq(schema.subscriptions.id, existingSub.id));
      } else {
        await db.insert(schema.subscriptions).values(subData);
      }
    } else if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
      // Reset user plan to free if subscription ends
      await db.update(schema.users).set({ plan: "free" }).where(eq(schema.users.id, userId));

      // Update subscription status
      await db
        .update(schema.subscriptions)
        .set({
          status: attributes.status as any,
          endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.subscriptions.lemonSqueezyId, subscriptionId));
    }

    return { success: true };
  });

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