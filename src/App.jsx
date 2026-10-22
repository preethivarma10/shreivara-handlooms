import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthCallbackHandler from './components/AuthCallbackHandler.jsx';
import SiteLayout from './components/SiteLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';

const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));

export default function App() {
  // Check if current hostname contains 'admin' (e.g. shreivara-admin.vercel.app or admin.shreivara.com)
  const isAdminHost = typeof window !== 'undefined' && window.location.hostname.toLowerCase().includes('admin');

  // Dedicated Admin Host: render Admin Dashboard exclusively
  if (isAdminHost) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center font-brand text-maroon-900 text-lg">Loading Admin Console…</div>}>
        <Routes>
          <Route path="*" element={<AdminPage />} />
        </Routes>
      </Suspense>
    );
  }

  // Customer Storefront: ONLY customer pages, zero admin routes
  return (
    <>
      <AuthCallbackHandler />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<Navigate to="/#about-us" replace />} />
          <Route path="about.html" element={<Navigate to="/#about-us" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="login.html" element={<LoginPage />} />
          {/* Any attempt to access /admin or unknown routes on the customer site redirects directly to homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}