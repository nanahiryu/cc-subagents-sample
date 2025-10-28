import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  completed: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  completed: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const getTodosQuerySchema = z.object({
  completed: z.enum(['true', 'false']).optional(),
  q: z.string().optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
  tags: z.string().optional(),
  tagsMode: z.enum(['and', 'or']).optional(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type GetTodosQuery = z.infer<typeof getTodosQuerySchema>;

// Tag validation schemas
export const createTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tag name must be at least 1 character')
    .max(20, 'Tag name must be at most 20 characters')
    .regex(/^[a-zA-Z0-9ぁ-んァ-ヶー一-龠\-_]+$/, 'Tag name contains invalid characters'),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

// Todo-Tag association schemas
export const addTagsToTodoSchema = z.object({
  tagNames: z.array(z.string()).min(1, 'At least one tag name is required'),
});

export type AddTagsToTodoInput = z.infer<typeof addTagsToTodoSchema>;
