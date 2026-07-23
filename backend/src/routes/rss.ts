import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { schema } from "../db/index.js";
import { eq, desc, and } from "drizzle-orm";
import RSS from "rss";

export async function rssRoutes(app: FastifyInstance) {
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

    const posts = await db
      .select()
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.organizationId, org.id),
          eq(schema.posts.published, true),
          eq(schema.posts.visibility, "public")
        )
      )
      .orderBy(desc(schema.posts.createdAt))
      .limit(20);

    const feed = new RSS({
      title: `${org.name} on ThreadDesk`,
      description: org.description || `Updates from ${org.name}`,
      feed_url: `${process.env.FRONTEND_URL}/api/rss/${slug}`,
      site_url: `${process.env.FRONTEND_URL}/orgs/${slug}`,
      image_url: org.logo || undefined,
      pubDate: new Date(),
    });

    for (const post of posts) {
      feed.item({
        title: post.title,
        description: post.content.slice(0, 500) + (post.content.length > 500 ? "..." : ""),
        url: `${process.env.FRONTEND_URL}/orgs/${slug}/posts/${post.id}`,
        date: post.createdAt,
      });
    }

    reply.header("Content-Type", "application/xml");
    return feed.xml();
  });
}
