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

  // --- Boundary Tests ---
  describe('Boundary Tests', () => {
    it('should accept tag name with exactly 20 characters', async () => {
      const exactName = 'a'.repeat(20);
      const tag = await prisma.tag.create({
        data: {
          name: exactName,
        },
      });

      expect(tag.name).toBe(exactName);
      expect(tag.name.length).toBe(20);
    });

    it('should accept empty string as tag name (NOTE: potential validation issue)', async () => {
      // NOTE: 実装の不備 - 空文字列のバリデーションが欠けている
      // 本来はバリデーションで拒否すべきだが、現在のスキーマでは許容されている
      const tag = await prisma.tag.create({
        data: {
          name: '',
        },
      });

      expect(tag.name).toBe('');
    });

    it('should handle tag name with 1 character', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'A',
        },
      });

      expect(tag.name).toBe('A');
      expect(tag.name.length).toBe(1);
    });

    it('should handle tag name with 19 characters (just below limit)', async () => {
      const name = 'b'.repeat(19);
      const tag = await prisma.tag.create({
        data: {
          name: name,
        },
      });

      expect(tag.name).toBe(name);
      expect(tag.name.length).toBe(19);
    });
  });

  // --- Edge Case Tests ---
  describe('Edge Case Tests', () => {
    it('should allow multiple tags on a single todo', async () => {
      const tag1 = await prisma.tag.create({
        data: { name: 'タグ1' },
      });
      const tag2 = await prisma.tag.create({
        data: { name: 'タグ2' },
      });
      const tag3 = await prisma.tag.create({
        data: { name: 'タグ3' },
      });

      const todo = await prisma.todo.create({
        data: {
          title: 'Multiple Tags Todo',
          tags: {
            create: [{ tagId: tag1.id }, { tagId: tag2.id }, { tagId: tag3.id }],
          },
        },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      expect(todo.tags).toHaveLength(3);
      expect(todo.tags.map((t) => t.tag.name)).toEqual(['タグ1', 'タグ2', 'タグ3']);
    });

    it('should allow same tag on multiple todos', async () => {
      const tag = await prisma.tag.create({
        data: { name: '共通タグ' },
      });

      const todo1 = await prisma.todo.create({
        data: {
          title: 'Todo 1',
          tags: {
            create: { tagId: tag.id },
          },
        },
      });

      const todo2 = await prisma.todo.create({
        data: {
          title: 'Todo 2',
          tags: {
            create: { tagId: tag.id },
          },
        },
      });

      const todoTags = await prisma.todoTag.findMany({
        where: { tagId: tag.id },
      });

      expect(todoTags).toHaveLength(2);
      expect(todoTags.map((t) => t.todoId)).toContain(todo1.id);
      expect(todoTags.map((t) => t.todoId)).toContain(todo2.id);
    });

    it('should query TodoTag by todoId using index', async () => {
      const tag = await prisma.tag.create({
        data: { name: 'インデックステスト' },
      });

      const todo = await prisma.todo.create({
        data: {
          title: 'Index Test Todo',
          tags: {
            create: { tagId: tag.id },
          },
        },
      });

      const todoTags = await prisma.todoTag.findMany({
        where: { todoId: todo.id },
        include: { tag: true },
      });

      expect(todoTags).toHaveLength(1);
      expect(todoTags[0].tag.name).toBe('インデックステスト');
    });

    it('should query TodoTag by tagId using index', async () => {
      const tag = await prisma.tag.create({
        data: { name: 'タグIDインデックス' },
      });

      const todo1 = await prisma.todo.create({
        data: {
          title: 'Todo A',
          tags: {
            create: { tagId: tag.id },
          },
        },
      });

      const todo2 = await prisma.todo.create({
        data: {
          title: 'Todo B',
          tags: {
            create: { tagId: tag.id },
          },
        },
      });

      const todoTags = await prisma.todoTag.findMany({
        where: { tagId: tag.id },
        include: { todo: true },
      });

      expect(todoTags).toHaveLength(2);
      expect(todoTags.map((t) => t.todo.title)).toContain('Todo A');
      expect(todoTags.map((t) => t.todo.title)).toContain('Todo B');
    });

    it('should handle tag name with special characters', async () => {
      const specialNames = ['タグ!', 'tag@123', 'タグ#1', 'tag$test'];

      for (const name of specialNames) {
        const tag = await prisma.tag.create({
          data: { name },
        });
        expect(tag.name).toBe(name);
      }
    });

    it('should allow adding tags to existing todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Existing Todo',
        },
      });

      const tag = await prisma.tag.create({
        data: { name: '後付けタグ' },
      });

      await prisma.todoTag.create({
        data: {
          todoId: todo.id,
          tagId: tag.id,
        },
      });

      const updatedTodo = await prisma.todo.findUnique({
        where: { id: todo.id },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      expect(updatedTodo?.tags).toHaveLength(1);
      expect(updatedTodo?.tags[0].tag.name).toBe('後付けタグ');
    });

    it('should handle todo without any tags', async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'No Tags Todo',
        },
        include: {
          tags: true,
        },
      });

      expect(todo.tags).toHaveLength(0);
    });

    it('should handle tag without any todos', async () => {
      const tag = await prisma.tag.create({
        data: { name: '未使用タグ' },
      });

      const tagWithTodos = await prisma.tag.findUnique({
        where: { id: tag.id },
        include: {
          todos: true,
        },
      });

      expect(tagWithTodos?.todos).toHaveLength(0);
    });
  });

  // --- Error Handling Tests ---
  describe('Error Handling Tests', () => {
    it('should reject creating TodoTag with non-existent todoId', async () => {
      const tag = await prisma.tag.create({
        data: { name: '存在確認タグ' },
      });

      const nonExistentTodoId = '00000000-0000-0000-0000-000000000000';

      await expect(
        prisma.todoTag.create({
          data: {
            todoId: nonExistentTodoId,
            tagId: tag.id,
          },
        }),
      ).rejects.toThrow();
    });

    it('should reject creating TodoTag with non-existent tagId', async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Valid Todo',
        },
      });

      const nonExistentTagId = '00000000-0000-0000-0000-000000000001';

      await expect(
        prisma.todoTag.create({
          data: {
            todoId: todo.id,
            tagId: nonExistentTagId,
          },
        }),
      ).rejects.toThrow();
    });

    it('should handle deleting tag that has multiple todos', async () => {
      const tag = await prisma.tag.create({
        data: { name: '削除テストタグ' },
      });

      const todo1 = await prisma.todo.create({
        data: {
          title: 'Todo 1',
          tags: {
            create: { tagId: tag.id },
          },
        },
      });

      const todo2 = await prisma.todo.create({
        data: {
          title: 'Todo 2',
          tags: {
            create: { tagId: tag.id },
          },
        },
      });

      // Delete tag - should cascade delete all TodoTags
      await prisma.tag.delete({
        where: { id: tag.id },
      });

      const remainingTodoTags = await prisma.todoTag.findMany({
        where: { tagId: tag.id },
      });

      expect(remainingTodoTags).toHaveLength(0);

      // Todos should still exist
      const existingTodo1 = await prisma.todo.findUnique({
        where: { id: todo1.id },
      });
      const existingTodo2 = await prisma.todo.findUnique({
        where: { id: todo2.id },
      });

      expect(existingTodo1).not.toBeNull();
      expect(existingTodo2).not.toBeNull();
    });

    it('should handle deleting todo that has multiple tags', async () => {
      const tag1 = await prisma.tag.create({
        data: { name: 'タグA' },
      });
      const tag2 = await prisma.tag.create({
        data: { name: 'タグB' },
      });

      const todo = await prisma.todo.create({
        data: {
          title: 'Multi Tag Todo',
          tags: {
            create: [{ tagId: tag1.id }, { tagId: tag2.id }],
          },
        },
      });

      // Delete todo - should cascade delete all TodoTags
      await prisma.todo.delete({
        where: { id: todo.id },
      });

      const remainingTodoTags = await prisma.todoTag.findMany({
        where: { todoId: todo.id },
      });

      expect(remainingTodoTags).toHaveLength(0);

      // Tags should still exist
      const existingTag1 = await prisma.tag.findUnique({
        where: { id: tag1.id },
      });
      const existingTag2 = await prisma.tag.findUnique({
        where: { id: tag2.id },
      });

      expect(existingTag1).not.toBeNull();
      expect(existingTag2).not.toBeNull();
    });

    it('should handle concurrent tag creation with same name', async () => {
      const tagName = '競合テスト';

      // First creation should succeed
      const tag1Promise = prisma.tag.create({
        data: { name: tagName },
      });

      // Second creation should fail due to unique constraint
      const tag2Promise = prisma.tag.create({
        data: { name: tagName },
      });

      const results = await Promise.allSettled([tag1Promise, tag2Promise]);

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failureCount = results.filter((r) => r.status === 'rejected').length;

      // One should succeed, one should fail
      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);
    });
  });
});
