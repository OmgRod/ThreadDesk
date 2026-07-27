# ThreadDesk Roadmap

This document outlines the development trajectory for ThreadDesk. It is structured into phases that can be directly mapped to GitHub Project Kanban columns.

## GitHub Project Board Strategy
- **Backlog**: Items in Phase 3 & 4.
- **Ready**: High-priority items in Phase 2.
- **In Progress**: Active development tasks.
- **Done**: Phase 1 and completed features.

---

## Phase 1: Foundation (COMPLETED)
- [x] User Authentication (JWT)
- [x] Multi-tenant Organizations
- [x] Post Creation & Management
- [x] Automation Engine (Webhook, Discord, Slack, Email, Bluesky)
- [x] Admin Panel (Management, Search)

## Phase 2: Reliability & Connectivity (NEXT)

### Backend
- [ ] Add comprehensive automated testing (Unit/Integration)
- [ ] Implement robust error handling & retry logic for third-party APIs
- [ ] Improve log aggregation (Winston/Pino integration)
- [ ] Implement database connection pooling & performance tuning

### Frontend
- [ ] Polish UI components (Shadcn migration/cleanup)
- [ ] Improve error states and feedback for users
- [ ] Add Threads & Mastodon integration

## Phase 3: Analytics & UX (FUTURE)

### Analytics
- [ ] Advanced dashboard charts (using Recharts)
- [ ] Post engagement tracking (views, clicks, interactions)
- [ ] Aggregated data export

### UX
- [ ] Onboarding flow for new users
- [ ] Dark mode refinements
- [ ] Drag-and-drop workflow builder

## Phase 4: Monetization & Advanced Features (LONG-TERM)
- [ ] Billing & Subscription tiers (LemonSqueezy integration)
- [ ] Team management & role-based access control (RBAC)
- [ ] AI-assisted post generation & summarization
