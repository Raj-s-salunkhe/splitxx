import { useEffect, useState } from 'react';
import { HandCoins } from 'lucide-react';
import { asArray, authedFetch, formatCurrency, normalizeBalances } from '../lib/api';
import { useModal } from '../contexts/ModalContext';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SettleUpModal from '../components/SettleUpModal';

export default function SettleUp() {
  const { refreshKey, bumpRefresh } = useModal();
  const [balances, setBalances] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [showBlank, setShowBlank] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([authedFetch('/api/balances'), authedFetch('/api/settlements')])
      .then(([b, s]) => {
        if (!Array.isArray(s)) throw new Error('Settlement history returned an invalid response.');
        setBalances(normalizeBalances(b).balances.filter((x) => Number(x?.balance) !== 0));
        setHistory(s);
      })
      .catch((e) => { setBalances([]); setHistory([]); setError(e.message || 'Could not load settlement data.'); })
      .finally(() => setLoading(false));
  };
  useEffect(load, [refreshKey]);

  if (loading) return <LoadingSpinner label="Loading…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Settle up</h1>
          <p className="text-sm text-slate-500 mt-1">Record a payment to clear balances with a friend.</p>
        </div>
        <button onClick={() => setShowBlank(true)} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition self-start">
          <HandCoins size={16} /> Record a payment
        </button>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Outstanding balances</h2>
        {balances.length === 0 ? (
          <EmptyState icon="🎉" title="You're all settled up!" subtitle="There's nothing to settle right now." />
        ) : (
          <ul className="space-y-2">
            {balances.map((b) => (
              <li key={b.friend_id} className="flex items-center gap-4 rounded-xl border border-slate-100 p-3">
                <Avatar name={b.name} url={b.avatar_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{b.name}</p>
                  <p className="text-xs text-slate-500">{b.balance > 0 ? 'owes you' : 'you owe'} {formatCurrency(Math.abs(b.balance))}</p>
                </div>
                <button onClick={() => setTarget(b)} className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-1.5">Settle up</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Payment history</h2>
        {asArray(history).length === 0 ? (
          <EmptyState icon="🤝" title="No payments recorded yet" subtitle="Once you settle up with someone, it'll show up here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((s) => (
              <li key={s.id} className="flex items-center gap-4 py-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><HandCoins size={15} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800"><span className="font-medium">{s.from_name}</span> paid <span className="font-medium">{s.to_name}</span></p>
                  <p className="text-xs text-slate-400">{new Date(s.date).toLocaleDateString()}{s.note ? ` · ${s.note}` : ''}</p>
                </div>
                <p className="text-sm font-semibold text-emerald-600">{formatCurrency(s.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {target && (
        <SettleUpModal friendId={target.friend_id} suggestedAmount={target.balance} direction={target.balance > 0 ? 'they_pay' : 'you_pay'}
          onClose={() => setTarget(null)} onSettled={() => { load(); bumpRefresh(); }} />
      )}
      {showBlank && <SettleUpModal onClose={() => setShowBlank(false)} onSettled={() => { load(); bumpRefresh(); }} />}
    </div>
  );
}
