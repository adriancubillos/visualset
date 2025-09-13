# visualset

Frontend & Backend (Combined)
• Next.js (TypeScript, App Router)
• Pages: dashboards, machine/operator management, scheduling board.
• API routes: /api/machines, /api/operators, /api/tasks, /api/schedule.
• Realtime: integrate with Socket.IO, Ably, or Supabase Realtime for live updates.

Scheduling / Optimization
• If rules are simple (availability, shifts, skills) → handle directly in Next.js backend API routes.
• If rules are complex (setup times, optimization, what-ifs) →
• Deploy a Java microservice with OptaPlanner (best for advanced scheduling),
• Or a Python FastAPI service with OR-Tools (Google’s optimization library).
• Next.js just calls these services when scheduling is requested.

Database
• PostgreSQL (via Prisma ORM) → structured data (operators, machines, tasks).
• Redis → caching + task queue (rescheduling, real-time dashboards).

Hosting / Infra
• Vercel (for the Next.js frontend + APIs) if you want quick deployment.
• OR Docker/Kubernetes if you want to run everything in a factory-controlled environment (local or AWS/GCP/Azure).

⸻

🚀 Example MVP Flow (with Next.js) 1. Machine CRUD
• /machines → table of machines with status (available, in maintenance, etc.).
• API: GET /api/machines, POST /api/machines. 2. Operator CRUD
• /operators → list with skills + shift availability.
• API: GET /api/operators, POST /api/operators. 3. Task Assignment
• /schedule → Gantt view with drag-and-drop tasks onto machines/operators.
• API: POST /api/schedule → triggers scheduling engine (manual or auto). 4. Real-time
• If a machine goes down, WebSocket event pushes to /schedule view → affected tasks flash in red. 5. Reports
• /dashboard → operator utilization %, machine OEE (Overall Equipment Effectiveness), upcoming maintenance.

🌐 API Endpoints (Next.js App Router)

We’ll expose REST-style endpoints under /api.
Later we can add GraphQL if needed.

Machines
• GET /api/machines → list all machines
• POST /api/machines → add new machine
• PUT /api/machines/:id → update machine (e.g. status → MAINTENANCE)
• DELETE /api/machines/:id

Operators
• GET /api/operators → list all operators
• POST /api/operators → add new operator
• PUT /api/operators/:id → update operator (skills, availability)
• DELETE /api/operators/:id

Tasks
• GET /api/tasks → list all tasks
• POST /api/tasks → create task
• PUT /api/tasks/:id → update task (status, assignment, scheduledAt)
• DELETE /api/tasks/:id

📊 Frontend Views (Next.js Pages)
• /machines → List & manage machines (status indicators).
• /operators → List operators with skills + availability.
• /tasks → Task backlog.
• /schedule → Gantt/Calendar view with drag-and-drop (e.g., using react-big-calendar or dhtmlx-scheduler).
• /dashboard → KPIs: machine utilization %, operator load, task progress.

🔮 Next Steps
• Scaffold a Next.js project (npx create-next-app@latest --ts).
• Add Prisma + PostgreSQL.
• Implement API routes for CRUD.
• Build /machines, /operators, /tasks views with simple tables.
• Add /schedule with drag-and-drop assignment.

DEV
to run db locally using docker:
docker run --name workshop-db -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=workshop -p 5432:5432 -d postgres:latest

To add prisma to the project:
npm install prisma @prisma/client

To start Prisma:
npx prisma init

Apply migration (Creates tables from schema.prisma)
npx prisma migrate dev --name init
