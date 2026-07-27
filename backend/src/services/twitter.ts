import axios from "axios";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import FormData from "form-data";

export const TwitterService = {
  async getValidToken(userId: string) {
    const [connection] = await db
      .select()
      .from(schema.twitterConnections)
      .where(eq(schema.twitterConnections.userId, userId))
      .limit(1);

    if (!connection) throw new Error("Twitter account not connected");

    // Check expiry (with 1-minute buffer)
    if (connection.expiresAt && connection.expiresAt.getTime() < Date.now() + 60000) {
      if (!connection.refreshToken) throw new Error("No refresh token available");

      // Refresh
      const response = await axios.post("https://api.x.com/2/oauth2/token", new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: connection.refreshToken,
      }), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64")}`,
        },
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      await db.update(schema.twitterConnections)
        .set({
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000),
        })
        .where(eq(schema.twitterConnections.id, connection.id));

      return access_token;
    }

    return connection.accessToken;
  },

  async uploadMedia(userId: string, mediaUrl: string) {
    const accessToken = await this.getValidToken(userId);
    // Simplified: download and upload to Twitter.
    // In production, use chunked upload for large files.
    const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const formData = new FormData();
    formData.append('media', mediaResponse.data);

    const uploadResponse = await axios.post("https://upload.twitter.com/1.1/media/upload.json", formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${accessToken}`,
      },
      params: { command: 'INIT', total_bytes: mediaResponse.data.length, media_type: mediaResponse.headers['content-type'] }
    });
    // Further steps: APPEND, FINALIZE
    return uploadResponse.data.media_id_string;
  },

  async postTweet(userId: string, text: string, mediaUrls: string[] = []) {
    let accessToken = await this.getValidToken(userId);
    const mediaIds = [];
    
    // Limit to 3 attachments
    for (const url of mediaUrls.slice(0, 3)) {
      mediaIds.push(await this.uploadMedia(userId, url));
    }

    try {
      await axios.post("https://api.x.com/2/tweets", { 
        text,
        ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } })
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log("Token expired, refreshing and retrying...");
        // Invalidate cache or force refresh logic could be added here if getValidToken didn't handle it
        // For now, retry with new token if getValidToken refreshed it
        accessToken = await this.refreshAndGetToken(userId);
        await axios.post("https://api.x.com/2/tweets", { 
          text,
          ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } })
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        throw error;
      }
    }
  },

  async refreshAndGetToken(userId: string) {
    const [connection] = await db
      .select()
      .from(schema.twitterConnections)
      .where(eq(schema.twitterConnections.userId, userId))
      .limit(1);

    if (!connection || !connection.refreshToken) throw new Error("No refresh token available");

    const response = await axios.post("https://api.x.com/2/oauth2/token", new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
    }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64")}`,
      },
    });

    const { access_token, refresh_token, expires_in } = response.data;
    
    await db.update(schema.twitterConnections)
      .set({
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      })
      .where(eq(schema.twitterConnections.id, connection.id));

    return access_token;
  },
};
