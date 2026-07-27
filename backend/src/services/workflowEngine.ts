import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import axios from "axios";
import { workflowQueue } from "./workflowQueue.js";
import { TwitterService } from "./twitter.js";
import { createBlueskyPost } from "./bluesky.js";
import nodemailer from "nodemailer";

// Setup transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const WorkflowEngine = {
  async trigger(organizationId: number, triggerType: string, post: any) {
    // 1. Fetch active workflows for this org and trigger type
    const workflows = await db
      .select()
      .from(schema.workflows)
      .where(
        and(
          eq(schema.workflows.organizationId, organizationId),
          eq(schema.workflows.trigger, triggerType),
          eq(schema.workflows.active, true)
        )
      );

    // 2. Fetch attachments
    const attachments = await db
      .select()
      .from(schema.postAttachments)
      .where(eq(schema.postAttachments.postId, post.id));

    const payload = { ...post, attachments: attachments.slice(0, 3) };

    for (const workflow of workflows) {
      try {
        const actions = JSON.parse(workflow.actions);
        for (const action of actions) {
          // Push to queue for background execution
          await workflowQueue.add("execute-action", {
            organizationId,
            triggerType,
            payload,
            action,
          });
        }
      } catch (error) {
        console.error(`Error queueing workflow ${workflow.id}:`, error);
      }
    }
  },

  async executeWebhookAction(action: any, payload: any) {
    try {
      await axios.post(action.config.url, {
        event: "new_post",
        data: payload,
      }, {
        headers: { "Content-Type": "application/json" }
      });
      console.log(`Webhook sent to ${action.config.url}`);
    } catch (error) {
      console.error(`Failed to send webhook to ${action.config.url}:`, error);
      throw error; // Re-throw to trigger bullmq retry
    }
  },

  async executeSlackAction(action: any, payload: any) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const postLink = `${frontendUrl}/orgs/${payload.organizationId}/posts/${payload.id}`;
      
      const blocks = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*<${postLink}|${payload.title}>*\n\n${payload.content}\n\n`
          }
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": "This post was automated using ThreadDesk."
            }
          ]
        },
        ...payload.attachments?.map((a: any) => ({
          "type": "image",
          "image_url": a.url,
          "alt_text": "Attachment"
        })) || []
      ];

      await axios.post(action.config.webhookUrl, {
        "blocks": blocks
      }, {
        headers: { "Content-Type": "application/json" }
      });
      console.log(`Slack webhook sent to ${action.config.webhookUrl}`);
    } catch (error) {
      console.error(`Failed to send Slack webhook to ${action.config.webhookUrl}:`, error);
      throw error;
    }
  },

  async executeEmailAction(action: any, payload: any) {
    try {
      const mailOptions = {
        from: action.config.fromEmail,
        to: action.config.to,
        subject: payload.title,
        text: payload.content,
        html: `
          <h1>${payload.title}</h1>
          <p>${payload.content}</p>
          ${payload.attachments?.map((a: any) => `<img src="${a.url}" alt="Attachment" style="max-width:100%;" />`).join('')}
        `,
        attachments: payload.attachments?.map((a: any) => ({
          path: a.url
        }))
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${action.config.to}`);
    } catch (error) {
      console.error(`Failed to send email:`, error);
      throw error;
    }
  },

  async executeTwitterAction(action: any, payload: any) {
    // Deduplication check
    const [alreadyPublished] = await db
      .select()
      .from(schema.postPublications)
      .where(and(eq(schema.postPublications.postId, payload.id), eq(schema.postPublications.platform, 'twitter')))
      .limit(1);

    if (alreadyPublished) {
      console.log(`Post ${payload.id} already published to twitter, skipping.`);
      return;
    }

    try {
      const mediaUrls = payload.attachments?.map((a: any) => a.url) || [];
      const tweetText = `${payload.title}\n\n${payload.content}`;
      await TwitterService.postTweet(payload.authorId, tweetText, mediaUrls);
      
      // Record publication
      await db.insert(schema.postPublications).values({
        postId: payload.id,
        platform: 'twitter',
      });
      
      console.log(`Tweet posted for user ${payload.authorId}`);
    } catch (error) {
      console.error(`Failed to post tweet:`, error);
      throw error;
    }
  },

  async executeDiscordAction(action: any, payload: any) {
    // Deduplication check
    const [alreadyPublished] = await db
      .select()
      .from(schema.postPublications)
      .where(and(eq(schema.postPublications.postId, payload.id), eq(schema.postPublications.platform, 'discord')))
      .limit(1);

    if (alreadyPublished) {
      console.log(`Post ${payload.id} already published to discord, skipping.`);
      return;
    }

    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const embeds = [
        {
          "title": payload.title,
          "description": payload.content,
          "url": `${frontendUrl}/orgs/${payload.organizationId}/posts/${payload.id}`,
          "color": 5814783,
          "footer": {
            "text": "This post was automated using ThreadDesk."
          },
          ...(payload.attachments?.[0] && { image: { url: payload.attachments[0].url } })
        },
        ...payload.attachments?.slice(1).map((a: any) => ({
          "url": `${frontendUrl}/orgs/${payload.organizationId}/posts/${payload.id}`,
          "image": { "url": a.url }
        })) || []
      ];

      await axios.post(action.config.webhookUrl, {
        "content": null,
        "embeds": embeds,
      });

      // Record publication
      await db.insert(schema.postPublications).values({
        postId: payload.id,
        platform: 'discord',
      });

      console.log(`Discord webhook sent to ${action.config.webhookUrl}`);
    } catch (error) {
      console.error(`Failed to send Discord webhook to ${action.config.webhookUrl}:`, error);
      throw error; // Re-throw to trigger bullmq retry
    }
  },

  async executeBlueskyAction(action: any, payload: any) {
    // Deduplication check
    const [alreadyPublished] = await db
      .select()
      .from(schema.postPublications)
      .where(and(eq(schema.postPublications.postId, payload.id), eq(schema.postPublications.platform, 'bluesky')))
      .limit(1);

    if (alreadyPublished) {
      console.log(`Post ${payload.id} already published to bluesky, skipping.`);
      return;
    }

    try {
      const postText = `${payload.title}\n\n${payload.content}\n\nThis post was automated using ThreadDesk.`;
      await createBlueskyPost(payload.authorId, postText);
      
      // Record publication
      await db.insert(schema.postPublications).values({
        postId: payload.id,
        platform: 'bluesky',
      });
      
      console.log(`Bluesky post created for user ${payload.authorId}`);
    } catch (error) {
      console.error(`Failed to create Bluesky post:`, error);
      throw error;
    }
  },
};
