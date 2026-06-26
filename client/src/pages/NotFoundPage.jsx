import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
    <div className="text-center animate-fade-in">
      <div className="text-8xl font-black text-brand-100 dark:text-brand-950 select-none mb-4">404</div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
