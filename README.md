# cc-subagents-sample

A Todo CRUD application demonstrating the use of subagents (owner/executer/checker) for systematic feature development.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Hono (Node runtime)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Package Manager**: pnpm

## Project Structure

```
/
├─ apps/
│  ├─ frontend/       # React + TS
│  └─ backend/        # Hono API
├─ prisma/            # Prisma schema / migrations / seed
├─ tests/             # Test files
├─ docs/              # Documentation
│  ├─ requirements/
│  └─ plans/
└─ .claude/
   └─ agents/         # Subagent definitions
```

## Setup

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL (or Docker)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database

Start PostgreSQL (example with Docker):

```bash
docker run --name todo-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=todo \
  -p 5432:5432 \
  -d postgres:16
```

For testing, create a test database:

```bash
docker exec -it todo-postgres psql -U user -d todo -c "CREATE DATABASE todo_test;"
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update the `DATABASE_URL`:

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/todo"
PORT=8787
```

### 4. Run Migrations

```bash
pnpm db:migrate
pnpm db:generate
```

### 5. Seed Database (Optional)

```bash
pnpm db:seed
```

### 6. Start Development Servers

In separate terminals:

```bash
# Terminal 1: Backend (http://localhost:8787)
pnpm dev:backend

# Terminal 2: Frontend (http://localhost:5173)
pnpm dev:frontend
```

Or run both together:

```bash
pnpm dev
```

## Available Scripts

- `pnpm dev` - Start both backend and frontend
- `pnpm build` - Build both apps
- `pnpm lint` - Run linting
- `pnpm typecheck` - Run type checking
- `pnpm test` - Run tests
- `pnpm db:migrate` - Run Prisma migrations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:seed` - Seed database with sample data

## API Endpoints

- `GET /api/todos` - List todos (with filtering)
- `POST /api/todos` - Create a new todo
- `GET /api/todos/:id` - Get a specific todo
- `PATCH /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo

## Development Workflow

This project follows a subagent-based workflow:

1. **owner**: Breaks down features into small, 1-commit tasks
2. **executer**: Implements tasks and ensures tests pass
3. **checker**: Adds comprehensive tests and validates quality

See `docs/plans/` for task definitions and execution logs.