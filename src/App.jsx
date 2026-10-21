import { Navigate, Route, Routes } from 'react-router-dom';
import AuthCallbackHandler from './components/AuthCallbackHandler.jsx';
import SiteLayout from './components/SiteLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';

export default function App() {
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}