# Development Scripts

ThreadDesk uses several NPM scripts configured in the root `package.json` to simplify development, testing, and database management. You can run these from the root of the project using `npm run <script-name>`.

## Running the Application

*   `npm run dev`
    Starts both the backend and frontend development servers concurrently. This is the primary command used during active development.
*   `npm run dev:frontend`
    Starts only the Next.js frontend development server.
*   `npm run dev:backend`
    Starts only the Fastify backend development server.

## Building and Installation

*   `npm run build`
    Builds both the backend (TypeScript compilation) and frontend (Next.js production build).
*   `npm run install:all`
    Installs all dependencies for both the frontend and backend in a single command.

## Database Management (Drizzle ORM)

These commands cascade down to the backend's database configuration.

*   `npm run db:generate`
    Generates new Drizzle migration files based on changes made to your schema definitions in the backend.
*   `npm run db:migrate`
    Runs pending migrations against your PostgreSQL database.
*   `npm run db:push`
    Directly pushes schema changes to the database (useful for rapid prototyping, but avoid using in production).
*   `npm run db:studio`
    Opens Drizzle Studio, a visual database browser, allowing you to view and modify your database records through a web UI.

## Linting

*   `npm run lint:all`
    Runs ESLint on both the frontend and backend codebases to ensure code quality and style consistency.
