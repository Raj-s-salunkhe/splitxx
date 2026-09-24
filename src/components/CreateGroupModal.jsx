import { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { asArray, authedFetch, GROUP_TYPES } from '../lib/api';
import ErrorBanner from './ErrorBanner';
import Avatar from './Avatar';

export default function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('trip');
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    authedFetch('/api/friends').then((data) => {
      if (!Array.isArray(data)) throw new Error('Friends returned an invalid response.');
      setFriends(data);
    }).catch((err) => { setFriends([]); setError(err.message || 'Could not load friends.'); }).finally(() => setLoadingFriends(false));
  }, []);

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please give your group a name.'); return; }
    setSaving(true);
    try {
      const icon = GROUP_TYPES.find((g) => g.id === type)?.emoji || '👥';
      await authedFetch('/api/groups', { method: 'POST', body: JSON.stringify({ name, type, icon, member_friend_ids: selected }) });
      onCreated && onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center"><Users size={18} /></div>
            <h2 className="text-lg font-semibold text-slate-900">Create a group</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-slate-500">Group name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goa Trip 2024"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Group type</label>
            <div className="grid grid-cols-3 gap-2">
              {GROUP_TYPES.map((g) => (
                <button type="button" key={g.id} onClick={() => setType(g.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition ${type === g.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  <span className="text-lg">{g.emoji}</span>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Add friends to this group</label>
            {loadingFriends ? (
              <p className="text-xs text-slate-400">Loading friends…</p>
            ) : asArray(friends).length === 0 ? (
              <p className="text-xs text-slate-400">You have no friends yet — add some first from the Friends page.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {asArray(friends).map((f) => (
                  <label key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={selected.includes(f.id)} onChange={() => toggle(f.id)} className="accent-indigo-600" />
                    <Avatar name={f.name} url={f.avatar_url} size="sm" />
                    <span className="text-sm text-slate-700">{f.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <ErrorBanner message={error} />
          <button disabled={saving} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl py-2.5 text-sm transition">
            {saving ? 'Creating…' : 'Create group'}
          </button>
        </form>
      </div>
    </div>
  );
}
