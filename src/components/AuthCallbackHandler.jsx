// Auth callback handler — no-op on Vercel (was previously used for Netlify Identity redirects)
export default function AuthCallbackHandler() {
  return null;
}