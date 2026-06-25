const { z } = require('zod');

const createBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional().default(''),
});

const updateBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).optional(),
  description: z.string().max(500).optional(),
});

module.exports = { createBoardSchema, updateBoardSchema };
