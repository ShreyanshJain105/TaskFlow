import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PRIORITY_BADGE_CLASS = {
  low: 'badge-low',
  med: 'badge-med',
  high: 'badge-high',
};

const PRIORITY_LABEL = { low: 'Low', med: 'Med', high: 'High' };

const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));

const isOverdue = (dueDate) => dueDate && new Date(dueDate) < startOfToday();

const formatShortDate = (dueDate) =>
  new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const TaskCard = ({ task, onClick, isDragOverlay = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue = isOverdue(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? {} : style}
      className={`card p-4 cursor-pointer group hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-150 animate-fade-in ${
        isDragOverlay ? 'rotate-2 shadow-2xl ring-2 ring-brand-400' : ''
      } ${isDragging ? 'pointer-events-none' : ''}`}
      onClick={() => !isDragging && onClick(task)}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
          {task.title}
        </h3>
        {/* Drag handle indicator — visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 shrink-0 mt-0.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>

      {task.description && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={PRIORITY_BADGE_CLASS[task.priority] || 'badge-med'}>
          {PRIORITY_LABEL[task.priority] || task.priority}
        </span>

        {task.estimatedEffort && (
          <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {task.estimatedEffort}
          </span>
        )}

        {task.dueDate && (
          <span
            className={`badge ${
              overdue
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {overdue ? 'Overdue · ' : ''}{formatShortDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
