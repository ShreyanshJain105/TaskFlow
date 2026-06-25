const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['todo', 'in-progress', 'done']).optional().default('todo'),
  priority: z.enum(['low', 'med', 'high']).optional().default('med'),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  estimatedEffort: z.string().max(50).optional().default(''),
  aiReasoning: z.string().max(500).optional().default(''),
  order: z.number().optional().default(0),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'med', 'high']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  estimatedEffort: z.string().max(50).optional(),
  aiReasoning: z.string().max(500).optional(),
  order: z.number().optional(),
});

const aiEstimateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().default(''),
});

module.exports = { createTaskSchema, updateTaskSchema, aiEstimateSchema };
