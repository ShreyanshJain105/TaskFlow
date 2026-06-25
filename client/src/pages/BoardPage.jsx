import { useState, useMemo } from 'react';
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
  { id: 'todo', label: 'To Do', color: 'bg-slate-400', count_color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-brand-500', count_color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' },
  { id: 'done', label: 'Done', color: 'bg-emerald-500', count_color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
];

const DroppableColumn = ({ column, tasks, onTaskClick, activeId }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-3xl min-h-[200px] transition-all duration-300 border backdrop-blur-xl ${
        isOver ? 'bg-brand-50/80 dark:bg-brand-950/30 ring-2 ring-brand-400 dark:ring-brand-600 border-brand-200 dark:border-brand-800' : 'bg-white/40 dark:bg-slate-900/40 border-white/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]'
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
  const qc = useQueryClient();
  const [taskModal, setTaskModal] = useState(null); // null | 'create' | task
  const [activeTask, setActiveTask] = useState(null);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('order'); // 'order' | 'priority' | 'dueDate'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: boardData, isLoading: boardLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => api.get(`/boards`).then((r) => r.data.data.find((b) => b._id === boardId)),
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
      toast.error('Failed to update task');
      qc.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  const tasks = tasksData || [];

  const PRIORITY_ORDER = { high: 0, med: 1, low: 2 };

  const processedTasks = useMemo(() => {
    let filtered = tasks;
    if (filter) filtered = filtered.filter((t) => t.priority === filter);
    if (sort === 'priority') {
      filtered = [...filtered].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    } else if (sort === 'dueDate') {
      filtered = [...filtered].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else {
      filtered = [...filtered].sort((a, b) => a.order - b.order);
    }
    return filtered;
  }, [tasks, filter, sort]);

  const getColumnTasks = (status) => processedTasks.filter((t) => t.status === status);

  const handleDragStart = ({ active }) => {
    const t = tasks.find((t) => t._id === active.id);
    setActiveTask(t || null);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    const overId = over.id;
    // Check if dropped on a column (status change)
    const targetColumn = COLUMNS.find((c) => c.id === overId);
    const overTask = tasks.find((t) => t._id === overId);

    const newStatus = targetColumn ? targetColumn.id : overTask?.status || activeTask.status;
    const sameColumn = newStatus === activeTask.status;

    if (targetColumn && !sameColumn) {
      // Moved to a new column
      const colTasks = tasks.filter((t) => t.status === newStatus);
      const newOrder = colTasks.length;
      qc.setQueryData(['tasks', boardId], (old) =>
        old.map((t) => t._id === activeTask._id ? { ...t, status: newStatus, order: newOrder } : t)
      );
      updateTaskMutation.mutate({ id: activeTask._id, status: newStatus, order: newOrder });
    } else if (overTask && overTask._id !== activeTask._id && sameColumn) {
      // Reorder within column
      const colTasks = tasks
        .filter((t) => t.status === activeTask.status)
        .sort((a, b) => a.order - b.order);
      const oldIdx = colTasks.findIndex((t) => t._id === activeTask._id);
      const newIdx = colTasks.findIndex((t) => t._id === overTask._id);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(colTasks, oldIdx, newIdx);
      // Update orders
      const updates = reordered.map((t, i) => ({ ...t, order: i }));
      qc.setQueryData(['tasks', boardId], (old) =>
        old.map((t) => {
          const updated = updates.find((u) => u._id === t._id);
          return updated || t;
        })
      );
      // Persist each reordered task
      updates.forEach(({ _id, order }) => {
        updateTaskMutation.mutate({ id: _id, order });
      });
    } else if (overTask && !sameColumn) {
      // Dropped on a task in another column
      const colTasks = tasks.filter((t) => t.status === overTask.status);
      const newOrder = tasks.findIndex((t) => t._id === overTask._id);
      qc.setQueryData(['tasks', boardId], (old) =>
        old.map((t) => t._id === activeTask._id ? { ...t, status: overTask.status, order: newOrder } : t)
      );
      updateTaskMutation.mutate({ id: activeTask._id, status: overTask.status, order: newOrder });
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
        {/* Board header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="btn-ghost p-1.5 text-slate-400"
              aria-label="Back"
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
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input text-sm py-1.5 w-auto"
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="med">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input text-sm py-1.5 w-auto"
              aria-label="Sort tasks"
            >
              <option value="order">Manual order</option>
              <option value="priority">By priority</option>
              <option value="dueDate">By due date</option>
            </select>

            <button
              id="add-task-btn"
              onClick={() => setTaskModal('create')}
              className="btn-primary"
            >
              + Add Task
            </button>
          </div>
        </div>

        {/* Kanban board */}
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
                    {/* Column header */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {col.label}
                      </h2>
                      <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${col.count_color}`}>
                        {colTasks.length}
                      </span>
                    </div>
                    <DroppableColumn
                      column={col}
                      tasks={colTasks}
                      onTaskClick={(t) => setTaskModal(t)}
                      activeId={activeTask?._id}
                    />
                    <button
                      onClick={() => setTaskModal('create')}
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

            {/* Drag overlay — shows floating card */}
            <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
              {activeTask ? (
                <TaskCard task={activeTask} onClick={() => {}} isDragOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* Task modal */}
      {taskModal && (
        <TaskModal
          boardId={boardId}
          task={taskModal === 'create' ? null : taskModal}
          onClose={() => setTaskModal(null)}
        />
      )}
      <Footer />
    </div>
  );
};

export default BoardPage;
