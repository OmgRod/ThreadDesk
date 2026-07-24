import { Queue, Worker } from "bullmq";
import { redis } from "./redis.js";
import { WorkflowEngine } from "./workflowEngine.js";

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
    }
  },
  { connection: redis }
);

workflowWorker.on("error", (err) => {
  console.error("Workflow Worker Error:", err);
});
