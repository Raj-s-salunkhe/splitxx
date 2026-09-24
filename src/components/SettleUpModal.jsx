import { useState, useEffect } from 'react';
import { X, HandCoins } from 'lucide-react';
import { asArray, authedFetch } from '../lib/api';
import ErrorBanner from './ErrorBanner';
import Avatar from './Avatar';

export default function SettleUpModal({ friendId = null, friendName = null, suggestedAmount = null, direction = null, onClose, onSettled }) {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(friendId);
  // direction: 'you_pay' means You -> friend, 'they_pay' means friend -> You
  const [dir, setDir] = useState(direction || 'you_pay');
  const [amount, setAmount] = useState(suggestedAmount ? String(Math.abs(suggestedAmount)) : '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    authedFetch('/api/friends').then((data) => {
      if (!Array.isArray(data)) throw new Error('Friends returned an invalid response.');
      setFriends(data);
    }).catch((err) => { setFriends([]); setError(err.message || 'Could not load friends.'); }).finally(() => setLoadingFriends(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedFriend) return setError('Choose a friend.');
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount.');
    setSaving(true);
    try {
      const from_friend_id = dir === 'you_pay' ? null : Number(selectedFriend);
      const to_friend_id = dir === 'you_pay' ? Number(selectedFriend) : null;
      await authedFetch('/api/settlements', {
        method: 'POST',
        body: JSON.stringify({ from_friend_id, to_friend_id, amount: Number(amount), note }),
      });
      onSettled && onSettled();
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><HandCoins size={18} /></div>
            <h2 className="text-lg font-semibold text-slate-900">Settle up</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Friend</label>
            <select value={selectedFriend || ''} onChange={(e) => setSelectedFriend(e.target.value)} disabled={!!friendId}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
              <option value="">Select a friend…</option>
              {asArray(friends).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            {loadingFriends && <p className="mt-1 text-xs text-slate-400">Loading friends…</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setDir('you_pay')} className={`rounded-xl border py-2.5 text-xs font-medium transition ${dir === 'you_pay' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
              You paid them
            </button>
            <button type="button" onClick={() => setDir('they_pay')} className={`rounded-xl border py-2.5 text-xs font-medium transition ${dir === 'they_pay' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
              They paid you
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Amount</label>
            <div className="mt-1 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Cash back for dinner"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
          </div>
          <ErrorBanner message={error} />
          <button disabled={saving} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium rounded-xl py-2.5 text-sm transition">
            {saving ? 'Recording…' : 'Record payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
