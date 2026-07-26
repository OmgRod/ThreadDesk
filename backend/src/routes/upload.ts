import { FastifyInstance } from "fastify";
import fs from "fs";
import path from "path";
import util from "util";
import { pipeline } from "stream";
import { randomUUID } from "crypto";
import { getUserFromToken } from "../middleware/auth.js";

const pump = util.promisify(pipeline);

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) return reply.status(401).send({ error: "Not authenticated" });
    const userId = user.id;

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: "No file uploaded" });
    }

    const filename = `${randomUUID()}-${data.filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await pump(data.file, fs.createWriteStream(filePath));

    // Return the URL path
    return { url: `/api/uploads/uploads/${filename}` };
  });
}
