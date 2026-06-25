import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
    <div className="text-center animate-fade-in">
      <div className="text-8xl font-black text-brand-100 dark:text-brand-950 select-none mb-4">404</div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary inline-flex">
        ← Back to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
