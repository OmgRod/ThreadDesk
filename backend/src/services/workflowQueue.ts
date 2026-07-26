import { Queue, Worker } from "bullmq";
import { redis } from "./redis.js";
import { WorkflowEngine } from "./workflowEngine.js";
import { db, schema } from "../db/index.js";
import { eq, and, lt } from "drizzle-orm";

// Queue for workflow actions
export const workflowQueue = new Queue("workflow-actions", {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000, // 5s, 25s, 125s, 625s, 3125s
    },
  },
});

// Queue for scheduled tasks
export const scheduledQueue = new Queue("scheduled-tasks", {
  connection: redis,
});

// Worker to process workflow actions
export const workflowWorker = new Worker(
  "workflow-actions",
  async (job) => {
    const { organizationId, triggerType, payload, action } = job.data;
    console.log(`Processing action: ${action.type} for workflow trigger: ${triggerType}`);
    
    if (action.type === "webhook") {
      await WorkflowEngine.executeWebhookAction(action, payload);
    } else if (action.type === "discord") {
      await WorkflowEngine.executeDiscordAction(action, payload);
    } else if (action.type === "slack") {
      await WorkflowEngine.executeSlackAction(action, payload);
    } else if (action.type === "email") {
      await WorkflowEngine.executeEmailAction(action, payload);
    } else if (action.type === "twitter") {
      await WorkflowEngine.executeTwitterAction(action, payload);
    }
  },
  { connection: redis }
);

// Worker to process scheduled tasks
export const scheduledWorker = new Worker(
  "scheduled-tasks",
  async (job) => {
    const now = new Date();
    const workflows = await db
      .select()
      .from(schema.workflows)
      .where(and(
        eq(schema.workflows.trigger, "scheduled"),
        eq(schema.workflows.active, true)
      ));

    for (const workflow of workflows) {
      const config = JSON.parse(workflow.triggerConfig || "{}");
      if (!config.frequency || !config.time) continue;

      const [hours, minutes] = config.time.split(":").map(Number);
      const isMatch = now.getHours() === hours && now.getMinutes() === minutes;

      if (isMatch) {
        // Simple check to ensure we don't trigger multiple times in the same minute
        // In a real app, use a "lastRun" timestamp in the workflow table
        
        const postsToProcess = await db
          .select()
          .from(schema.posts)
          .where(and(
            eq(schema.posts.organizationId, workflow.organizationId),
            eq(schema.posts.published, false)
          ));

        for (const post of postsToProcess) {
          await WorkflowEngine.trigger(workflow.organizationId, "scheduled", post);
          // Mark as published to avoid re-triggering immediately
          await db.update(schema.posts)
            .set({ published: true })
            .where(eq(schema.posts.id, post.id));
        }
      }
    }
  },
  { connection: redis }
);

workflowWorker.on("error", (err) => {
  console.error("Workflow Worker Error:", err);
});
