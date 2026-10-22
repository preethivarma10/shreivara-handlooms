import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AdminPage from './pages/AdminPage.jsx';
import './styles.css';

const container = document.getElementById('admin-root');
if (container) {
  createRoot(container).render(
    <BrowserRouter>
      <AdminPage />
    </BrowserRouter>
  );
}
