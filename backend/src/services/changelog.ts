import axios from "axios";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { execSync } from "child_process";

// Get current commit hash
const CURRENT_COMMIT = execSync("git rev-parse HEAD").toString().trim();

export async function getLatestRelease() {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    
    if (!owner || !repo) return null;

    // Fetch releases
    const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases`);
    const releases = res.data;

    // Find the release associated with the current commit or the latest one
    // For simplicity, we compare commit hashes if available in release data
    // Or just return the latest release if no exact match
    return {
      version: releases[0].tag_name,
      body: releases[0].body,
    };
  } catch (error) {
    console.error("Failed to fetch GitHub releases:", error);
    return null;
  }
}

export async function acknowledgeChangelog(userId: string, version: string) {
  await db
    .update(schema.users)
    .set({ lastReadChangelogVersion: version })
    .where(eq(schema.users.id, userId));
}
