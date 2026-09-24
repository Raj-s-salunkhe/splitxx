import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, HandCoins, UserPlus, Receipt, Trash2 } from 'lucide-react';
import { asArray, authedFetch, formatCurrency } from '../lib/api';
import { useModal } from '../contexts/ModalContext';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import SettleUpModal from '../components/SettleUpModal';

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openAddExpense, refreshKey, bumpRefresh } = useModal();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settleTransfer, setSettleTransfer] = useState(null);
  const [addingMembers, setAddingMembers] = useState(false);
  const [allFriends, setAllFriends] = useState([]);
  const [pickedFriends, setPickedFriends] = useState([]);
  const [tab, setTab] = useState('expenses');

  const load = () => {
    setLoading(true);
    setError('');
    authedFetch(`/api/group-detail?id=${id}`).then((response) => {
      if (!response?.group || typeof response.group !== 'object') throw new Error('Group returned an invalid response.');
      setDetail({ ...response, members: asArray(response.members), expenses: asArray(response.expenses), settlements: asArray(response.settlements), simplified: asArray(response.simplified) });
    }).catch((e) => { setDetail(null); setError(e.message || 'Could not load group.'); }).finally(() => setLoading(false));
  };

  useEffect(load, [id, refreshKey]);

  const deleteExpense = async (expenseId) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await authedFetch('/api/expenses', { method: 'DELETE', body: JSON.stringify({ id: expenseId }) });
      load(); bumpRefresh();
    } catch (e) { setError(e.message); }
  };

  const deleteGroup = async () => {
    if (!confirm('Delete this group and all its expenses? This cannot be undone.')) return;
    try {
      await authedFetch('/api/groups', { method: 'DELETE', body: JSON.stringify({ id: Number(id) }) });
      navigate('/groups');
    } catch (e) { setError(e.message); }
  };

  const openAddMembers = async () => {
    setAddingMembers(true);
    try {
      const f = await authedFetch('/api/friends');
      if (!Array.isArray(f)) throw new Error('Friends returned an invalid response.');
      const existingIds = asArray(detail?.members).map((m) => m?.friend_id).filter((x) => x !== null);
      setAllFriends(f.filter((fr) => !existingIds.includes(fr.id)));
    } catch (e) { setError(e.message); }
  };

  const submitAddMembers = async () => {
    try {
      await authedFetch('/api/group-detail', { method: 'POST', body: JSON.stringify({ group_id: Number(id), friend_ids: pickedFriends }) });
      setAddingMembers(false); setPickedFriends([]);
      load();
    } catch (e) { setError(e.message); }
  };

  if (loading) return <LoadingSpinner label="Loading group…" />;
  if (error && !detail) return <ErrorBanner message={error} />;
  if (!detail) return null;

  const group = detail.group;
  const members = asArray(detail.members);
  const expenses = asArray(detail.expenses);
  const settlements = asArray(detail.settlements);
  const simplified = asArray(detail.simplified);

  return (
    <div className="space-y-6">
      <Link to="/groups" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Back to groups</Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">{group.icon}</div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{group.name}</h1>
            <p className="text-sm text-slate-500 capitalize">{group.type} · {members.length} members</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openAddMembers} className="inline-flex items-center gap-1.5 text-xs font-medium border border-slate-200 hover:bg-slate-50 rounded-xl px-3 py-2"><UserPlus size={14} /> Add member</button>
          <button onClick={() => openAddExpense(Number(id))} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl px-3 py-2"><Plus size={14} /> Add expense</button>
          <button onClick={deleteGroup} className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 rounded-xl px-3 py-2"><Trash2 size={14} /></button>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="flex items-center -space-x-2">
        {members.map((m) => (
          <div key={m.key} className="group relative">
            <Avatar name={m.name} url={m.avatar_url} />
          </div>
        ))}
      </div>

      {simplified.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Suggested settlements</h2>
          <ul className="space-y-2">
            {simplified.map((t, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm bg-slate-50 rounded-xl px-4 py-3">
                <span><span className="font-medium text-slate-800">{t.from_name}</span> <span className="text-slate-400">owes</span> <span className="font-medium text-slate-800">{t.to_name}</span></span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-indigo-600">{formatCurrency(t.amount)}</span>
                  <button onClick={() => setSettleTransfer(t)} className="text-xs font-medium text-emerald-600 border border-emerald-100 hover:bg-emerald-50 rounded-lg px-2.5 py-1 inline-flex items-center gap-1"><HandCoins size={12} /> Settle</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[{ id: 'expenses', label: 'Expenses' }, { id: 'balances', label: 'Balances' }, { id: 'settlements', label: 'Settlements' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t.id ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'expenses' && (
        expenses.length === 0 ? (
          <EmptyState icon="🧾" title="No expenses yet" subtitle="Add the first shared expense for this group."
            action={<button onClick={() => openAddExpense(Number(id))} className="text-sm font-medium text-indigo-600 hover:underline">Add an expense</button>} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Receipt size={16} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{e.description}</p>
                  <p className="text-xs text-slate-500">{e.paid_by_name} paid · {new Date(e.date).toLocaleDateString()} · split {e.split_type}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(e.amount)}</p>
                <button onClick={() => deleteExpense(e.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'balances' && (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.key} className="flex items-center gap-4 p-4">
              <Avatar name={m.name} url={m.avatar_url} size="sm" />
              <p className="text-sm font-medium text-slate-800 flex-1">{m.name}</p>
              <span className={`text-sm font-semibold ${m.net > 0.01 ? 'text-emerald-600' : m.net < -0.01 ? 'text-rose-600' : 'text-slate-400'}`}>
                {Math.abs(m.net) < 0.01 ? 'Settled up' : `${m.net > 0 ? 'gets back ' : 'owes '}${formatCurrency(Math.abs(m.net))}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'settlements' && (
        settlements.length === 0 ? (
          <EmptyState icon="🤝" title="No settlements yet" subtitle="Recorded payments for this group will show up here." />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {settlements.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><HandCoins size={16} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800"><span className="font-medium">{s.from_name}</span> paid <span className="font-medium">{s.to_name}</span></p>
                  <p className="text-xs text-slate-500">{new Date(s.date).toLocaleDateString()}{s.note ? ` · ${s.note}` : ''}</p>
                </div>
                <p className="text-sm font-semibold text-emerald-600">{formatCurrency(s.amount)}</p>
              </div>
            ))}
          </div>
        )
      )}

      {settleTransfer && (
        <SettleUpModal
          friendId={settleTransfer.from_key === 'you' ? settleTransfer.to_friend_id : settleTransfer.from_friend_id}
          suggestedAmount={settleTransfer.amount}
          direction={settleTransfer.from_key === 'you' ? 'you_pay' : 'they_pay'}
          onClose={() => setSettleTransfer(null)}
          onSettled={() => { load(); bumpRefresh(); }}
        />
      )}

      {addingMembers && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add members</h2>
            {allFriends.length === 0 ? (
              <p className="text-sm text-slate-400">All your friends are already in this group.</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {allFriends.map((f) => (
                  <label key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={pickedFriends.includes(f.id)} onChange={() => setPickedFriends((p) => p.includes(f.id) ? p.filter((x) => x !== f.id) : [...p, f.id])} className="accent-indigo-600" />
                    <Avatar name={f.name} url={f.avatar_url} size="sm" />
                    <span className="text-sm text-slate-700">{f.name}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setAddingMembers(false); setPickedFriends([]); }} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={submitAddMembers} disabled={pickedFriends.length === 0} className="flex-1 bg-indigo-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
