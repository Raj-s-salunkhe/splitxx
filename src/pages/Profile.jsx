import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, Globe, User as UserIcon } from 'lucide-react';
import { authedFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authedFetch('/api/profile').then((p) => {
      if (!p || typeof p !== 'object') throw new Error('Profile returned an invalid response.');
      setProfile(p);
      setName(p.full_name || '');
      setCurrency(p.currency || 'USD');
      setNotifications(p.notifications_enabled !== false);
    }).catch((e) => { setProfile(null); setError(e.message || 'Could not load profile.'); }).finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await authedFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ full_name: name, currency, notifications_enabled: notifications }) });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) return <LoadingSpinner label="Loading profile…" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile & settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account details and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={profile?.full_name || user?.email} url={profile?.avatar_url} size="xl" />
          <div>
            <p className="font-semibold text-slate-900">{profile?.full_name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={save} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><UserIcon size={13} /> Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Globe size={13} /> Preferred currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-800">Notifications</p>
                <p className="text-xs text-slate-400">Get notified about new expenses and settlements</p>
              </div>
            </div>
            <button type="button" onClick={() => setNotifications((n) => !n)} className={`w-11 h-6 rounded-full transition relative ${notifications ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${notifications ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <ErrorBanner message={error} />
          {saved && <p className="text-sm text-emerald-600">Saved!</p>}
          <button disabled={saving} type="submit" className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl px-5 py-2.5 text-sm transition">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-900 mb-1">Account</h2>
        <p className="text-sm text-slate-500 mb-4">Signed in as {user?.email}</p>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 border border-rose-100 hover:bg-rose-50 rounded-xl px-4 py-2.5">
          <LogOut size={15} /> Log out
        </button>
      </div>
    </div>
  );
}
