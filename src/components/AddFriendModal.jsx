import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { authedFetch } from '../lib/api';
import ErrorBanner from './ErrorBanner';

export default function AddFriendModal({ onClose, onAdded }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter a name.'); return; }
    setSaving(true);
    try {
      await authedFetch('/api/friends', { method: 'POST', body: JSON.stringify({ name, email }) });
      onAdded && onAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><UserPlus size={18} /></div>
            <h2 className="text-lg font-semibold text-slate-900">Add a friend</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Full name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Email (optional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@email.com"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500" />
          </div>
          <ErrorBanner message={error} />
          <button disabled={saving} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl py-2.5 text-sm transition">
            {saving ? 'Adding…' : 'Add friend'}
          </button>
        </form>
      </div>
    </div>
  );
}
