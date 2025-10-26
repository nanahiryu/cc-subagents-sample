import { Hono } from 'hono';
import { prisma } from '../db';
import {
  createTodoSchema,
  updateTodoSchema,
  getTodosQuerySchema,
} from '../schemas';

const app = new Hono();

// GET /api/todos - List todos with optional filtering
app.get('/', async (c) => {
  const queryResult = getTodosQuerySchema.safeParse(c.req.query());

  if (!queryResult.success) {
    return c.json({ error: 'Invalid query parameters', details: queryResult.error.errors }, 400);
  }

  const { completed, q, limit, offset } = queryResult.data;

  const where: {
    completed?: boolean;
    OR?: Array<{ title: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } }>;
  } = {};

  if (completed !== undefined) {
    where.completed = completed === 'true';
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const todos = await prisma.todo.findMany({
    where,
    take: limit ? parseInt(limit, 10) : undefined,
    skip: offset ? parseInt(offset, 10) : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return c.json(todos);
});

// POST /api/todos - Create a new todo
app.post('/', async (c) => {
  const body = await c.req.json();
  const result = createTodoSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.errors }, 400);
  }

  const { title, description, dueDate, completed } = result.data;

  const todo = await prisma.todo.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      completed: completed ?? false,
    },
  });

  return c.json(todo, 201);
});

// GET /api/todos/:id - Get a specific todo
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const todo = await prisma.todo.findUnique({
    where: { id },
  });

  if (!todo) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  return c.json(todo);
});

// PATCH /api/todos/:id - Update a todo
app.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = updateTodoSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.errors }, 400);
  }

  const { title, description, dueDate, completed } = result.data;

  try {
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(completed !== undefined && { completed }),
      },
    });

    return c.json(todo);
  } catch (error) {
    return c.json({ error: 'Todo not found' }, 404);
  }
});

// DELETE /api/todos/:id - Delete a todo
app.delete('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    await prisma.todo.delete({
      where: { id },
    });

    return c.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    return c.json({ error: 'Todo not found' }, 404);
  }
});

export default app;
