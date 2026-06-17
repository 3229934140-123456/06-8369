import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { useUserStore } from './store/useUserStore.js';
import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ProjectPage } from './pages/ProjectPage.jsx';
import { EditorPage } from './pages/EditorPage.jsx';
import { TemplatesPage } from './pages/TemplatesPage.jsx';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage.jsx';
import { EmbedPage } from './pages/EmbedPage.jsx';
import { SharePage } from './pages/SharePage.js';
import { Loader } from 'lucide-react';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useUserStore(s => s.user);
  const initialized = useUserStore(s => s.initialized);
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-graphite-50">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin text-electric-500" size={36} />
          <span className="text-sm text-graphite-500">正在加载...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const init = useUserStore(s => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/embed/:diagramId" element={<EmbedPage />} />
      <Route path="/share/:diagramId" element={<SharePage />} />
      <Route path="/" element={<RequireAuth><Navigate to="/dashboard" replace /></RequireAuth>} />
      <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/projects/:projectId" element={<RequireAuth><ProjectPage /></RequireAuth>} />
      <Route path="/projects/:projectId/settings" element={<RequireAuth><ProjectSettingsPage /></RequireAuth>} />
      <Route path="/editor/:diagramId" element={<RequireAuth><EditorPage /></RequireAuth>} />
      <Route path="/templates" element={<RequireAuth><TemplatesPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="h-full w-full">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
};

export default App;
