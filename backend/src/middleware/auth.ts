import jwt from "jsonwebtoken";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-placeholder";

export async function getUserFromSession(request: any) {
  return await getUserFromToken(request);
}

export async function getUserFromToken(request: any) {
  const token = request.cookies.session;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, decoded.userId))
      .limit(1);

    return user || null;
  } catch (error) {
    return null;
  }
}
