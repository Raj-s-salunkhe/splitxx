import { useEffect, useState } from 'react';
import { Receipt, HandCoins, Users, UserPlus } from 'lucide-react';
import { asArray, authedFetch } from '../lib/api';
import { useModal } from '../contexts/ModalContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const ICONS = { expense: Receipt, settlement: HandCoins, group_created: Users, friend_added: UserPlus };
const COLORS = { expense: 'bg-indigo-50 text-indigo-600', settlement: 'bg-emerald-50 text-emerald-600', group_created: 'bg-amber-50 text-amber-600', friend_added: 'bg-sky-50 text-sky-600' };

function groupByDay(items) {
  const groups = {};
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const d = new Date(item.created_at);
    const key = d.toDateString() === new Date().toDateString() ? 'Today' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

export default function Activity() {
  const { refreshKey } = useModal();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    authedFetch('/api/activity').then((data) => {
      if (!Array.isArray(data)) throw new Error('Activity returned an invalid response.');
      setItems(data.filter((item) => item && typeof item === 'object'));
    }).catch((e) => { setItems([]); setError(e.message || 'Could not load activity.'); }).finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <LoadingSpinner label="Loading activity…" />;
  if (error) return <p className="text-sm text-rose-600">{error}</p>;

  const safeItems = asArray(items);
  const grouped = groupByDay(safeItems);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Activity</h1>
        <p className="text-sm text-slate-500 mt-1">Every expense, settlement, and group change in one feed.</p>
      </div>

      {safeItems.length === 0 ? (
        <EmptyState icon="📜" title="No activity yet" subtitle="Start adding expenses and friends to build your history." />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([day, list]) => (
            <div key={day}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{day}</p>
              <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
                {list.map((a) => {
                  const Icon = ICONS[a.type] || Receipt;
                  return (
                    <div key={a.id} className="flex items-center gap-4 p-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${COLORS[a.type] || 'bg-slate-100 text-slate-500'}`}><Icon size={16} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-800">{a.description}</p>
                        <p className="text-xs text-slate-400">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {a.amount !== null && <p className="text-sm font-semibold text-slate-700">${Number(a.amount).toFixed(2)}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
