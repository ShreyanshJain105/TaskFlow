import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { ColumnSkeleton } from '../components/Skeletons';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: 'bg-slate-400',   countClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'in-progress', label: 'In Progress',  color: 'bg-brand-500',   countClass: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' },
  { id: 'done',        label: 'Done',         color: 'bg-emerald-500', countClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
];

// Priority ordering for the "sort by priority" feature — defined outside the
// component so it doesn't get recreated on every render
const PRIORITY_RANK = { high: 0, med: 1, low: 2 };

const DroppableColumn = ({ column, tasks, onTaskClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-3xl min-h-[200px] transition-all duration-300 border backdrop-blur-xl ${
        isOver
          ? 'bg-brand-50/80 dark:bg-brand-950/30 ring-2 ring-brand-400 dark:ring-brand-600 border-brand-200 dark:border-brand-800'
          : 'bg-white/40 dark:bg-slate-900/40 border-white/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]'
      } p-4`}
    >
      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 min-h-[60px]">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={onTaskClick} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

const BoardPage = () => {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // activeTaskModal: null = closed, 'create' = new task (no default), { status } = new task with pre-filled column, or a task object = edit mode
  const [activeTaskModal, setActiveTaskModal] = useState(null);
  const [draggingTask, setDraggingTask] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('order'); // 'order' | 'priority' | 'dueDate'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: boardData, isLoading: boardLoading } = useQuery({
    queryKey: ['board', boardId],
    // We already have the boards list in cache — pick from there to avoid an extra request.
    // If the cache is cold, this returns undefined and we fall through to the not-found state.
    queryFn: () => api.get('/boards').then((r) => r.data.data.find((b) => b._id === boardId)),
    staleTime: 30_000,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', boardId],
    queryFn: () => api.get(`/boards/${boardId}/tasks`).then((r) => r.data.data),
    staleTime: 5_000,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/tasks/${id}`, data),
    onError: () => {
      toast.error('Failed to save task order');
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  // Drag-and-drop operates on the full unfiltered list so order/status updates
  // stay correct even when a priority filter is active.
  const tasks = tasksData || [];

  const processedTasks = useMemo(() => {
    const base = tasksData || [];
    let result = priorityFilter ? base.filter((t) => t.priority === priorityFilter) : base;

    if (sortBy === 'priority') {
      result = [...result].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    } else if (sortBy === 'dueDate') {
      result = [...result].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else {
      result = [...result].sort((a, b) => a.order - b.order);
    }

    return result;
  }, [tasksData, priorityFilter, sortBy]);

  const getColumnTasks = useCallback(
    (status) => processedTasks.filter((t) => t.status === status),
    [processedTasks]
  );

  const handleDragStart = ({ active }) => {
    const draggedTask = tasks.find((t) => t._id === active.id);
    setDraggingTask(draggedTask || null);
  };

  const handleDragEnd = ({ active, over }) => {
    setDraggingTask(null);
    if (!over) return;

    const sourceTask = tasks.find((t) => t._id === active.id);
    if (!sourceTask) return;

    // 'over' can be either a column (droppable) or another task (sortable).
    // Determine the new status from whichever matched.
    const targetColumn = COLUMNS.find((c) => c.id === over.id);
    const targetTask = tasks.find((t) => t._id === over.id);

    const newStatus = targetColumn ? targetColumn.id : targetTask?.status || sourceTask.status;
    const isMovingColumns = newStatus !== sourceTask.status;

    if (isMovingColumns) {
      // Cross-column move: place at the end of the destination column
      const destinationTasks = tasks.filter((t) => t.status === newStatus);
      const newOrder = destinationTasks.length;
      queryClient.setQueryData(['tasks', boardId], (prev) =>
        prev.map((t) => (t._id === sourceTask._id ? { ...t, status: newStatus, order: newOrder } : t))
      );
      updateTaskMutation.mutate({ id: sourceTask._id, status: newStatus, order: newOrder });
    } else if (targetTask && targetTask._id !== sourceTask._id) {
      // Same-column reorder: recalculate all order values in this column
      const columnTasks = tasks
        .filter((t) => t.status === sourceTask.status)
        .sort((a, b) => a.order - b.order);

      const fromIndex = columnTasks.findIndex((t) => t._id === sourceTask._id);
      const toIndex = columnTasks.findIndex((t) => t._id === targetTask._id);
      if (fromIndex === -1 || toIndex === -1) return;

      const reordered = arrayMove(columnTasks, fromIndex, toIndex).map((t, i) => ({ ...t, order: i }));

      queryClient.setQueryData(['tasks', boardId], (prev) =>
        prev.map((t) => {
          const updated = reordered.find((r) => r._id === t._id);
          return updated ?? t;
        })
      );

      reordered.forEach(({ _id, order }) => updateTaskMutation.mutate({ id: _id, order }));
    }
  };

  const isLoading = boardLoading || tasksLoading;

  if (!isLoading && !boardData) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-20">
          <p className="text-xl text-slate-500 mb-4">Board not found</p>
          <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Navbar />

      <main className="flex-grow w-full mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="btn-ghost p-1.5 text-slate-400"
              aria-label="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {boardData?.title || '…'}
              </h1>
              {boardData?.description && (
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{boardData.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input text-sm py-1.5 w-auto"
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="med">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input text-sm py-1.5 w-auto"
              aria-label="Sort tasks"
            >
              <option value="order">Manual order</option>
              <option value="priority">By priority</option>
              <option value="dueDate">By due date</option>
            </select>

            <button
              id="add-task-btn"
              onClick={() => setActiveTaskModal({ defaultStatus: 'todo' })}
              className="btn-primary"
            >
              + Add Task
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {COLUMNS.map((c) => (
              <div key={c.id} className="rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 p-4">
                <ColumnSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {COLUMNS.map((col) => {
                const colTasks = getColumnTasks(col.id);
                return (
                  <div key={col.id} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {col.label}
                      </h2>
                      <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${col.countClass}`}>
                        {colTasks.length}
                      </span>
                    </div>
                    <DroppableColumn
                      column={col}
                      tasks={colTasks}
                      onTaskClick={(t) => setActiveTaskModal(t)}
                    />
                    <button
                      onClick={() => setActiveTaskModal({ defaultStatus: col.id })}
                      className="mt-2 flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add task
                    </button>
                  </div>
                );
              })}
            </div>

            <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
              {draggingTask ? (
                <TaskCard task={draggingTask} onClick={() => {}} isDragOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {activeTaskModal && (
        <TaskModal
          boardId={boardId}
          // If activeTaskModal is a plain object with defaultStatus, it's a 'create' intent;
          // if it has _id, it's an edit intent.
          task={activeTaskModal._id ? activeTaskModal : null}
          defaultStatus={activeTaskModal._id ? undefined : activeTaskModal.defaultStatus}
          onClose={() => setActiveTaskModal(null)}
        />
      )}

      <Footer />
    </div>
  );
};

export default BoardPage;
