export const Integrations = {
  EMAIL: { id: "email", label: "Email", icon: "Mail" },
  DISCORD: { id: "discord", label: "Discord", icon: "MessageCircle" },
  HTTP: { id: "http", label: "HTTP Webhook", icon: "Webhook" },
  SLACK: { id: "slack", label: "Slack", icon: "MessageCircle" },
  TWITTER: { id: "twitter", label: "X / Twitter", icon: "Twitter" },
  LINKEDIN: { id: "linkedin", label: "LinkedIn", icon: "Linkedin" },
  YOUTUBE: { id: "youtube", label: "YouTube Community", icon: "Play" },
  BLUESKY: { id: "bluesky", label: "Bluesky", icon: "Globe" },
};

export const getIntegrationSecrets = (integrationId: string) => {
  switch (integrationId) {
    // case "email":
    //   // User must provide these for their own mail server
    //   return ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
    // case "discord":
    //   return ["DISCORD_WEBHOOK_URL"];
    case "slack":
      return ["SLACK_WEBHOOK_URL"];
    case "twitter":
      return ["TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET"];
    case "linkedin":
      return ["LINKEDIN_ACCESS_TOKEN"];
    case "youtube":
      return ["YOUTUBE_API_KEY"];
    case "bluesky":
      return ["BLUESKY_HANDLE", "BLUESKY_PASSWORD"];
    default:
      return [];
  }
};
