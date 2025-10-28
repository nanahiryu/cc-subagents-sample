import { PrismaClient } from '@prisma/client';
import { Hono } from 'hono';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import todosRouter from '../routes/todos';

const prisma = new PrismaClient();

const app = new Hono();
app.route('/api/todos', todosRouter);

type TodoWithTags = {
  id: string;
  title: string;
  tags: Array<{ tag: { id: string; name: string } }>;
};

describe('Todo-Tag Association API', () => {
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

  beforeEach(async () => {
    // Clean up before each test
    await prisma.todoTag.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.todo.deleteMany();
  });

  describe('POST /api/todos with tags', () => {
    it('should create a todo with tags', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Todo',
          description: 'Test Description',
          tags: ['urgent', 'work'],
        }),
      });

      expect(res.status).toBe(201);

      const data = (await res.json()) as TodoWithTags;
      expect(data.title).toBe('Test Todo');
      expect(data.tags).toHaveLength(2);
      expect(data.tags[0].tag.name).toBe('urgent');
      expect(data.tags[1].tag.name).toBe('work');
    });

    it('should create a todo without tags', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Todo',
          description: 'Test Description',
        }),
      });

      expect(res.status).toBe(201);

      const data = (await res.json()) as TodoWithTags;
      expect(data.title).toBe('Test Todo');
      expect(data.tags).toHaveLength(0);
    });

    it('should normalize tag names when creating todo', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Todo',
          tags: ['  URGENT  ', 'Work'],
        }),
      });

      expect(res.status).toBe(201);

      const data = (await res.json()) as TodoWithTags;
      expect(data.tags).toHaveLength(2);
      expect(data.tags[0].tag.name).toBe('urgent');
      expect(data.tags[1].tag.name).toBe('work');
    });
  });

  describe('PATCH /api/todos/:id with tags', () => {
    it('should update todo tags by replacing them', async () => {
      // Create a todo with tags
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Todo',
          tags: ['old1', 'old2'],
        }),
      });

      const created = (await createRes.json()) as TodoWithTags;

      // Update tags
      const updateRes = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags: ['new1', 'new2'],
        }),
      });

      expect(updateRes.status).toBe(200);

      const updated = (await updateRes.json()) as TodoWithTags;
      expect(updated.tags).toHaveLength(2);
      expect(updated.tags[0].tag.name).toBe('new1');
      expect(updated.tags[1].tag.name).toBe('new2');
    });

    it('should clear all tags when updating with empty array', async () => {
      // Create a todo with tags
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Todo',
          tags: ['tag1', 'tag2'],
        }),
      });

      const created = (await createRes.json()) as TodoWithTags;

      // Clear tags
      const updateRes = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags: [],
        }),
      });

      expect(updateRes.status).toBe(200);

      const updated = (await updateRes.json()) as TodoWithTags;
      expect(updated.tags).toHaveLength(0);
    });
  });

  describe('POST /api/todos/:todoId/tags', () => {
    it('should add tags to an existing todo', async () => {
      // Create a todo
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Todo',
        }),
      });

      const todo = (await createRes.json()) as TodoWithTags;

      // Add tags
      const addTagsRes = await app.request(`/api/todos/${todo.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagNames: ['urgent', 'work'],
        }),
      });

      expect(addTagsRes.status).toBe(200);

      const updated = (await addTagsRes.json()) as TodoWithTags;
      expect(updated.tags).toHaveLength(2);
      expect(updated.tags[0].tag.name).toBe('urgent');
      expect(updated.tags[1].tag.name).toBe('work');
    });

    it('should return 404 when todo does not exist', async () => {
      const res = await app.request('/api/todos/non-existent-id/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagNames: ['urgent'],
        }),
      });

      expect(res.status).toBe(404);
    });

    it('should be idempotent when adding duplicate tags', async () => {
      // Create a todo with a tag
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Todo',
          tags: ['existing'],
        }),
      });

      const todo = (await createRes.json()) as TodoWithTags;

      // Add the same tag again
      const addTagsRes = await app.request(`/api/todos/${todo.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagNames: ['existing'],
        }),
      });

      expect(addTagsRes.status).toBe(200);

      const updated = (await addTagsRes.json()) as TodoWithTags;
      expect(updated.tags).toHaveLength(1);
      expect(updated.tags[0].tag.name).toBe('existing');
    });

    it('should reuse existing tags instead of creating duplicates', async () => {
      // Create an existing tag
      await prisma.tag.create({ data: { name: 'existing' } });

      // Create a todo
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Todo',
        }),
      });

      const todo = (await createRes.json()) as TodoWithTags;

      // Add the existing tag
      await app.request(`/api/todos/${todo.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagNames: ['existing'],
        }),
      });

      // Verify only one tag exists in the database
      const tags = await prisma.tag.findMany();
      expect(tags).toHaveLength(1);
    });
  });

  describe('DELETE /api/todos/:todoId/tags/:tagId', () => {
    it('should remove a tag from a todo', async () => {
      // Create a todo with tags
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Todo',
          tags: ['tag1', 'tag2'],
        }),
      });

      const todo = (await createRes.json()) as TodoWithTags;
      const tagId = todo.tags[0].tag.id;

      // Remove the tag
      const deleteRes = await app.request(`/api/todos/${todo.id}/tags/${tagId}`, {
        method: 'DELETE',
      });

      expect(deleteRes.status).toBe(204);

      // Verify the tag was removed
      const getRes = await app.request(`/api/todos/${todo.id}`);
      const updated = (await getRes.json()) as TodoWithTags;
      expect(updated.tags).toHaveLength(1);
      expect(updated.tags[0].tag.id).not.toBe(tagId);
    });

    it('should return 404 when todo does not exist', async () => {
      const res = await app.request('/api/todos/non-existent-id/tags/tag-id', {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });

    it('should return 404 when tag does not exist', async () => {
      // Create a todo
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Todo',
        }),
      });

      const todo = (await createRes.json()) as TodoWithTags;

      // Try to remove a non-existent tag
      const res = await app.request(`/api/todos/${todo.id}/tags/non-existent-tag-id`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/todos with tags', () => {
    it('should return todos with tag information', async () => {
      // Create todos with tags
      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Todo 1',
          tags: ['urgent'],
        }),
      });

      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Todo 2',
          tags: ['work', 'personal'],
        }),
      });

      // Get all todos
      const res = await app.request('/api/todos');
      expect(res.status).toBe(200);

      const todos = (await res.json()) as TodoWithTags[];
      expect(todos).toHaveLength(2);
      expect(todos[0].tags).toBeDefined();
      expect(todos[1].tags).toBeDefined();
    });
  });

  describe('GET /api/todos/:id with tags', () => {
    it('should return a todo with tag information', async () => {
      // Create a todo with tags
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Todo',
          tags: ['urgent', 'work'],
        }),
      });

      const created = (await createRes.json()) as TodoWithTags;

      // Get the todo
      const getRes = await app.request(`/api/todos/${created.id}`);
      expect(getRes.status).toBe(200);

      const todo = (await getRes.json()) as TodoWithTags;
      expect(todo.tags).toHaveLength(2);
      expect(todo.tags[0].tag.name).toBe('urgent');
      expect(todo.tags[1].tag.name).toBe('work');
    });
  });
});
