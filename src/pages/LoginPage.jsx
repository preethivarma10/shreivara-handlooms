import { useEffect, useState } from 'react';
import { acceptInvite, getSettings, getUser, login, logout, MissingIdentityError, requestPasswordRecovery, signup, updateUser } from '@netlify/identity';
import { useSearchParams } from 'react-router-dom';

function AccountInput({ label, ...inputProps }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-gray-700">{label}<input {...inputProps} className="rounded-lg border border-gray-300 px-3 py-2.5 font-normal focus:border-maroon-800 focus:outline-none" /></label>;
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState(searchParams.has('recovery') ? 'recovery' : searchParams.has('invite_token') ? 'invite' : 'login');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setupNotice, setSetupNotice] = useState('');
  const [message, setMessage] = useState(searchParams.has('confirmed') ? 'Your email has been confirmed. You can now sign in.' : '');

  useEffect(() => {
    document.title = 'Customer Login | Shreivara';
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const [identitySettings, currentUser] = await Promise.all([getSettings(), getUser()]);
        if (!active) return;
        setSettings(identitySettings);
        setUser(currentUser);
        if (!identitySettings.providers?.email) setSetupNotice('Customer accounts are not active yet. The site owner must enable the email provider in Netlify Identity before signup and login can work.');
      } catch (authError) {
        if (!active) return;
        if (authError instanceof MissingIdentityError || authError?.status === 404 || authError?.cause?.status === 404) setSetupNotice('Customer accounts are not active yet. The site owner must enable Netlify Identity before signup and login can work.');
        else setError('Customer sign-in is temporarily unavailable. Please try again later.');
      } finally {
        if (active) setLoading(false);
      }
    }
    initialize();
    return () => { active = false; };
  }, []);

  function clearMessages() {
    setError('');
    setMessage('');
  }

  function identityIsReady() {
    if (settings?.providers?.email) return true;
    setError('Signup and login are not active yet. Please try again after email accounts have been enabled.');
    return false;
  }

  async function submitLogin(event) {
    event.preventDefault(); clearMessages();
    if (!identityIsReady()) return;
    const form = new FormData(event.currentTarget);
    try { const signedInUser = await login(form.get('email').toString().trim(), form.get('password').toString()); setUser(signedInUser); setMessage('You are signed in.'); }
    catch { setError('We could not sign you in. Check your email and password, then try again.'); }
  }

  async function submitSignup(event) {
    event.preventDefault(); clearMessages();
    if (!identityIsReady()) return;
    const form = new FormData(event.currentTarget);
    try {
      const createdUser = await signup(form.get('email').toString().trim(), form.get('password').toString(), { full_name: form.get('name').toString().trim() });
      const currentUser = createdUser.confirmedAt ? createdUser : await getUser();
      if (currentUser) { setUser(currentUser); setMessage('Your customer account is ready.'); }
      else setMessage('Account created. Check your email to confirm your address before signing in.');
    } catch { setError('We could not create your account. Check your details or try signing in.'); }
  }

  async function sendRecovery(event) {
    event.preventDefault(); clearMessages();
    if (!identityIsReady()) return;
    const email = new FormData(event.currentTarget).get('email').toString().trim();
    try { await requestPasswordRecovery(email); setMessage('If an account exists for this email, a password reset link is on its way.'); }
    catch { setError('We could not send a reset link. Please try again later.'); }
  }

  async function setNewPassword(event) {
    event.preventDefault(); clearMessages();
    if (!identityIsReady()) return;
    try { const updatedUser = await updateUser({ password: new FormData(event.currentTarget).get('password').toString() }); setUser(updatedUser); setMode('login'); setMessage('Your password has been updated.'); }
    catch { setError('We could not update your password. Please request a new reset link.'); }
  }

  async function acceptInvitation(event) {
    event.preventDefault(); clearMessages();
    if (!identityIsReady()) return;
    try { const invitedUser = await acceptInvite(searchParams.get('invite_token'), new FormData(event.currentTarget).get('password').toString()); setUser(invitedUser); setMessage('Your customer account is ready.'); }
    catch { setError('This invitation link may have expired. Ask Shreivara to send a new one.'); }
  }

  async function signOut() {
    try { await logout(); setUser(null); setMessage('You have been signed out.'); }
    catch { setError('We could not sign you out. Please try again.'); }
  }

  const signupAvailable = !settings || !settings.disableSignup;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6"><section className="w-full max-w-md">
      <div className="mb-7 text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Customer account</p><h1 className="mt-2 font-brand text-3xl font-bold text-maroon-900">Welcome to Shreivara</h1></div>
      {loading && <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600" role="status">Checking account access…</div>}
      {!loading && <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {setupNotice && <div className="mb-5 rounded-lg border border-gold-500/50 bg-amber-50 px-3 py-3 text-sm leading-5 text-gray-800" role="status">{setupNotice}</div>}
        {message && <div className="mb-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status" aria-live="polite">{message}</div>}
        {error && <div className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert" aria-live="assertive">{error}</div>}
        {user ? <div className="text-center"><p className="text-sm text-gray-600">Signed in as</p><p className="mt-1 break-all font-semibold text-maroon-900">{user.email || 'Customer account'}</p><button type="button" onClick={signOut} className="mt-6 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-maroon-900 hover:text-maroon-900">Log out</button></div>
          : mode === 'recovery' ? <form onSubmit={setNewPassword} className="grid gap-4"><h2 className="font-brand text-xl font-bold text-maroon-900">Set a new password</h2><AccountInput label="New password" name="password" type="password" autoComplete="new-password" minLength="8" required /><button type="submit" className="rounded-lg bg-maroon-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-maroon-800">Update password</button></form>
          : mode === 'invite' ? <form onSubmit={acceptInvitation} className="grid gap-4"><h2 className="font-brand text-xl font-bold text-maroon-900">Finish creating your account</h2><AccountInput label="Set a password" name="password" type="password" autoComplete="new-password" minLength="8" required /><button type="submit" className="rounded-lg bg-maroon-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-maroon-800">Accept invitation</button></form>
          : <>
            {mode !== 'forgot' && <div className="mb-6 grid grid-cols-2 border-b border-gray-200" role="tablist" aria-label="Account access"><button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => { setMode('login'); clearMessages(); }} className={`border-b-2 px-3 py-3 text-sm font-semibold ${mode === 'login' ? 'border-maroon-900 text-maroon-900' : 'border-transparent text-gray-500 hover:text-maroon-900'}`}>Existing customer</button>{signupAvailable && <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => { setMode('signup'); clearMessages(); }} className={`border-b-2 px-3 py-3 text-sm font-semibold ${mode === 'signup' ? 'border-maroon-900 text-maroon-900' : 'border-transparent text-gray-500 hover:text-maroon-900'}`}>New customer</button>}</div>}
            {mode === 'signup' && signupAvailable ? <form onSubmit={submitSignup} className="grid gap-4"><h2 className="font-brand text-xl font-bold text-maroon-900">Create your account</h2><AccountInput label="Name" name="name" type="text" autoComplete="name" required /><AccountInput label="Email address" name="email" type="email" autoComplete="email" required /><AccountInput label="Password" name="password" type="password" autoComplete="new-password" minLength="8" required /><button type="submit" className="mt-1 rounded-lg bg-maroon-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-maroon-800">Create account</button><p className="text-center text-sm text-gray-600">Already have an account? <button type="button" onClick={() => { setMode('login'); clearMessages(); }} className="font-semibold text-maroon-900 underline underline-offset-4">Log in</button></p></form>
              : mode === 'forgot' ? <form onSubmit={sendRecovery} className="grid gap-4"><h2 className="font-brand text-xl font-bold text-maroon-900">Reset your password</h2><AccountInput label="Email address" name="email" type="email" autoComplete="email" required /><button type="submit" className="rounded-lg bg-maroon-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-maroon-800">Send reset link</button><button type="button" onClick={() => { setMode('login'); clearMessages(); }} className="text-sm font-semibold text-maroon-900 underline underline-offset-4">Back to login</button></form>
              : <form onSubmit={submitLogin} className="grid gap-4"><h2 className="font-brand text-xl font-bold text-maroon-900">Welcome back</h2><AccountInput label="Email address" name="email" type="email" autoComplete="email" required /><AccountInput label="Password" name="password" type="password" autoComplete="current-password" required /><button type="submit" className="mt-1 rounded-lg bg-maroon-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-maroon-800">Log in</button><button type="button" onClick={() => { setMode('forgot'); clearMessages(); }} className="text-sm font-semibold text-maroon-900 underline underline-offset-4">Forgot password?</button><p className="text-center text-sm text-gray-600">New to Shreivara? <button type="button" onClick={() => { setMode('signup'); clearMessages(); }} className="font-semibold text-maroon-900 underline underline-offset-4">Create an account</button></p></form>}
          </>}
      </div>}
    </section></main>
  );
}