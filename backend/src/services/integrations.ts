export const Integrations = {
  EMAIL: { id: "email", label: "Email", icon: "Mail" },
  DISCORD: { id: "discord", label: "Discord", icon: "MessageCircle" },
  HTTP: { id: "http", label: "HTTP Webhook", icon: "Webhook" },
  SLACK: { id: "slack", label: "Slack", icon: "MessageCircle" },
};

export const getIntegrationSecrets = (integrationId: string) => {
  switch (integrationId) {
    case "email":
      // These are no longer globally required, as they will be provided per-post/per-action
      return [];
    case "discord":
      return ["DISCORD_WEBHOOK_URL"];
    case "slack":
      return ["SLACK_WEBHOOK_URL"];
    default:
      return [];
  }
};

