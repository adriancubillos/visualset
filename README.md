# TMP

Next steps (pick one)

Create a small seed script to populate the fresh DB with example Projects → Items → Tasks (useful for manual testing).
Start fixing the ESLint issues across the UI.
Refactor frontend components/pages to consume Items (I can do this incrementally).

Expand tests to cover edge cases for routes already added (validation errors, bad inputs).
Add CI (GitHub Actions) to run tests on PRs/commits.
Tighten test types further (remove any remaining any where possible).

An item can not be completed unless al its tasks are completed
collapse things

✅ FIXED: projects/id project details streamlined - removed duplicate status and reduced space usage
✅ FIXED: Item completion validation - items can only be marked as completed when all tasks are completed

# visualset

# Ngork

    ngrok http 3000

# server commands

    pkill -f "next dev"

# Prisma Commands

# Force reset the DB

    npx prisma db push --force-reset

# Run seed script

    npx tsx prisma/scripts/seed.ts

# Reset prisma client

    rm -rf node_modules/.prisma

# Generate prisma client

    npx prisma generate

# DEV

# To run db locally using docker:

    docker run --name workshop-db -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=workshop -p 5432:5432 -d postgres:latest

# To add prisma to the project:

    npm install prisma @prisma/client

# To start Prisma:

    npx prisma init

# Apply migration (Creates tables from schema.prisma)

    npx prisma migrate dev --name init

# 🏗️ Proposed Page Organization Strategy

1. Routing Structure
   /src/app/
   ├── schedule/ # Existing - Gantt & Calendar views
   ├── projects/
   │ ├── page.tsx # Projects list/table
   │ ├── new/page.tsx # Create new project
   │ └── [id]/
   │ ├── page.tsx # View/Edit project
   │ └── edit/page.tsx
   ├── tasks/
   │ ├── page.tsx # Tasks list with filters
   │ ├── new/page.tsx # Create new task
   │ └── [id]/
   │ ├── page.tsx # View task details
   │ └── edit/page.tsx
   ├── machines/
   │ ├── page.tsx # Machines list with status
   │ ├── new/page.tsx # Add new machine
   │ └── [id]/
   │ ├── page.tsx # Machine details & maintenance
   │ └── edit/page.tsx
   └── operators/
   ├── page.tsx # Operators list with skills
   ├── new/page.tsx # Add new operator
   └── [id]/
   ├── page.tsx # Operator profile & schedule
   └── edit/page.tsx
2. Component Architecture Pattern
   Reusable Components:

DataTable - Generic table with sorting, filtering, pagination
FormModal - Reusable modal for create/edit operations
StatusBadge - Consistent status indicators
SearchFilter - Universal search and filter component
ActionButton - Standardized action buttons (Edit, Delete, View)
Entity-Specific Components:

ProjectCard, TaskCard, MachineCard, OperatorCard
ProjectForm, TaskForm, MachineForm, OperatorForm
ProjectStats, MachineStatus, OperatorSkills 3. Data Flow & State Management
API Integration Pattern:

Consistent CRUD operations for each entity
Optimistic updates for better UX
Error handling with toast notifications
Loading states and skeleton components
State Management:

React Query/TanStack Query for server state
Local state for forms and UI interactions
Context for global app state (user, theme, etc.) 4. Navigation & UX Flow
Main Navigation:

Dashboard → Schedule → Projects → Tasks → Machines → Operators
Breadcrumb Navigation:

Projects > Project Name > Edit
Tasks > Task #123 > Assign Machine
Quick Actions:

"Add New" buttons on each list page
Bulk operations (delete, status change)
Quick filters and search
Export functionality 5. Page Layout Consistency
Standard Page Structure:

Header: Title, breadcrumbs, primary actions
Filters: Search, status filters, date ranges
Content: Table/cards with data
Pagination: Standard pagination controls
Modals: Create/edit forms in modals or separate pages 6. Implementation Priority
Phase 1: Foundation

Generic DataTable and FormModal components
Basic CRUD pages for Projects (simplest entity)
Navigation structure
Phase 2: Core Entities

Machines management (status tracking important)
Operators management (skills & availability)
Enhanced filtering and search
Phase 3: Advanced Features

Tasks management (complex relationships)
Bulk operations
Advanced reporting and analytics 7. Technical Considerations
Performance:

Server-side pagination for large datasets
Virtualized tables for 1000+ rows
Image optimization for operator photos/machine images
Accessibility:

Keyboard navigation
Screen reader support
High contrast mode support
Mobile Responsiveness:

Responsive tables (stack on mobile)
Touch-friendly buttons
Simplified mobile navigation
