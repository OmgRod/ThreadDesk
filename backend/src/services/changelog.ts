import axios from "axios";
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

    return {
      version: releases[0].tag_name,
      body: releases[0].body,
    };
  } catch (error) {
    console.error("Failed to fetch GitHub releases:", error);
    return null;
  }
}
