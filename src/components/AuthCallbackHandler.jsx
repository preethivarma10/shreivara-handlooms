import { useEffect } from 'react';
import { handleAuthCallback } from '@netlify/identity';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AuthCallbackHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    handleAuthCallback().then((result) => {
      if (!active || !result) return;
      if (result.type === 'recovery') navigate('/login?recovery=1', { replace: true });
      else if (result.type === 'invite' && result.token) navigate(`/login?invite_token=${encodeURIComponent(result.token)}`, { replace: true });
      else navigate('/login?confirmed=1', { replace: true });
    }).catch(() => {});
    return () => { active = false; };
  }, [location.pathname, location.search, navigate]);

  return null;
}