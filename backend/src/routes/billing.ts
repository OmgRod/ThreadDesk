import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import axios from "axios";
import { getUserFromToken } from "../middleware/auth.js";

const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;

// Plan Variant IDs (These should be set in environment variables)
const VARIANTS = {
  starter: process.env.LS_STARTER_VARIANT_ID,
  pro: process.env.LS_PRO_VARIANT_ID,
  business: process.env.LS_BUSINESS_VARIANT_ID,
};

export async function billingRoutes(app: FastifyInstance) {
  // Create a checkout session
  app.post("/checkout", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const { variantId } = request.body as { variantId: string };
    if (!variantId) return reply.status(400).send({ error: "Variant ID is required" });

    // User is already fetched from middleware at the top
    if (!user) return reply.status(404).send({ error: "User not found" });

    try {
      const response = await axios.post(
        "https://api.lemonsqueezy.com/v1/checkouts",
        {
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                email: user.email,
                custom: {
                  user_id: user.id.toString(),
                },
              },
            },
            relationships: {
              store: {
                data: {
                  type: "stores",
                  id: LEMON_SQUEEZY_STORE_ID,
                },
              },
              variant: {
                data: {
                  type: "variants",
                  id: variantId,
                },
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
        }
      );

      return { url: response.data.data.attributes.url };
    } catch (error: any) {
      app.log.error(error.response?.data || error.message);
      return reply.status(500).send({ error: "Failed to create checkout session" });
    }
  });

  // Get customer portal link
  app.get("/portal", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const [subscription] = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .limit(1);

    if (!subscription) {
      return reply.status(404).send({ error: "No active subscription found" });
    }

    try {
      const response = await axios.get(
        `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemonSqueezyId}`,
        {
          headers: {
            Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
            Accept: "application/vnd.api+json",
          },
        }
      );

      const portalUrl = response.data.data.attributes.urls.customer_portal;
      return { url: portalUrl };
    } catch (error: any) {
      app.log.error(error.response?.data || error.message);
      return reply.status(500).send({ error: "Failed to get customer portal link" });
    }
  });

  // Get current plan and subscription info
  app.get("/status", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const [userDb] = await db
      .select({
        plan: schema.users.plan,
        postsSentThisMonth: schema.users.postsSentThisMonth,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    const [subscription] = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .limit(1);

    return {
      plan: userDb?.plan || "free",
      postsSentThisMonth: userDb?.postsSentThisMonth || 0,
      subscription: subscription || null,
    };
  });
}
