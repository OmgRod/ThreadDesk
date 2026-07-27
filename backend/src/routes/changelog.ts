import { FastifyInstance } from "fastify";
import { getLatestRelease } from "../services/changelog.js";

export async function changelogRoutes(app: FastifyInstance) {
  app.get("/status", async (request, reply) => {
    const release = await getLatestRelease();
    
    return {
      releaseNotes: release ? release.body : null,
      latestVersion: release ? release.version : null
    };
  });
}
