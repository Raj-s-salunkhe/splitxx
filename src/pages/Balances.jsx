import { useEffect, useState } from 'react';
import { HandCoins, Sparkles } from 'lucide-react';
import { authedFetch, formatCurrency, normalizeBalances } from '../lib/api';
import { useModal } from '../contexts/ModalContext';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SettleUpModal from '../components/SettleUpModal';

export default function Balances() {
  const { refreshKey, bumpRefresh } = useModal();
  const [data, setData] = useState(normalizeBalances(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [settleTarget, setSettleTarget] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    authedFetch('/api/balances').then((response) => {
      if (!response || typeof response !== 'object') throw new Error('Balances returned an invalid response.');
      setData(normalizeBalances(response));
    }).catch((e) => {
      setData(normalizeBalances(null));
      setError(e.message || 'Could not load balances.');
    }).finally(() => setLoading(false));
  };
  useEffect(load, [refreshKey]);

  if (loading) return <LoadingSpinner label="Crunching the numbers…" />;
  if (error) return <p className="text-sm text-rose-600">{error}</p>;

  const filtered = data.balances.filter((b) => {
    if (filter === 'owed') return b.balance > 0;
    if (filter === 'owe') return b.balance < 0;
    if (filter === 'settled') return b.balance === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Balances</h1>
        <p className="text-sm text-slate-500 mt-1">A full picture of who owes whom right now.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900 text-white p-5">
          <p className="text-xs text-slate-400">Net balance</p>
          <p className={`mt-2 text-2xl font-semibold ${data.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{data.netBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(data.netBalance))}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-xs text-slate-500">You are owed</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatCurrency(data.totalOwed)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-xs text-slate-500">You owe</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">{formatCurrency(data.totalOwe)}</p>
        </div>
      </div>

      {data.simplified.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-indigo-500" /><h2 className="font-semibold text-slate-900">Simplified — fewest payments to settle everything</h2></div>
          <ul className="space-y-2">
            {data.simplified.map((t, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm bg-slate-50 rounded-xl px-4 py-3">
                <span><span className="font-medium text-slate-800">{t.from_name}</span> <span className="text-slate-400">pays</span> <span className="font-medium text-slate-800">{t.to_name}</span></span>
                <span className="font-semibold text-indigo-600">{formatCurrency(t.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[{ id: 'all', label: 'All' }, { id: 'owed', label: 'Owes you' }, { id: 'owe', label: 'You owe' }, { id: 'settled', label: 'Settled' }].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${filter === f.id ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>{f.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="⚖️" title="Nothing here" subtitle="No friends match this filter yet." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {filtered.map((b) => (
            <div key={b.friend_id} className="flex items-center gap-4 p-4">
              <Avatar name={b.name} url={b.avatar_url} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{b.name}</p>
                <p className="text-xs text-slate-500">{b.balance > 0 ? 'owes you' : b.balance < 0 ? 'you owe' : 'all settled up'}</p>
              </div>
              <p className={`text-sm font-semibold ${b.balance > 0 ? 'text-emerald-600' : b.balance < 0 ? 'text-rose-600' : 'text-slate-400'}`}>{b.balance === 0 ? '—' : formatCurrency(Math.abs(b.balance))}</p>
              {b.balance !== 0 && (
                <button onClick={() => setSettleTarget(b)} className="text-xs font-medium text-emerald-600 border border-emerald-100 hover:bg-emerald-50 rounded-lg px-3 py-1.5 inline-flex items-center gap-1"><HandCoins size={13} /> Settle</button>
              )}
            </div>
          ))}
        </div>
      )}

      {settleTarget && (
        <SettleUpModal friendId={settleTarget.friend_id} suggestedAmount={settleTarget.balance}
          direction={settleTarget.balance > 0 ? 'they_pay' : 'you_pay'}
          onClose={() => setSettleTarget(null)} onSettled={() => { load(); bumpRefresh(); }} />
      )}
    </div>
  );
}
