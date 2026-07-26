import 'dotenv/config';

import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["owner", "admin", "editor", "viewer"]);
export const visibilityEnum = pgEnum("visibility", [
  "public",
  "followers",
  "members",
  "unlisted",
]);
export const reactionTypeEnum = pgEnum("reaction_type", ["like", "love", "laugh", "wow", "sad", "angry"]);
export const inviteStatusEnum = pgEnum("invite_status", ["pending", "accepted", "declined"]);
export const planEnum = pgEnum("plan", ["free", "starter", "pro", "business"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired", "past_due", "on_trial", "unpaid"]);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  website: varchar("website", { length: 500 }),
  isPublic: boolean("is_public").default(true).notNull(),
  emailPublic: boolean("email_public").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  plan: planEnum("plan").default("free").notNull(),
  maxOrganizations: integer("max_organizations"),
  maxPostsPerMonth: integer("max_posts_per_month"),
  allowedIntegrations: text("allowed_integrations"), // JSON array of strings
  hasAnalytics: boolean("has_analytics").default(false).notNull(),
  allowTeamMembers: boolean("allow_team_members").default(false).notNull(),
  postsSentThisMonth: integer("posts_sent_this_month").default(0).notNull(),
  lastPostReset: timestamp("last_post_reset").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lemonSqueezyId: varchar("lemonsqueezy_id", { length: 255 }).notNull().unique(),
  orderId: varchar("order_id", { length: 255 }),
  variantId: varchar("variant_id", { length: 255 }).notNull(),
  productId: varchar("product_id", { length: 255 }).notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  cardBrand: varchar("card_brand", { length: 255 }),
  cardLastFour: varchar("card_last_four", { length: 4 }),
  renewsAt: timestamp("renews_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organizations
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  logo: text("logo"),
  banner: text("banner"),
  website: varchar("website", { length: 500 }),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Organization Members
export const organizationMembers = pgTable(
  "organization_members",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("viewer"),
    isPublic: boolean("is_public").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueMembership: uniqueIndex("unique_membership").on(
      table.organizationId,
      table.userId
    ),
  })
);

// Posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  visibility: visibilityEnum("visibility").notNull().default("public"),
  published: boolean("published").default(false).notNull(),
  scheduledDate: timestamp("scheduled_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reactions
export const reactions = pgTable(
  "reactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .references(() => posts.id, { onDelete: "cascade" }),
    commentId: integer("comment_id")
      .references(() => comments.id, { onDelete: "cascade" }),
    type: reactionTypeEnum("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueReaction: uniqueIndex("unique_reaction").on(
      table.userId,
      table.postId,
      table.commentId,
      table.type
    ),
  })
);

// Followers
export const followers = pgTable(
  "followers",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueFollow: uniqueIndex("unique_follow").on(
      table.organizationId,
      table.userId
    ),
  })
);

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  read: boolean("read").default(false).notNull(),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Automation Workflows
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  trigger: varchar("trigger", { length: 50 }).notNull(),
  triggerConfig: text("trigger_config"),
  actions: text("actions").notNull(), // JSON array of actions
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organization Invites
export const organizationInvites = pgTable(
  "organization_invites",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: roleEnum("role").notNull().default("viewer"),
    status: inviteStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueInvite: uniqueIndex("unique_invite").on(table.organizationId, table.email),
  })
);

// Direct Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Twitter Connections
export const twitterConnections = pgTable("twitter_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  twitterUserId: varchar("twitter_user_id", { length: 255 }).notNull(),
  twitterUsername: varchar("twitter_username", { length: 255 }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User SMTP Configs
export const userSmtpConfigs = pgTable("user_smtp_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  host: varchar("host", { length: 255 }).notNull(),
  port: integer("port").notNull(),
  user: varchar("user", { length: 255 }).notNull(),
  password: text("password").notNull(),
  secure: boolean("secure").default(true).notNull(),
  from: varchar("from", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Analytics Events
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  postId: integer("post_id").references(() => posts.id, {
    onDelete: "set null",
  }),
  event: varchar("event", { length: 50 }).notNull(),
  metadata: text("metadata"), // JSON string
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Post Attachments
export const postAttachments = pgTable("post_attachments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'image' or 'video'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Post Publications
export const postPublications = pgTable("post_publications", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  platform: varchar("platform", { length: 50 }).notNull(), // e.g., 'twitter', 'discord', 'slack'
  publishedAt: timestamp("published_at").defaultNow().notNull(),
});
