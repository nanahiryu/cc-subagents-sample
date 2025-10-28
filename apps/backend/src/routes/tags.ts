import { Hono } from 'hono';
import { prisma } from '../db';
import { addTagsToTodoSchema, createTagSchema } from '../schemas';

const app = new Hono();

// Helper function to normalize tag name (lowercase, trim)
const normalizeTagName = (name: string): string => {
  return name.trim().toLowerCase();
};

// GET /api/tags - List all tags with usage count
app.get('/', async (c) => {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { todos: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  const tagsWithCount = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    count: tag._count.todos,
  }));

  return c.json(tagsWithCount);
});

// POST /api/tags - Create or get existing tag
app.post('/', async (c) => {
  const body = await c.req.json();
  const result = createTagSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.errors }, 400);
  }

  const normalizedName = normalizeTagName(result.data.name);

  // Check if tag already exists (case-insensitive)
  let tag = await prisma.tag.findUnique({
    where: { name: normalizedName },
  });

  // If not exists, create new tag
  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        name: normalizedName,
      },
    });
  }

  return c.json(tag);
});

// POST /api/todos/:todoId/tags - Add tags to a todo
app.post('/todos/:todoId/tags', async (c) => {
  const todoId = c.req.param('todoId');
  const body = await c.req.json();
  const result = addTagsToTodoSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.errors }, 400);
  }

  // Check if todo exists
  const todo = await prisma.todo.findUnique({
    where: { id: todoId },
  });

  if (!todo) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  const { tagNames } = result.data;
  const normalizedTagNames = tagNames.map(normalizeTagName);

  // Validate each tag name
  for (const tagName of normalizedTagNames) {
    const validationResult = createTagSchema.safeParse({ name: tagName });
    if (!validationResult.success) {
      return c.json(
        { error: `Invalid tag name: ${tagName}`, details: validationResult.error.errors },
        400,
      );
    }
  }

  // Create tags if they don't exist and add to todo
  const tagOperations = normalizedTagNames.map(async (tagName) => {
    // Find or create tag
    let tag = await prisma.tag.findUnique({
      where: { name: tagName },
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: { name: tagName },
      });
    }

    // Create TodoTag relation (ignore if already exists)
    try {
      await prisma.todoTag.create({
        data: {
          todoId,
          tagId: tag.id,
        },
      });
    } catch (error) {
      // Ignore duplicate key errors (idempotent)
    }

    return tag;
  });

  await Promise.all(tagOperations);

  // Return updated todo with tags
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

// DELETE /api/todos/:todoId/tags/:tagId - Remove tag from todo
app.delete('/todos/:todoId/tags/:tagId', async (c) => {
  const todoId = c.req.param('todoId');
  const tagId = c.req.param('tagId');

  try {
    await prisma.todoTag.delete({
      where: {
        todoId_tagId: {
          todoId,
          tagId,
        },
      },
    });

    // Check if tag is still used by any todo
    const tagUsageCount = await prisma.todoTag.count({
      where: { tagId },
    });

    // If tag is not used by any todo, delete it
    if (tagUsageCount === 0) {
      await prisma.tag.delete({
        where: { id: tagId },
      });
    }

    return c.body(null, 204);
  } catch (error) {
    return c.json({ error: 'TodoTag relation not found' }, 404);
  }
});

export default app;
