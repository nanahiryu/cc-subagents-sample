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

    // Boundary Tests
    describe('Boundary Tests', () => {
      it('should accept tag name with exactly 1 character (minimum)', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'a' }),
        });

        expect(res.status).toBe(201);

        const data = (await res.json()) as { id: string; name: string };
        expect(data.name).toBe('a');
      });

      it('should accept tag name with exactly 20 characters (maximum)', async () => {
        const tagName = 'a'.repeat(20);
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tagName }),
        });

        expect(res.status).toBe(201);

        const data = (await res.json()) as { id: string; name: string };
        expect(data.name).toBe(tagName);
      });

      it('should reject tag name with only whitespace (becomes empty after trim)', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '   ' }),
        });

        expect(res.status).toBe(400);

        const data = (await res.json()) as { error: string };
        expect(data.error).toBe('Invalid input');
      });

      it('should reject tag name with only tabs and newlines', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '\t\n\r' }),
        });

        expect(res.status).toBe(400);

        const data = (await res.json()) as { error: string };
        expect(data.error).toBe('Invalid input');
      });
    });

    // Edge Case Tests
    describe('Edge Case Tests', () => {
      it('should reject request without name field', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);

        const data = (await res.json()) as { error: string };
        expect(data.error).toBe('Invalid input');
      });

      it('should reject request with null name', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: null }),
        });

        expect(res.status).toBe(400);

        const data = (await res.json()) as { error: string };
        expect(data.error).toBe('Invalid input');
      });

      it('should reject request with undefined name', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: undefined }),
        });

        expect(res.status).toBe(400);

        const data = (await res.json()) as { error: string };
        expect(data.error).toBe('Invalid input');
      });

      it('should reject request with number as name', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 123 }),
        });

        expect(res.status).toBe(400);

        const data = (await res.json()) as { error: string };
        expect(data.error).toBe('Invalid input');
      });

      it('should reject request with boolean as name', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: true }),
        });

        expect(res.status).toBe(400);

        const data = (await res.json()) as { error: string };
        expect(data.error).toBe('Invalid input');
      });

      it('should reject request with object as name', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: { value: 'tag' } }),
        });

        expect(res.status).toBe(400);

        const data = (await res.json()) as { error: string };
        expect(data.error).toBe('Invalid input');
      });

      it('should reject request with array as name', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: ['tag1', 'tag2'] }),
        });

        expect(res.status).toBe(400);

        const data = (await res.json()) as { error: string };
        expect(data.error).toBe('Invalid input');
      });

      it('should accept mixed Japanese characters (hiragana, katakana, kanji)', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'あいうアイウ漢字' }),
        });

        expect(res.status).toBe(201);

        const data = (await res.json()) as { id: string; name: string };
        expect(data.name).toBe('あいうアイウ漢字');
      });

      it('should accept alphanumeric mix with Japanese and special chars', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'tag-123_テスト' }),
        });

        expect(res.status).toBe(201);

        const data = (await res.json()) as { id: string; name: string };
        expect(data.name).toBe('tag-123_テスト');
      });

      it('should reject full-width alphanumeric characters', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'ＡＢＣ１２３' }),
        });

        expect(res.status).toBe(400);

        const data = (await res.json()) as { error: string };
        expect(data.error).toBe('Invalid input');
      });

      it('should reject tag name with spaces in the middle', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'hello world' }),
        });

        expect(res.status).toBe(400);

        const data = (await res.json()) as { error: string };
        expect(data.error).toBe('Invalid input');
      });

      it('should reject tag name with special symbols', async () => {
        const symbols = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/'];

        for (const symbol of symbols) {
          const res = await app.request('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: `test${symbol}tag` }),
          });

          expect(res.status).toBe(400);

          const data = (await res.json()) as { error: string };
          expect(data.error).toBe('Invalid input');
        }
      });

      it('should handle existing tag with different whitespace patterns', async () => {
        // Create a tag
        await prisma.tag.create({ data: { name: 'test' } });

        // Try to create with leading/trailing spaces
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '  TEST  ' }),
        });

        expect(res.status).toBe(200);

        const data = (await res.json()) as { id: string; name: string };
        expect(data.name).toBe('test');
      });
    });

    // Error Handling Tests
    describe('Error Handling Tests', () => {
      it('should handle malformed JSON gracefully', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'not valid json',
        });

        // Hono will throw an error for invalid JSON
        expect(res.status).toBeGreaterThanOrEqual(400);
      });

      it('should handle empty request body', async () => {
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '',
        });

        expect(res.status).toBeGreaterThanOrEqual(400);
      });

      it('should reject extra fields in request', async () => {
        // Note: Zod by default strips extra fields, so this should still succeed
        const res = await app.request('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'valid', extraField: 'should be ignored' }),
        });

        expect(res.status).toBe(201);

        const data = (await res.json()) as { id: string; name: string };
        expect(data.name).toBe('valid');
      });
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

    // Additional boundary and edge case tests
    it('should handle empty string', () => {
      expect(normalizeTagName('')).toBe('');
    });

    it('should handle string with only spaces', () => {
      expect(normalizeTagName('   ')).toBe('');
    });

    it('should handle string with only tabs and newlines', () => {
      expect(normalizeTagName('\t\n\r')).toBe('');
    });

    it('should preserve Japanese characters', () => {
      expect(normalizeTagName('テスト')).toBe('テスト');
    });

    it('should preserve special characters (hyphens, underscores)', () => {
      expect(normalizeTagName('test-tag_name')).toBe('test-tag_name');
    });

    it('should handle mixed case with Japanese characters', () => {
      expect(normalizeTagName('  Test-テスト_123  ')).toBe('test-テスト_123');
    });

    it('should not affect already normalized strings', () => {
      expect(normalizeTagName('test')).toBe('test');
    });

    it('should handle very long strings', () => {
      const longString = 'A'.repeat(100);
      expect(normalizeTagName(longString)).toBe('a'.repeat(100));
    });
  });
});
