import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const prisma = new PrismaClient();

describe('Database Schema - Tag Models', () => {
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

  it('should create a Tag with unique name', async () => {
    const tag = await prisma.tag.create({
      data: {
        name: '重要',
      },
    });

    expect(tag.id).toBeDefined();
    expect(tag.name).toBe('重要');
    expect(tag.createdAt).toBeInstanceOf(Date);
  });

  it('should create a Todo with tags relationship', async () => {
    const tag = await prisma.tag.create({
      data: {
        name: '緊急',
      },
    });

    const todo = await prisma.todo.create({
      data: {
        title: 'Test Todo',
        tags: {
          create: {
            tagId: tag.id,
          },
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    expect(todo.tags).toHaveLength(1);
    expect(todo.tags[0].tag.name).toBe('緊急');
  });

  it('should enforce unique constraint on tag name', async () => {
    await prisma.tag.create({
      data: {
        name: 'ユニークタグ',
      },
    });

    await expect(
      prisma.tag.create({
        data: {
          name: 'ユニークタグ',
        },
      }),
    ).rejects.toThrow();
  });

  it('should cascade delete TodoTag when Todo is deleted', async () => {
    const tag = await prisma.tag.create({
      data: {
        name: 'カスケードテスト',
      },
    });

    const todo = await prisma.todo.create({
      data: {
        title: 'Cascade Test Todo',
        tags: {
          create: {
            tagId: tag.id,
          },
        },
      },
    });

    // Delete Todo
    await prisma.todo.delete({
      where: { id: todo.id },
    });

    // TodoTag should be deleted
    const todoTags = await prisma.todoTag.findMany({
      where: { todoId: todo.id },
    });
    expect(todoTags).toHaveLength(0);

    // Tag should still exist
    const existingTag = await prisma.tag.findUnique({
      where: { id: tag.id },
    });
    expect(existingTag).not.toBeNull();
  });

  it('should cascade delete TodoTag when Tag is deleted', async () => {
    const tag = await prisma.tag.create({
      data: {
        name: 'タグカスケード',
      },
    });

    const todo = await prisma.todo.create({
      data: {
        title: 'Tag Cascade Test Todo',
        tags: {
          create: {
            tagId: tag.id,
          },
        },
      },
    });

    // Delete Tag
    await prisma.tag.delete({
      where: { id: tag.id },
    });

    // TodoTag should be deleted
    const todoTags = await prisma.todoTag.findMany({
      where: { tagId: tag.id },
    });
    expect(todoTags).toHaveLength(0);

    // Todo should still exist
    const existingTodo = await prisma.todo.findUnique({
      where: { id: todo.id },
    });
    expect(existingTodo).not.toBeNull();
  });

  it('should prevent duplicate TodoTag (composite primary key)', async () => {
    const tag = await prisma.tag.create({
      data: {
        name: '複合キーテスト',
      },
    });

    const todo = await prisma.todo.create({
      data: {
        title: 'Composite Key Test Todo',
      },
    });

    // Create first TodoTag
    await prisma.todoTag.create({
      data: {
        todoId: todo.id,
        tagId: tag.id,
      },
    });

    // Attempt to create duplicate TodoTag
    await expect(
      prisma.todoTag.create({
        data: {
          todoId: todo.id,
          tagId: tag.id,
        },
      }),
    ).rejects.toThrow();
  });

  it('should enforce VARCHAR(20) constraint on tag name', async () => {
    const longName = 'a'.repeat(21);

    await expect(
      prisma.tag.create({
        data: {
          name: longName,
        },
      }),
    ).rejects.toThrow();
  });
});
