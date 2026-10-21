import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const USERS_KEY = 'shreivara-users';
const SESSION_KEY = 'shreivara-user';

function readUsers() {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function AccountInput({ label, ...inputProps }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-gray-700">
      {label}
      <input {...inputProps} className="rounded-lg border border-gray-300 px-3 py-2.5 font-normal focus:border-maroon-800 focus:outline-none" />
    </label>
  );
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(() => readSession());
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = 'Customer Login | Shreivara';
  }, []);

  function clearMessages() {
    setError('');
    setMessage('');
  }

  function submitLogin(event) {
    event.preventDefault();
    clearMessages();
    const form = new FormData(event.currentTarget);
    const email = form.get('email').toString().trim().toLowerCase();
    const password = form.get('password').toString();
    const users = readUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) { setError('We could not sign you in. Check your email and password, then try again.'); return; }
    const session = { email: found.email, name: found.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    setMessage('You are signed in.');
  }

  function submitSignup(event) {
    event.preventDefault();
    clearMessages();
    const form = new FormData(event.currentTarget);
    const email = form.get('email').toString().trim().toLowerCase();
    const password = form.get('password').toString();
    const name = form.get('name').toString().trim();
    const users = readUsers();
    if (users.some((u) => u.email === email)) { setError('An account with this email already exists. Try logging in instead.'); return; }
    const newUser = { email, password, name };
    saveUsers([...users, newUser]);
    const session = { email, name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    setMessage('Your customer account is ready.');
  }

  function sendRecovery(event) {
    event.preventDefault();
    clearMessages();
    setMessage('If an account exists for this email, please contact Shreivara on WhatsApp to reset your password.');
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setMessage('You have been signed out.');
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6"><section className="w-full max-w-md">
      <div className="mb-7 text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Customer account</p><h1 className="mt-2 font-brand text-3xl font-bold text-maroon-900">Welcome to Shreivara</h1></div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {message && <div className="mb-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status" aria-live="polite">{message}</div>}
        {error && <div className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert" aria-live="assertive">{error}</div>}
        {user
          ? <div className="text-center"><p className="text-sm text-gray-600">Signed in as</p><p className="mt-1 break-all font-semibold text-maroon-900">{user.name || user.email}</p><button type="button" onClick={signOut} className="mt-6 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-maroon-900 hover:text-maroon-900">Log out</button></div>
          : <>
              {mode !== 'forgot' && <div className="mb-6 grid grid-cols-2 border-b border-gray-200" role="tablist" aria-label="Account access"><button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => { setMode('login'); clearMessages(); }} className={`border-b-2 px-3 py-3 text-sm font-semibold ${mode === 'login' ? 'border-maroon-900 text-maroon-900' : 'border-transparent text-gray-500 hover:text-maroon-900'}`}>Existing customer</button><button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => { setMode('signup'); clearMessages(); }} className={`border-b-2 px-3 py-3 text-sm font-semibold ${mode === 'signup' ? 'border-maroon-900 text-maroon-900' : 'border-transparent text-gray-500 hover:text-maroon-900'}`}>New customer</button></div>}
              {mode === 'signup'
                ? <form onSubmit={submitSignup} className="grid gap-4"><h2 className="font-brand text-xl font-bold text-maroon-900">Create your account</h2><AccountInput label="Name" name="name" type="text" autoComplete="name" required /><AccountInput label="Email address" name="email" type="email" autoComplete="email" required /><AccountInput label="Password" name="password" type="password" autoComplete="new-password" minLength="8" required /><button type="submit" className="mt-1 rounded-lg bg-maroon-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-maroon-800">Create account</button><p className="text-center text-sm text-gray-600">Already have an account? <button type="button" onClick={() => { setMode('login'); clearMessages(); }} className="font-semibold text-maroon-900 underline underline-offset-4">Log in</button></p></form>
                : mode === 'forgot'
                  ? <form onSubmit={sendRecovery} className="grid gap-4"><h2 className="font-brand text-xl font-bold text-maroon-900">Reset your password</h2><AccountInput label="Email address" name="email" type="email" autoComplete="email" required /><button type="submit" className="rounded-lg bg-maroon-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-maroon-800">Send reset link</button><button type="button" onClick={() => { setMode('login'); clearMessages(); }} className="text-sm font-semibold text-maroon-900 underline underline-offset-4">Back to login</button></form>
                  : <form onSubmit={submitLogin} className="grid gap-4"><h2 className="font-brand text-xl font-bold text-maroon-900">Welcome back</h2><AccountInput label="Email address" name="email" type="email" autoComplete="email" required /><AccountInput label="Password" name="password" type="password" autoComplete="current-password" required /><button type="submit" className="mt-1 rounded-lg bg-maroon-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-maroon-800">Log in</button><button type="button" onClick={() => { setMode('forgot'); clearMessages(); }} className="text-sm font-semibold text-maroon-900 underline underline-offset-4">Forgot password?</button><p className="text-center text-sm text-gray-600">New to Shreivara? <button type="button" onClick={() => { setMode('signup'); clearMessages(); }} className="font-semibold text-maroon-900 underline underline-offset-4">Create an account</button></p></form>}
            </>}
      </div>
    </section></main>
  );
}