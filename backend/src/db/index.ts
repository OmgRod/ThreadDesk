import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL || "postgres://threaddesk:threaddesk_dev@localhost:5432/threaddesk";

const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });
export { schema };