const express = require('express');
const router = express.Router();
const { updateTask, deleteTask, aiEstimate } = require('../controllers/task.controller');
const protect = require('../middleware/protect');
const { validateBody } = require('../middleware/validate');
const { updateTaskSchema, aiEstimateSchema } = require('../schemas/task.schema');

router.use(protect);

// AI estimate — must come before /:id to avoid route conflict
router.post('/ai-estimate', validateBody(aiEstimateSchema), aiEstimate);

router.patch('/:id', validateBody(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
