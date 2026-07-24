export const Integrations = {
  EMAIL: { id: "email", label: "Email", icon: "Mail" },
  DISCORD: { id: "discord", label: "Discord", icon: "MessageCircle" },
  HTTP: { id: "http", label: "HTTP Webhook", icon: "Webhook" },
  SLACK: { id: "slack", label: "Slack", icon: "MessageCircle" },
};

export const getIntegrationSecrets = (integrationId: string) => {
  switch (integrationId) {
    case "email":
      // User must provide these for their own mail server
      return ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
    case "discord":
      return ["DISCORD_WEBHOOK_URL"];
    case "slack":
      return ["SLACK_WEBHOOK_URL"];
    default:
      return [];
  }
};

