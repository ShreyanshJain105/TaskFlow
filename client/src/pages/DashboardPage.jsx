import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import { BoardCardSkeleton } from '../components/Skeletons';
import toast from 'react-hot-toast';

// Sub-components are defined above the main page component so the file reads
// top-to-bottom without needing to scroll past the default export to understand them.

const Stat = ({ label, value, color }) => (
  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const BoardsBarChart = ({ boards }) => {
  const data = boards.map((b) => ({ name: b.title.slice(0, 12), tasks: b.taskCount || 0 }));
  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Tasks per board</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="transparent" />
          <YAxis tick={{ fontSize: 11 }} stroke="transparent" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              // These match the dark card style. Light mode users will still see a dark
              // tooltip — acceptable for now, a future pass could use CSS vars here.
              background: 'rgb(15 23 42)',
              border: '1px solid rgb(30 41 59)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e2e8f0',
            }}
          />
          <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const EmptyState = ({ onCreate }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
    <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mb-5">
      <svg className="w-10 h-10 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">No boards yet</h2>
    <p className="text-slate-400 dark:text-slate-500 mb-6 max-w-xs">
      Create your first board to start organizing tasks and tracking progress.
    </p>
    <button id="empty-state-create-btn" onClick={onCreate} className="btn-primary">
      Create your first board
    </button>
  </div>
);

const BoardCard = ({ board, onEdit, onDelete, onClick }) => (
  <div
    className="card p-5 cursor-pointer hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-200 group animate-fade-in"
    onClick={() => onClick(board)}
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
        {board.title}
      </h3>
      <div
        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(board)}
          className="btn-ghost p-1.5 text-slate-400 hover:text-brand-600"
          aria-label="Edit board"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(board)}
          className="btn-ghost p-1.5 text-slate-400 hover:text-red-500"
          aria-label="Delete board"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    {board.description && (
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
        {board.description}
      </p>
    )}

    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
      <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
        {board.taskCount ?? 0} task{board.taskCount !== 1 ? 's' : ''}
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {new Date(board.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
    </div>
  </div>
);

const BoardFormModal = ({ board, onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: board?.title || '', description: board?.description || '' });
  const [titleError, setTitleError] = useState('');

  const saveMutation = useMutation({
    mutationFn: (data) =>
      board ? api.patch(`/boards/${board._id}`, data) : api.post('/boards', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success(board ? 'Board updated' : 'Board created');
      onClose();
    },
    onError: (err) => {
      const message = err.response?.data?.error?.message || 'Failed to save board';
      setTitleError(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setTitleError('Title is required');
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-md shadow-2xl animate-slide-up p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">
          {board ? 'Edit Board' : 'New Board'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="board-title" className="label">Title *</label>
            <input
              id="board-title"
              type="text"
              placeholder="e.g. Product Roadmap"
              className={`input ${titleError ? 'border-red-400' : ''}`}
              value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setTitleError(''); }}
              autoFocus
            />
            {titleError && <p className="error-text">{titleError}</p>}
          </div>
          <div>
            <label htmlFor="board-desc" className="label">Description</label>
            <input
              id="board-desc"
              type="text"
              placeholder="Optional description"
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              id="board-save-btn"
              disabled={saveMutation.isPending}
              className="btn-primary flex-1"
            >
              {saveMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Saving…
                </span>
              ) : board ? 'Save changes' : 'Create board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [boardModal, setBoardModal] = useState(null); // null | 'create' | board object
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: boardsData, isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: () => api.get('/boards').then((r) => r.data.data),
    staleTime: 30_000,
  });

  const boards = boardsData || [];
  const totalTasks = boards.reduce((sum, b) => sum + (b.taskCount || 0), 0);

  const deleteMutation = useMutation({
    mutationFn: (boardId) => api.delete(`/boards/${boardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Board deleted');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Failed to delete board');
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Navbar />

      <main className="flex-grow w-full mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Boards</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {boards.length > 0
                ? `${boards.length} board${boards.length !== 1 ? 's' : ''} · ${totalTasks} task${totalTasks !== 1 ? 's' : ''}`
                : 'Get started by creating your first board'}
            </p>
          </div>
          <button
            id="new-board-btn"
            onClick={() => setBoardModal('create')}
            className="btn-primary gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Board
          </button>
        </div>

        {boards.length > 0 && (
          <div className="card p-6 mb-8 animate-fade-in">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              Overview
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Stat label="Total Boards" value={boards.length} color="text-brand-600" />
              <Stat label="Total Tasks" value={totalTasks} color="text-slate-700 dark:text-slate-300" />
            </div>
            <BoardsBarChart boards={boards} />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <BoardCardSkeleton key={i} />)}
          </div>
        ) : boards.length === 0 ? (
          <EmptyState onCreate={() => setBoardModal('create')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {boards.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onClick={(b) => navigate(`/board/${b._id}`)}
                onEdit={(b) => setBoardModal(b)}
                onDelete={(b) => setDeleteTarget(b)}
              />
            ))}
            <button
              onClick={() => setBoardModal('create')}
              className="card p-5 border-dashed hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[120px] group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 font-medium transition-colors">
                New Board
              </span>
            </button>
          </div>
        )}
      </main>

      {boardModal && (
        <BoardFormModal
          board={boardModal === 'create' ? null : boardModal}
          onClose={() => setBoardModal(null)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="card w-full max-w-sm shadow-2xl animate-slide-up p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Board</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to delete{' '}
              <strong className="text-slate-700 dark:text-slate-200">"{deleteTarget.title}"</strong>?
              {' '}All tasks will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-board"
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DashboardPage;
