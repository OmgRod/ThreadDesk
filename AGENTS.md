# ThreadDesk Development TODO

## Project Goal

Build ThreadDesk, an omnichannel communication platform where organizations can publish official updates, manage discussions, and distribute messages across multiple channels.

Public organization pages use:

/orgs/{organizationSlug}

Example:

/orgs/acme

---

# Phase 1 - Project Setup

## Setup
- [x] Create monorepo structure
- [x] Create Next.js frontend
- [x] Create Fastify backend
- [x] Configure TypeScript
- [x] Configure Tailwind CSS
- [x] Add Docker Compose
- [x] Add PostgreSQL container
- [x] Add Redis container
- [x] Add environment variable system
- [x] Create README

---

# Phase 2 - Database

## Setup database with Drizzle ORM

Create models:

## Users
- [x] User ID
- [x] Name
- [x] Email
- [x] Password hash
- [x] Avatar
- [x] Created timestamp

## Organizations
- [x] Organization ID
- [x] Name
- [x] Unique slug
- [x] Description
- [x] Logo
- [x] Banner
- [x] Website
- [x] Verification status
- [x] Created timestamp

## Organization Members
- [x] Link users to organizations
- [x] Add roles:
  - Owner
  - Admin
  - Editor
  - Viewer

## Posts
- [x] Organization ID
- [x] Author ID
- [x] Title
- [x] Content
- [x] Visibility
- [x] Published status
- [x] Scheduled date
- [x] Created timestamp

## Comments
- [x] Post ID
- [x] User ID
- [x] Parent comment support
- [x] Content

## Reactions
- [x] Post reactions
- [x] Comment reactions

## Followers
- [x] Follow organizations
- [x] Store follower relationships

---

# Phase 3 - Authentication

- [x] User registration
- [x] Login system
- [x] Logout
- [x] Password hashing
- [x] Session handling
- [x] Protected API routes
- [x] User profile page

---

# Phase 4 - Organizations

## Organization Management

- [x] Create organization
- [x] Edit organization details
- [x] Upload logo
- [x] Upload banner
- [x] Invite members
- [x] Remove members
- [x] Change member roles

## Public Organization Page

Create:

/orgs/{slug}

Example:

/orgs/nasa

Display:

- [x] Organization logo
- [x] Banner
- [x] Description
- [x] Website link
- [x] Follow button
- [x] Published posts

---

# Phase 5 - Post System

## Organization Dashboard

Create:

/dashboard

Features:

- [x] View organization posts
- [x] Create post
- [x] Edit post
- [x] Delete post
- [x] Schedule post

Post editor:

- [x] Rich text support
- [x] Markdown support
- [x] Image uploads
- [x] Attachments

Visibility:

- [x] Public
- [x] Followers only
- [x] Members only
- [x] Unlisted

---

# Phase 6 - Public Discussion

Implement:

/orgs/{slug}/posts/{postId}

Features:

- [x] View post
- [x] Comment
- [x] Reply to comments
- [x] Like/react
- [x] Report content

Support nested comments.

---

# Phase 7 - Following System

Users can:

- [x] Follow organizations
- [x] Unfollow organizations
- [x] View followed organizations

Create:

/feed

Features:

- [x] Show posts from followed organizations
- [x] Pagination
- [x] Infinite scrolling

---

# Phase 8 - Notifications

Implement:

- [x] In-app notifications
- [x] New post notifications
- [x] Reply notifications
- [x] Follow notifications

---

# Phase 9 - Automation System

Create automation engine.

Workflow format:

Trigger -> Actions

Example:

New post published
|
+ Send email
|
+ Send Discord webhook
|
+ Send HTTP webhook


Triggers:

- [x] New post
- [x] Scheduled event
- [x] Incoming webhook

Actions:

- [x] Email
- [x] Discord webhook
- [x] HTTP webhook
- [x] RSS update

Use:

- [x] Redis
- [x] BullMQ workers

---

# Phase 10 - Integrations

Create integration framework.

Implement:

## Email
- [x] SMTP support
- [x] Send announcements

## Discord
- [x] Discord webhook support

## Generic Webhooks
- [x] POST JSON payloads

Future-ready:

- [x] Slack
- [x] Teams
- [x] LinkedIn
- [x] Bluesky
- [x] X
- [x] Facebook

---

# Phase 11 - Analytics

Track:

Posts:

- [x] Views
- [x] Comments
- [x] Reactions

Organizations:

- [x] Followers
- [x] Growth

Dashboard:

- [x] Analytics overview
- [x] Graphs
- [x] Engagement statistics

---

# Phase 12 - Admin Panel

Create:

/admin

Features:

- [x] Manage users
- [x] Manage organizations
- [x] Review reports
- [x] Platform statistics

---

# Phase 13 - Security

Implement:

- [x] API validation
- [x] Rate limiting
- [x] Permission checks
- [x] Secure sessions
- [x] CSRF protection
- [x] File upload validation

---

# Phase 14 - Final Polish

- [x] Responsive design
- [x] Dark mode
- [x] Loading states
- [x] Error handling
- [x] Empty states
- [x] Improve accessibility
- [x] Production deployment setup

---

# Development Rules

The AI must:

- Complete TODO items in order.
- Only work on the current phase unless requested.
- Keep the project runnable after each phase.
- Do not create fake placeholder implementations.
- Use clean reusable components.
- Explain major architecture decisions.
- Update this TODO file after completing tasks.