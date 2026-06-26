const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'med', 'high'],
      default: 'med',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    estimatedEffort: {
      type: String,
      default: '',
    },
    aiReasoning: {
      type: String,
      default: '',
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Covers getTasksByBoard (board + sort by order) and createTask (board + status + order)
taskSchema.index({ board: 1, status: 1, order: 1 });

// Covers updateTask and deleteTask which filter by owner for authorization
taskSchema.index({ owner: 1 });

module.exports = mongoose.model('Task', taskSchema);
