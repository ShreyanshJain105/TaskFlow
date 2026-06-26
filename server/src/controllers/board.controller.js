const Board = require('../models/Board');
const Task = require('../models/Task');

const getBoards = async (req, res, next) => {
  try {
    const boards = await Board.find({ owner: req.user._id }).sort({ createdAt: -1 });

    // Get task counts for all boards in a single aggregation instead of N separate queries
    const taskCounts = await Task.aggregate([
      { $match: { board: { $in: boards.map((b) => b._id) } } },
      { $group: { _id: '$board', count: { $sum: 1 } } },
    ]);

    const countMap = Object.fromEntries(taskCounts.map((tc) => [tc._id.toString(), tc.count]));

    const result = boards.map((board) => ({
      ...board.toObject(),
      taskCount: countMap[board._id.toString()] ?? 0,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const createBoard = async (req, res, next) => {
  try {
    const { title, description } = req.validatedBody;
    const board = await Board.create({ title, description, owner: req.user._id });
    res.status(201).json({ success: true, data: { ...board.toObject(), taskCount: 0 } });
  } catch (err) {
    next(err);
  }
};

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

const deleteBoard = async (req, res, next) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, owner: req.user._id });
    if (!board) {
      return res.status(404).json({ success: false, error: { message: 'Board not found' } });
    }

    // Tasks and the board itself can be deleted in parallel — no dependency between them
    await Promise.all([Task.deleteMany({ board: board._id }), board.deleteOne()]);

    res.json({ success: true, data: { message: 'Board and its tasks deleted' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBoards, createBoard, updateBoard, deleteBoard };
