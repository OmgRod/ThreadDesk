import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import axios from "axios";
import { workflowQueue } from "./workflowQueue.js";

export const WorkflowEngine = {
  async trigger(organizationId: number, triggerType: string, payload: any) {
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

  async executeDiscordAction(action: any, payload: any) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      await axios.post(action.config.webhookUrl, {
        content: `## **${payload.title}**\n\n${payload.content}\n\n-# This post was automated using [ThreadDesk](${frontendUrl}).`,
      });
      console.log(`Discord webhook sent to ${action.config.webhookUrl}`);
    } catch (error) {
      console.error(`Failed to send Discord webhook to ${action.config.webhookUrl}:`, error);
      throw error; // Re-throw to trigger bullmq retry
    }
  },
};
