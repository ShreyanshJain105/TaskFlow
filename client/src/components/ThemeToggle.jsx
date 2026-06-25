import useThemeStore from '../store/themeStore';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zm9-9h2a1 1 0 1 1 0 2h-2a1 1 0 1 1 0-2zM1 12H3a1 1 0 1 1 0 2H1a1 1 0 1 1 0-2zm15.95-7.07 1.41-1.42a1 1 0 0 1 1.42 1.42l-1.42 1.41a1 1 0 1 1-1.41-1.41zM4.22 18.36 5.64 16.94a1 1 0 1 1 1.41 1.42L5.64 19.78a1 1 0 0 1-1.42-1.42zM19.78 18.36a1 1 0 0 1-1.42 1.42l-1.42-1.42a1 1 0 1 1 1.41-1.41l1.42 1.41zM5.64 5.64 4.22 4.22a1 1 0 0 1 1.42-1.42L7.05 4.22A1 1 0 1 1 5.64 5.64z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
