import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import axios from "axios";

const registerSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post("/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, body.email))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db
      .insert(schema.users)
      .values({
        name: body.name,
        email: body.email,
        passwordHash,
      })
      .returning();

    reply.setCookie("session", String(user.id), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return reply.status(201).send({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
    });
  });

  // Login
  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, body.email))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    // Set session cookie
    reply.setCookie("session", String(user.id), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
    };
  });

  // Change password
  app.post("/change-password", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const { currentPassword, newPassword } = request.body as { currentPassword: string; newPassword: string };

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, parseInt(userId)))
      .limit(1);

    if (!user) return reply.status(401).send({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return reply.status(400).send({ error: "Current password is incorrect" });

    if (!newPassword || newPassword.length < 8) {
      return reply.status(400).send({ error: "New password must be at least 8 characters" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, parseInt(userId)));

    return { success: true };
  });

  // Logout
  app.post("/logout", async (request, reply) => {
    reply.clearCookie("session", { path: "/" });
    return { success: true };
  });

  // Get current user
  app.get("/me", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) {
      return reply.status(401).send({ error: "Not authenticated" });
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, parseInt(userId)))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ error: "User not found" });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      website: user.website,
      isPublic: user.isPublic,
      emailPublic: user.emailPublic,
      plan: user.plan,
      isAdmin: user.isAdmin,
    };
  });

  // Twitter OAuth
  app.get("/twitter", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const codeVerifier = crypto.randomBytes(32).toString("hex");
    const state = crypto.randomBytes(16).toString("hex");
    
    // Store verifier and state in session or temp cache, but for now simple approach:
    reply.setCookie("twitter_verifier", codeVerifier, { path: "/", httpOnly: true });
    reply.setCookie("twitter_state", state, { path: "/", httpOnly: true });

    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

    const callbackUrl = process.env.TWITTER_CALLBACK_URL || "http://127.0.0.1:3000/api/auth/twitter/callback";

    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=tweet.read tweet.write users.read offline.access&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    
    return reply.redirect(authUrl);
  });

  app.get("/twitter/status", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const [connection] = await db
      .select({ username: schema.twitterConnections.twitterUsername })
      .from(schema.twitterConnections)
      .where(eq(schema.twitterConnections.userId, parseInt(userId)))
      .limit(1);

    return { connected: !!connection, username: connection?.username };
  });

  app.post("/twitter/disconnect", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    await db
      .delete(schema.twitterConnections)
      .where(eq(schema.twitterConnections.userId, parseInt(userId)));

    return { success: true };
  });

  app.get("/twitter/callback", async (request, reply) => {
    const userId = request.cookies.session;
    if (!userId) return reply.status(401).send({ error: "Not authenticated" });

    const { code, state } = request.query as { code: string; state: string };
    const savedState = request.cookies.twitter_state;
    const codeVerifier = request.cookies.twitter_verifier;

    if (state !== savedState) return reply.status(400).send({ error: "Invalid state" });
    
    const callbackUrl = process.env.TWITTER_CALLBACK_URL || "http://127.0.0.1:3000/api/auth/twitter/callback";

    // Exchange code for tokens
    const tokenResponse = await axios.post("https://api.x.com/2/oauth2/token", new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier || "",
    }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64")}`,
      },
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get Twitter User Info
    const userResponse = await axios.get("https://api.x.com/2/users/me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const twitterUser = userResponse.data.data;

    // Persist
    await db.insert(schema.twitterConnections).values({
      userId: parseInt(userId),
      twitterUserId: twitterUser.id,
      twitterUsername: twitterUser.username,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    });

    reply.clearCookie("twitter_verifier");
    reply.clearCookie("twitter_state");
    
    // Serve a simple HTML page to close the popup
    return reply.type('text/html').send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Twitter Auth</title>
        </head>
        <body>
          <p>Authentication successful, closing window...</p>
          <script>
            // Use localStorage to communicate success
            localStorage.setItem('twitter_auth_success', Date.now().toString());
            
            // Try postMessage as primary, but don't depend on it for flow
            if (window.opener) {
              window.opener.postMessage({ type: 'TWITTER_AUTH_SUCCESS' }, '*');
            }
            
            // Close immediately
            window.close();
          </script>
        </body>
      </html>
    `);
  });
}