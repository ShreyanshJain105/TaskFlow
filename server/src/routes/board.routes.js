const express = require('express');
const router = express.Router();
const {
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
} = require('../controllers/board.controller');
const { getTasksByBoard, createTask } = require('../controllers/task.controller');
const protect = require('../middleware/protect');
const { validateBody } = require('../middleware/validate');
const { createBoardSchema, updateBoardSchema } = require('../schemas/board.schema');
const { createTaskSchema } = require('../schemas/task.schema');

router.use(protect);

router.get('/', getBoards);
router.post('/', validateBody(createBoardSchema), createBoard);
router.patch('/:id', validateBody(updateBoardSchema), updateBoard);
router.delete('/:id', deleteBoard);

// Nested task routes under boards
router.get('/:boardId/tasks', getTasksByBoard);
router.post('/:boardId/tasks', validateBody(createTaskSchema), createTask);

module.exports = router;
