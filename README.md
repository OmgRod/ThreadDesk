# ThreadDesk

An omnichannel communication platform where organizations can publish official updates, manage discussions, and distribute messages across multiple channels.

## Architecture

- **Frontend**: Next.js 14 (React, TypeScript, Tailwind CSS)
- **Backend**: Fastify (Node.js, TypeScript)
- **Database**: PostgreSQL with Drizzle ORM
- **Cache/Queue**: Redis + BullMQ
- **Containerization**: Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop
- npm or yarn

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd threaddesk
   ```

2. Start infrastructure:
   ```bash
   docker compose up -d
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run database migrations:
   ```bash
   npm run db:push -w backend
   ```

5. Start development servers:
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health: http://localhost:3001/api/health

## Project Structure

```
threaddesk/
├── frontend/          # Next.js application
│   └── src/
│       ├── app/       # Pages (Next.js App Router)
│       ├── components/ # Reusable components
│       └── lib/       # Utilities
├── backend/           # Fastify API server
│   └── src/
│       ├── db/        # Database schema & connection
│       ├── routes/    # API route handlers
│       └── services/  # Shared services
├── docs/              # Documentation
│   └── scripts.md     # Development scripts guide
├── docker-compose.yml # Infrastructure
└── package.json       # Monorepo root
```

## Documentation

- [Development Scripts Guide](docs/scripts.md)


## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Organizations
- `POST /api/orgs` - Create organization
- `GET /api/orgs/:slug` - Get organization by slug
- `PUT /api/orgs/:id` - Update organization
- `GET /api/orgs/:id/members` - Get members
- `POST /api/orgs/:id/members` - Add member
- `DELETE /api/orgs/:id/members/:memberId` - Remove member
- `GET /api/orgs/user/mine` - Get user's organizations

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts/org/:orgId` - Get organization posts
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/dashboard/all` - Dashboard posts

### Comments
- `POST /api/comments` - Create comment
- `GET /api/comments/post/:postId` - Get post comments
- `DELETE /api/comments/:id` - Delete comment

### Reactions
- `POST /api/reactions` - Toggle reaction
- `GET /api/reactions/post/:postId` - Get post reactions

### Followers
- `POST /api/followers/:orgId` - Toggle follow
- `GET /api/followers/:orgId/check` - Check follow status
- `GET /api/followers/my` - Get followed orgs

### Feed
- `GET /api/feed` - Get personalized feed

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Unread count

### Workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/org/:orgId` - Get workflows
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

### Analytics
- `POST /api/analytics/track` - Track event
- `GET /api/analytics/org/:orgId` - Get analytics

### Admin
- `GET /api/admin/stats` - Platform stats
- `GET /api/admin/users` - All users
- `GET /api/admin/organizations` - All organizations
- `DELETE /api/admin/users/:id` - Delete user
- `DELETE /api/admin/organizations/:id` - Delete organization

### Webhooks
- `POST /api/webhooks/incoming/:orgId` - Receive webhook
- `POST /api/webhooks/send` - Send webhook

## Features

- ✅ Organization profiles with custom branding
- ✅ Rich text post creation and management
- ✅ Public discussion with nested comments
- ✅ Reaction system (like, love, laugh, etc.)
- ✅ Follow/unfollow organizations
- ✅ Personalized feed
- ✅ In-app notifications
- ✅ Automation workflows (triggers + actions)
- ✅ Webhook integrations
- ✅ Analytics dashboard
- ✅ Admin panel
- ✅ Dark mode
- ✅ Responsive design
- ✅ Rate limiting & security