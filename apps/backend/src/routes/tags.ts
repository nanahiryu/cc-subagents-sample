import { Hono } from 'hono';
import { prisma } from '../db';
import { createTagSchema } from '../schemas';
import { normalizeTagName } from '../utils/tags';

const app = new Hono();

// GET /api/tags - List all tags with usage count
app.get('/', async (c) => {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { todos: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const result = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    count: tag._count.todos,
  }));

  return c.json(result);
});

// POST /api/tags - Create a new tag or return existing one
app.post('/', async (c) => {
  const body = await c.req.json();
  const result = createTagSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.errors }, 400);
  }

  const { name } = result.data;
  const normalizedName = normalizeTagName(name);

  // Check if tag already exists (case-insensitive)
  const existingTag = await prisma.tag.findUnique({
    where: { name: normalizedName },
  });

  if (existingTag) {
    return c.json({ id: existingTag.id, name: existingTag.name });
  }

  // Create new tag
  const newTag = await prisma.tag.create({
    data: {
      name: normalizedName,
    },
  });

  return c.json({ id: newTag.id, name: newTag.name }, 201);
});

export default app;
