import { FastifyInstance } from "fastify";
import { getUserFromToken } from "../middleware/auth.js";
import { getLatestRelease, acknowledgeChangelog } from "../services/changelog.js";

export async function changelogRoutes(app: FastifyInstance) {
  app.get("/status", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });

    const release = await getLatestRelease();
    
    // Check if user needs to see the update
    const isUpdateAvailable = release && release.version !== user.lastReadChangelogVersion;

    return {
      isUpdateAvailable,
      releaseNotes: release ? release.body : null,
      latestVersion: release ? release.version : null
    };
  });

  app.post("/acknowledge", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });

    const { version } = request.body as { version: string };
    await acknowledgeChangelog(user.id, version);
    
    return { success: true };
  });
}
