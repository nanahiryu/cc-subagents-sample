import { Hono } from 'hono';
import { prisma } from '../db';
import {
  addTagsToTodoSchema,
  createTodoSchema,
  getTodosQuerySchema,
  updateTodoSchema,
} from '../schemas';
import { normalizeTagName } from '../utils/tags';

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
    AND?: Array<{
      tags: {
        some: {
          tag: {
            name: string;
          };
        };
      };
    }>;
    tags?: {
      some: {
        tag: {
          name: {
            in: string[];
          };
        };
      };
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
    const tagNames = tags.split(',').map((tag) => normalizeTagName(tag.trim()));
    const mode = tagsMode || 'or';

    if (mode === 'or') {
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
    } else {
      // AND mode: todos that have all of the specified tags
      where.AND = tagNames.map((tagName) => ({
        tags: {
          some: {
            tag: {
              name: tagName,
            },
          },
        },
      }));
    }
  }

  const todos = await prisma.todo.findMany({
    where,
    take: limit ? Number.parseInt(limit, 10) : undefined,
    skip: offset ? Number.parseInt(offset, 10) : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
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

  const { title, description, dueDate, completed, tags } = result.data;

  // Create todo
  const todo = await prisma.todo.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      completed: completed ?? false,
    },
  });

  // Add tags if provided
  if (tags && tags.length > 0) {
    for (const tagName of tags) {
      const normalizedName = normalizeTagName(tagName);

      // Find or create tag
      let tag = await prisma.tag.findUnique({
        where: { name: normalizedName },
      });

      if (!tag) {
        tag = await prisma.tag.create({
          data: { name: normalizedName },
        });
      }

      // Create association
      await prisma.todoTag.create({
        data: {
          todoId: todo.id,
          tagId: tag.id,
        },
      });
    }
  }

  // Return todo with tags
  const todoWithTags = await prisma.todo.findUnique({
    where: { id: todo.id },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return c.json(todoWithTags, 201);
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

  const { title, description, dueDate, completed, tags } = result.data;

  try {
    // Update todo fields
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(completed !== undefined && { completed }),
      },
    });

    // If tags are provided, replace all existing tags
    if (tags !== undefined) {
      // Delete all existing tag associations
      await prisma.todoTag.deleteMany({
        where: { todoId: id },
      });

      // Add new tags
      if (tags.length > 0) {
        for (const tagName of tags) {
          const normalizedName = normalizeTagName(tagName);

          // Find or create tag
          let tag = await prisma.tag.findUnique({
            where: { name: normalizedName },
          });

          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: normalizedName },
            });
          }

          // Create association
          await prisma.todoTag.create({
            data: {
              todoId: id,
              tagId: tag.id,
            },
          });
        }
      }
    }

    // Return updated todo with tags
    const updatedTodo = await prisma.todo.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return c.json(updatedTodo);
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

// POST /api/todos/:todoId/tags - Add tags to a todo
app.post('/:todoId/tags', async (c) => {
  const todoId = c.req.param('todoId');
  const body = await c.req.json();
  const result = addTagsToTodoSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.errors }, 400);
  }

  const { tagNames } = result.data;

  // Check if todo exists
  const todo = await prisma.todo.findUnique({
    where: { id: todoId },
  });

  if (!todo) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  // Process each tag name
  for (const tagName of tagNames) {
    const normalizedName = normalizeTagName(tagName);

    // Find or create tag
    let tag = await prisma.tag.findUnique({
      where: { name: normalizedName },
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: { name: normalizedName },
      });
    }

    // Create association (idempotent - ignore if already exists)
    await prisma.todoTag.upsert({
      where: {
        todoId_tagId: {
          todoId,
          tagId: tag.id,
        },
      },
      create: {
        todoId,
        tagId: tag.id,
      },
      update: {}, // No update needed, just ensure it exists
    });
  }

  // Return todo with tags
  const updatedTodo = await prisma.todo.findUnique({
    where: { id: todoId },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return c.json(updatedTodo);
});

// DELETE /api/todos/:todoId/tags/:tagId - Remove a tag from a todo
app.delete('/:todoId/tags/:tagId', async (c) => {
  const todoId = c.req.param('todoId');
  const tagId = c.req.param('tagId');

  // Check if todo exists
  const todo = await prisma.todo.findUnique({
    where: { id: todoId },
  });

  if (!todo) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  // Check if tag exists
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
  });

  if (!tag) {
    return c.json({ error: 'Tag not found' }, 404);
  }

  // Delete the association
  try {
    await prisma.todoTag.delete({
      where: {
        todoId_tagId: {
          todoId,
          tagId,
        },
      },
    });

    return c.body(null, 204);
  } catch (error) {
    return c.json({ error: 'Tag association not found' }, 404);
  }
});

export default app;
