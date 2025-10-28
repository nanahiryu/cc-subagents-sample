import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { normalizeTagName } from '../utils/tags';

const prisma = new PrismaClient();

// Import the app to test routes
import { Hono } from 'hono';
import tagsRouter from '../routes/tags';

const app = new Hono();
app.route('/api/tags', tagsRouter);

describe('Tag CRUD API', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.todoTag.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.todo.deleteMany();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.todoTag.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.todo.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/tags', () => {
    beforeEach(async () => {
      // Clean up before each test
      await prisma.todoTag.deleteMany();
      await prisma.tag.deleteMany();
      await prisma.todo.deleteMany();
    });

    it('should return empty array when no tags exist', async () => {
      const res = await app.request('/api/tags');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toEqual([]);
    });

    it('should return tags with usage count sorted by name', async () => {
      // Create tags
      const tag1 = await prisma.tag.create({ data: { name: 'zebra' } });
      const tag2 = await prisma.tag.create({ data: { name: 'alpha' } });
      const tag3 = await prisma.tag.create({ data: { name: 'beta' } });

      // Create todos with tags
      const todo1 = await prisma.todo.create({
        data: {
          title: 'Todo 1',
          tags: {
            create: {
              tag: { connect: { id: tag1.id } },
            },
          },
        },
      });

      await prisma.todo.create({
        data: {
          title: 'Todo 2',
          tags: {
            create: [{ tag: { connect: { id: tag1.id } } }, { tag: { connect: { id: tag2.id } } }],
          },
        },
      });

      const res = await app.request('/api/tags');
      expect(res.status).toBe(200);

      const data = (await res.json()) as Array<{ id: string; name: string; count: number }>;
      expect(data).toHaveLength(3);

      // Check sorted by name (ascending)
      expect(data[0].name).toBe('alpha');
      expect(data[1].name).toBe('beta');
      expect(data[2].name).toBe('zebra');

      // Check counts
      expect(data[0].count).toBe(1); // alpha
      expect(data[1].count).toBe(0); // beta
      expect(data[2].count).toBe(2); // zebra
    });
  });

  describe('POST /api/tags', () => {
    beforeEach(async () => {
      // Clean up before each test
      await prisma.todoTag.deleteMany();
      await prisma.tag.deleteMany();
      await prisma.todo.deleteMany();
    });

    it('should create a new tag with normalized name', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '  Important  ' }),
      });

      expect(res.status).toBe(201);

      const data = (await res.json()) as { id: string; name: string };
      expect(data.name).toBe('important'); // normalized
      expect(data.id).toBeDefined();
    });

    it('should return existing tag if name already exists (case-insensitive)', async () => {
      // Create tag
      const tag = await prisma.tag.create({ data: { name: 'existing' } });

      // Try to create with different case
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'EXISTING' }),
      });

      expect(res.status).toBe(200);

      const data = (await res.json()) as { id: string; name: string };
      expect(data.id).toBe(tag.id);
      expect(data.name).toBe('existing');
    });

    it('should reject tag name with invalid characters', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'invalid@tag!' }),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as { error: string };
      expect(data.error).toBe('Invalid input');
    });

    it('should reject tag name longer than 20 characters', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'a'.repeat(21) }),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as { error: string };
      expect(data.error).toBe('Invalid input');
    });

    it('should reject empty tag name', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      expect(res.status).toBe(400);

      const data = (await res.json()) as { error: string };
      expect(data.error).toBe('Invalid input');
    });

    it('should accept tag name with Japanese characters', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '重要' }),
      });

      expect(res.status).toBe(201);

      const data = (await res.json()) as { id: string; name: string };
      expect(data.name).toBe('重要');
    });

    it('should accept tag name with hyphens and underscores', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'high-priority_task' }),
      });

      expect(res.status).toBe(201);

      const data = (await res.json()) as { id: string; name: string };
      expect(data.name).toBe('high-priority_task');
    });
  });

  describe('normalizeTagName utility', () => {
    it('should trim whitespace', () => {
      expect(normalizeTagName('  test  ')).toBe('test');
    });

    it('should convert to lowercase', () => {
      expect(normalizeTagName('TEST')).toBe('test');
    });

    it('should trim and convert together', () => {
      expect(normalizeTagName('  Test Tag  ')).toBe('test tag');
    });
  });
});
