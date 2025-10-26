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
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type GetTodosQuery = z.infer<typeof getTodosQuerySchema>;
