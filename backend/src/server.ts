import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import formbody from "@fastify/formbody";
import fastifyStatic from "@fastify/static";
import path from "path";
import { redis } from "./services/redis.js";
import { authRoutes } from "./routes/auth.js";
import { organizationRoutes } from "./routes/organizations.js";
import { postRoutes } from "./routes/posts.js";
import { commentRoutes } from "./routes/comments.js";
import { reactionRoutes } from "./routes/reactions.js";
import { followerRoutes } from "./routes/followers.js";
import { feedRoutes } from "./routes/feed.js";
import { notificationRoutes } from "./routes/notifications.js";
import { workflowRoutes } from "./routes/workflows.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { adminRoutes } from "./routes/admin.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { messageRoutes } from "./routes/messages.js";
import { uploadRoutes } from "./routes/upload.js";
import { rssRoutes } from "./routes/rss.js";
import { userRoutes } from "./routes/users.js";
import { billingRoutes } from "./routes/billing.js";
import { scheduledQueue } from "./services/workflowQueue.js";
import { db, schema } from './db/index.js';
import { eq } from "drizzle-orm";

const PORT = parseInt(process.env.PORT || "3002");
const HOST = process.env.HOST || "0.0.0.0";

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});

// Plugins
await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cors, {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
});
await app.register(cookie);
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 }, attachFieldsToBody: true });
await app.register(formbody);
// Add rawBody for webhook signature verification
await app.register(async (app) => {
    app.addHook('preValidation', async (request, reply) => {
        // This is a simplified way to capture raw body for specific routes
        if ((request as any).rawBody === undefined && request.body) {
            (request as any).rawBody = JSON.stringify(request.body);
        }
    });
});
await app.register(fastifyStatic, {
  root: path.join(process.cwd(), "public"),
  prefix: "/api/uploads",
});
await app.register(rateLimit, {
  max: 500,
  timeWindow: "1 minute",
  redis: redis,
});

// Routes
await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(organizationRoutes, { prefix: "/api/orgs" });
await app.register(postRoutes, { prefix: "/api/posts" });
await app.register(commentRoutes, { prefix: "/api/comments" });
await app.register(reactionRoutes, { prefix: "/api/reactions" });
await app.register(followerRoutes, { prefix: "/api/followers" });
await app.register(feedRoutes, { prefix: "/api/feed" });
await app.register(notificationRoutes, { prefix: "/api/notifications" });
await app.register(workflowRoutes, { prefix: "/api/workflows" });
await app.register(analyticsRoutes, { prefix: "/api/analytics" });
await app.register(adminRoutes, { prefix: "/api/admin" });
await app.register(webhookRoutes, { prefix: "/api/webhooks" });
await app.register(messageRoutes, { prefix: "/api/messages" });
await app.register(uploadRoutes, { prefix: "/api/upload" });
await app.register(rssRoutes, { prefix: "/api/rss" });
await app.register(userRoutes, { prefix: "/api/users" });
await app.register(billingRoutes, { prefix: "/api/billing" });

// Health check
app.get("/api/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Start server
try {
  await app.listen({ port: PORT, host: HOST });
  
  // Set first user as admin if not already
  const [firstUser] = await db.select().from(schema.users).where(eq(schema.users.id, 1)).limit(1);
  if (firstUser && !firstUser.isAdmin) {
    await db.update(schema.users).set({ isAdmin: true }).where(eq(schema.users.id, 1));
    console.log("Admin privileges granted to user ID 1.");
  }

  // Add periodic task to poll for scheduled posts
  await scheduledQueue.add("poll-scheduled", {}, {
    repeat: {
      every: 60000 // Poll every minute
    }
  });

  console.log(`Server running at http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}