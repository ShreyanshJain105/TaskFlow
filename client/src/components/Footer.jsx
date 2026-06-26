const Footer = () => {
  return (
    <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="font-semibold text-slate-800 dark:text-slate-200 tracking-tight">TaskFlow</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Created by <span className="font-medium text-brand-600 dark:text-brand-400">Shreyansh Jain</span>
          </p>
          <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
            <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
