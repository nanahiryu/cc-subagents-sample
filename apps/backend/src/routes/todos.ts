import { Hono } from 'hono';
import { prisma } from '../db';
import { createTodoSchema, getTodosQuerySchema, updateTodoSchema } from '../schemas';

const app = new Hono();

// GET /api/todos - List todos with optional filtering
app.get('/', async (c) => {
  const queryResult = getTodosQuerySchema.safeParse(c.req.query());

  if (!queryResult.success) {
    return c.json({ error: 'Invalid query parameters', details: queryResult.error.errors }, 400);
  }

  const { completed, q, limit, offset, tags, tagsMode } = queryResult.data;

  const where: {
    completed?: boolean;
    OR?: Array<
      | { title: { contains: string; mode: 'insensitive' } }
      | { description: { contains: string; mode: 'insensitive' } }
    >;
    tags?: {
      some?: { tag: { name: { in: string[] } } };
      every?: { tag: { name: { in: string[] } } };
    };
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

  // Tag filtering
  if (tags) {
    const tagNames = tags.split(',').map((name) => name.trim().toLowerCase());

    if (tagsMode === 'and') {
      // For AND mode, we need a different approach
      // We need to find todos that have ALL specified tags
      const tagRecords = await prisma.tag.findMany({
        where: { name: { in: tagNames } },
      });

      if (tagRecords.length === tagNames.length) {
        // All tags exist, now find todos that have all of them
        const tagIds = tagRecords.map((t) => t.id);

        // Use raw query or multiple filters
        const todosWithAllTags = await prisma.todo.findMany({
          where: {
            ...where,
            AND: tagIds.map((tagId) => ({
              tags: {
                some: {
                  tagId,
                },
              },
            })),
          },
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
          take: limit ? Number.parseInt(limit, 10) : undefined,
          skip: offset ? Number.parseInt(offset, 10) : undefined,
          orderBy: { createdAt: 'desc' },
        });

        return c.json(todosWithAllTags);
      }
      // Some tags don't exist, return empty array
      return c.json([]);
    }
    // OR mode: todos that have at least one of the specified tags
    where.tags = {
      some: {
        tag: {
          name: {
            in: tagNames,
          },
        },
      },
    };
  }

  const todos = await prisma.todo.findMany({
    where,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    take: limit ? Number.parseInt(limit, 10) : undefined,
    skip: offset ? Number.parseInt(offset, 10) : undefined,
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
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
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
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
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
