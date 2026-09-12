# Agency Ops Dashboard

A real-time client project dashboard built with React + TypeScript, Express, Prisma, PostgreSQL, Socket.IO, and node-cron.

## Local setup

1. Copy `server/.env.example` to `server/.env`.
2. Start PostgreSQL: `docker compose up -d`.
3. Install dependencies: `npm install`, `npm install --prefix server`, `npm install --prefix client`.
4. Create schema and seed data: `npm run db:push && npm run seed`.
5. Start both apps: `npm run dev`.

Seed password: `password123`. Accounts include `admin@agency.local`, `ravi@agency.local`, `maya@agency.local`, and `dev1@agency.local` through `dev4@agency.local`.

## Architecture

The API enforces role and ownership checks on every protected route. Access tokens are short-lived and held in memory by the client; refresh tokens are signed JWTs in an HttpOnly cookie. Socket.IO uses authenticated sockets and project/user rooms, so events are filtered server-side. On connection, users join only rooms permitted by their role. Missed activity is read from the `Activity` table, capped at 20 events.

PostgreSQL is modeled relationally with foreign keys and cascading task/project activity cleanup. Indexes support project ownership, developer task views, due-date queries, activity timelines, and unread notifications. node-cron runs hourly to persist overdue status transitions, keeping that behavior independent of page loads.

## Known limitations

The first vertical slice includes login, dashboards, persisted seed activity, role-filtered project/activity reads, live task status events, presence count, and notification creation. Project/client/user administration, full task mutation forms, notification dropdown actions, deployment configuration, and production secret rotation remain follow-up work.

## Deployment

Deploy the React client to Vercel with the repository root as the project root. Vercel uses `vercel.json`, installs `client` dependencies, and builds `client/dist`. Set `VITE_API_URL` to the public URL of the API. Deploy the Express/Socket.IO API separately on Render using `render.yaml`; set its `CLIENT_URL` to the Vercel URL, run the seed command once against the production database, and then redeploy the client after setting `VITE_API_URL`. Never leave `VITE_API_URL` unset in production because the local fallback is intentionally disabled outside development.

## Explanation

The hardest part is keeping the live feed subject to the same permissions as the REST API. The server authenticates each Socket.IO handshake, derives the user’s permitted projects or assigned tasks, and joins only those project rooms. Status changes are written transactionally with their activity record before the event is broadcast, so the UI never treats an in-memory event as the source of truth. Reconnecting users call the project activity endpoint, which reads the latest twenty persisted entries from PostgreSQL. The API applies ownership checks again when reading projects, reading activity, and mutating status, which prevents a modified token from turning frontend-hidden data into accessible data. I chose Socket.IO because its authenticated middleware, rooms, reconnect behavior, and browser ergonomics provide useful primitives for this small team dashboard without implementing a custom protocol. I chose node-cron because the overdue rule is a single hourly database sweep and does not need a distributed queue yet. I would add a durable BullMQ worker and Redis when deployments scale beyond one API process.
