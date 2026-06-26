import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Spinner from './Spinner';
import toast from 'react-hot-toast';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'med', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const TaskModal = ({ boardId, task, defaultStatus, onClose }) => {
  const isEdit = !!task;
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || defaultStatus || 'todo',
    priority: task?.priority || 'med',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    estimatedEffort: task?.estimatedEffort || '',
    aiReasoning: task?.aiReasoning || '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const validateForm = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.dueDate) {
      errors.dueDate = 'Due date is required';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (form.dueDate < today) errors.dueDate = 'Due date cannot be in the past';
    }
    return errors;
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.post(`/boards/${boardId}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      toast.success('Task created');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create task');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch(`/tasks/${task._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      toast.success('Task updated');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update task');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${task._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Task deleted');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete task');
    },
  });

  const handleAiEstimate = async () => {
    if (!form.title.trim()) {
      setFieldErrors({ title: 'Add a title first to get an AI estimate' });
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.post('/tasks/ai-estimate', {
        title: form.title,
        description: form.description,
      });
      const data = res.data.data;
      setAiResult(data);
      setForm((prev) => ({
        ...prev,
        estimatedEffort: data.estimatedEffort || prev.estimatedEffort,
        dueDate: data.suggestedDueDate || prev.dueDate,
        aiReasoning: data.reasoning || '',
      }));
    } catch {
      toast.error('AI estimate request failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    };

    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="task-title" className="label">Title *</label>
            <input
              id="task-title"
              type="text"
              placeholder="What needs to be done?"
              className={`input ${fieldErrors.title ? 'border-red-400' : ''}`}
              value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setFieldErrors({}); }}
            />
            {fieldErrors.title && <p className="error-text">{fieldErrors.title}</p>}
          </div>

          <div>
            <label htmlFor="task-desc" className="label">Description</label>
            <textarea
              id="task-desc"
              rows={3}
              placeholder="Optional details…"
              className="input resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-status" className="label">Status</label>
              <select
                id="task-status"
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="task-priority" className="label">Priority</label>
              <select
                id="task-priority"
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-due" className="label">Due Date *</label>
              <input
                id="task-due"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className={`input ${fieldErrors.dueDate ? 'border-red-400' : ''}`}
                value={form.dueDate}
                onChange={(e) => { setForm({ ...form, dueDate: e.target.value }); setFieldErrors((prev) => ({ ...prev, dueDate: undefined })); }}
              />
              {fieldErrors.dueDate && <p className="error-text">{fieldErrors.dueDate}</p>}
            </div>
            <div>
              <label htmlFor="task-effort" className="label">Effort Estimate</label>
              <input
                id="task-effort"
                type="text"
                placeholder="e.g. 2h, half day"
                className="input"
                value={form.estimatedEffort}
                onChange={(e) => setForm({ ...form, estimatedEffort: e.target.value })}
              />
            </div>
          </div>

          {/* AI Estimate panel */}
          <div className="rounded-xl border border-brand-200 bg-brand-50 dark:border-brand-900/50 dark:bg-brand-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-700 dark:text-brand-300">AI Estimate</p>
                <p className="text-xs text-brand-600/70 dark:text-brand-400/70 mt-0.5">
                  Get smart effort &amp; due date suggestions
                </p>
              </div>
              <button
                type="button"
                id="ai-estimate-btn"
                onClick={handleAiEstimate}
                disabled={aiLoading}
                className="btn-primary text-xs px-3 py-1.5 shrink-0"
              >
                {aiLoading ? (
                  <span className="flex items-center gap-1.5">
                    <Spinner className="h-3 w-3" />
                    Thinking…
                  </span>
                ) : 'Suggest estimate'}
              </button>
            </div>

            {aiResult && (
              <div className="text-xs text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/30 rounded-lg px-3 py-2">
                {aiResult.fallback ? (
                  <p className="text-amber-600 dark:text-amber-400">AI unavailable — using default estimate</p>
                ) : (
                  <p>{aiResult.reasoning}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2">
            {isEdit ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Are you sure?</span>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="btn-danger text-xs px-3 py-1.5"
                  >
                    {deleteMutation.isPending ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="btn-ghost text-xs px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="btn-danger text-xs px-3 py-1.5"
                >
                  Delete task
                </button>
              )
            ) : <div />}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" id="task-save-btn" disabled={isSaving} className="btn-primary">
                {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
