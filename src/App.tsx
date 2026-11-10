import { useEffect, useState } from 'react';
import SurveyPage from './pages/SurveyPage';
import DashboardPage from './pages/DashboardPage';

type PageMode = 'survey' | 'dashboard';

function getInitialPage(): PageMode {
  const params = new URLSearchParams(window.location.search);
  return params.get('page') === 'dashboard' ? 'dashboard' : 'survey';
}

export default function App() {
  const [page, setPage] = useState<PageMode>(getInitialPage);

  useEffect(() => {
    const onPopState = () => {
      setPage(getInitialPage());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const switchPage = (nextPage: PageMode) => {
    setPage(nextPage);
    const url = new URL(window.location.href);
    url.searchParams.set('page', nextPage);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            TrainingPulse
          </span>

          <nav className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => switchPage('survey')}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                page === 'survey'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              หน้าแบบสอบถาม
            </button>
            <button
              type="button"
              onClick={() => switchPage('dashboard')}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                page === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
          </nav>
        </div>
      </header>

      {page === 'survey' ? <SurveyPage /> : <DashboardPage />}
    </div>
  );
}
