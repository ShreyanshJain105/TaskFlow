import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';

const SettingsPage = () => {
  const { user } = useAuth();

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Settings</h1>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
              Account
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
                <div className="text-slate-900 dark:text-slate-100 font-medium">{user?.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email address</label>
                <div className="text-slate-900 dark:text-slate-100 font-medium">{user?.email}</div>
              </div>
              {memberSince && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Member since</label>
                  <div className="text-slate-900 dark:text-slate-100 font-medium">{memberSince}</div>
                </div>
              )}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
              Preferences
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-900 dark:text-slate-100 font-medium">Appearance</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Toggle between light and dark mode</div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                <ThemeToggle />
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SettingsPage;
