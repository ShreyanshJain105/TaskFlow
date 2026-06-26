/**
 * Skeleton placeholder components for loading states.
 * These mirror the shape of their real counterparts so the layout doesn't
 * shift when data arrives.
 */

export const BoardCardSkeleton = () => (
  <div className="card p-5 space-y-3">
    <div className="skeleton h-5 w-3/4 rounded" />
    <div className="skeleton h-4 w-full rounded" />
    <div className="skeleton h-4 w-2/3 rounded" />
    <div className="flex items-center justify-between mt-4">
      <div className="skeleton h-5 w-16 rounded-full" />
      <div className="skeleton h-7 w-20 rounded-lg" />
    </div>
  </div>
);

export const TaskCardSkeleton = () => (
  <div className="card p-4 space-y-2.5">
    <div className="skeleton h-4 w-full rounded" />
    <div className="skeleton h-4 w-4/5 rounded" />
    <div className="flex gap-2 mt-3">
      <div className="skeleton h-5 w-12 rounded-full" />
      <div className="skeleton h-5 w-16 rounded-full" />
    </div>
  </div>
);

export const ColumnSkeleton = () => (
  <div className="space-y-3">
    <div className="skeleton h-6 w-24 rounded mb-4" />
    {[1, 2, 3].map((i) => (
      <TaskCardSkeleton key={i} />
    ))}
  </div>
);
