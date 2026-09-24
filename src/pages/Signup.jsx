import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import ErrorBanner from '../components/ErrorBanner';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) throw error;
      if (data.session) navigate('/dashboard');
      else navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-sm">S</div>
          <span className="font-semibold text-lg text-slate-900">SplitMate</span>
        </Link>
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8">
          <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Start splitting expenses in seconds.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500" />
            </div>
            <ErrorBanner message={error} />
            <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl py-2.5 text-sm transition">
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-slate-100 flex-1" /><span className="text-xs text-slate-400">or</span><div className="h-px bg-slate-100 flex-1" />
          </div>
          <button onClick={() => signInWithGoogle('SplitMate')} className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 rounded-xl py-2.5 text-sm font-medium text-slate-700 transition">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p className="text-sm text-slate-500 text-center mt-6">
            Already have an account? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
