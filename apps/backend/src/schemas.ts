import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  completed: z.boolean().optional(),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  completed: z.boolean().optional(),
});

export const getTodosQuerySchema = z.object({
  completed: z.enum(['true', 'false']).optional(),
  q: z.string().optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
  tags: z.string().optional(), // Comma-separated tag names
  tagsMode: z.enum(['and', 'or']).optional().default('or'),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type GetTodosQuery = z.infer<typeof getTodosQuerySchema>;

// Tag schemas
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9ぁ-んァ-ヶー一-龠\-_]+$/, {
      message:
        'Tag name can only contain alphanumeric characters, Japanese characters, hyphens, and underscores',
    }),
});

export const addTagsToTodoSchema = z.object({
  tagNames: z.array(z.string().min(1).max(20)).min(1),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type AddTagsToTodoInput = z.infer<typeof addTagsToTodoSchema>;
