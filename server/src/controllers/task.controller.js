const Board = require('../models/Board');
const Task = require('../models/Task');
const { getAiEstimate } = require('../utils/groq');

// GET /api/boards/:boardId/tasks
const getTasksByBoard = async (req, res, next) => {
  try {
    const board = await Board.findOne({ _id: req.params.boardId, owner: req.user._id });
    if (!board) {
      return res.status(404).json({ success: false, error: { message: 'Board not found' } });
    }

    const tasks = await Task.find({ board: board._id }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

// POST /api/boards/:boardId/tasks
const createTask = async (req, res, next) => {
  try {
    const board = await Board.findOne({ _id: req.params.boardId, owner: req.user._id });
    if (!board) {
      return res.status(404).json({ success: false, error: { message: 'Board not found' } });
    }

    const { title, description, status, priority, dueDate, estimatedEffort, aiReasoning, order } =
      req.validatedBody;

    // Determine order: max existing order + 1 within status column
    const maxOrderTask = await Task.findOne({ board: board._id, status: status || 'todo' })
      .sort({ order: -1 })
      .select('order');
    const taskOrder = order !== undefined ? order : (maxOrderTask ? maxOrderTask.order + 1 : 0);

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate: dueDate || null,
      estimatedEffort,
      aiReasoning,
      board: board._id,
      owner: req.user._id,
      order: taskOrder,
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, error: { message: 'Task not found' } });
    }

    const fields = req.validatedBody;
    Object.assign(task, fields);
    if (fields.dueDate === null) task.dueDate = null;
    await task.save();

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, error: { message: 'Task not found' } });
    }

    await task.deleteOne();
    res.json({ success: true, data: { message: 'Task deleted' } });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks/ai-estimate
const aiEstimate = async (req, res, next) => {
  try {
    const { title, description } = req.validatedBody;
    const result = await getAiEstimate(title, description);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasksByBoard, createTask, updateTask, deleteTask, aiEstimate };
