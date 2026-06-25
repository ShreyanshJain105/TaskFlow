const Board = require('../models/Board');
const Task = require('../models/Task');

// GET /api/boards — only boards owned by req.user
const getBoards = async (req, res, next) => {
  try {
    const boards = await Board.find({ owner: req.user._id }).sort({ createdAt: -1 });

    // Attach task counts
    const boardsWithCounts = await Promise.all(
      boards.map(async (board) => {
        const taskCount = await Task.countDocuments({ board: board._id });
        return { ...board.toObject(), taskCount };
      })
    );

    res.json({ success: true, data: boardsWithCounts });
  } catch (err) {
    next(err);
  }
};

// POST /api/boards
const createBoard = async (req, res, next) => {
  try {
    const { title, description } = req.validatedBody;
    const board = await Board.create({ title, description, owner: req.user._id });
    res.status(201).json({ success: true, data: { ...board.toObject(), taskCount: 0 } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/boards/:id
const updateBoard = async (req, res, next) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, owner: req.user._id });
    if (!board) {
      return res.status(404).json({ success: false, error: { message: 'Board not found' } });
    }

    const { title, description } = req.validatedBody;
    if (title !== undefined) board.title = title;
    if (description !== undefined) board.description = description;
    await board.save();

    res.json({ success: true, data: board });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/boards/:id — cascade delete tasks
const deleteBoard = async (req, res, next) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, owner: req.user._id });
    if (!board) {
      return res.status(404).json({ success: false, error: { message: 'Board not found' } });
    }

    await Task.deleteMany({ board: board._id });
    await board.deleteOne();

    res.json({ success: true, data: { message: 'Board and its tasks deleted' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBoards, createBoard, updateBoard, deleteBoard };
