import { useEffect, useState } from 'react';
import { UserPlus, HandCoins, Search } from 'lucide-react';
import { authedFetch, formatCurrency } from '../lib/api';
import { useModal } from '../contexts/ModalContext';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AddFriendModal from '../components/AddFriendModal';
import SettleUpModal from '../components/SettleUpModal';

export default function Friends() {
  const { refreshKey, bumpRefresh, openAddExpense } = useModal();

  const [friends, setFriends] = useState([]);
  const [balances, setBalances] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [settleTarget, setSettleTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const results = await Promise.allSettled([
        authedFetch('/api/friends'),
        authedFetch('/api/balances'),
      ]);

      const [friendsResult, balancesResult] = results;

      // -------------------------
      // FRIENDS
      // -------------------------
      if (friendsResult.status === 'fulfilled') {
        const data = friendsResult.value;

        setFriends(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.friends)
            ? data.friends
            : []
        );
      } else {
        console.error(
          'Friends API error:',
          friendsResult.reason
        );

        setFriends([]);
        setError(
          friendsResult.reason?.message ||
            'Could not load your friends.'
        );
      }

      // -------------------------
      // BALANCES
      // -------------------------
      if (balancesResult.status === 'fulfilled') {
        const data = balancesResult.value;

        setBalances(
          Array.isArray(data?.balances)
            ? data.balances
            : []
        );
      } else {
        console.error(
          'Balances API error:',
          balancesResult.reason
        );

        setBalances([]);
      }
    } catch (err) {
      console.error('Friends loading error:', err);

      setError(
        err?.message ||
          'Something went wrong while loading friends.'
      );

      setFriends([]);
      setBalances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const balanceFor = (id) => {
    if (!Array.isArray(balances)) return 0;

    const balance = balances.find(
      (b) => b?.friend_id === id
    )?.balance;

    return Number(balance) || 0;
  };

  const safeFriends = Array.isArray(friends)
    ? friends.filter((friend) => friend && typeof friend === 'object')
    : [];

  const filtered = safeFriends.filter((f) =>
    String(f?.name || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner label="Loading friends…" />;
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Friends
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            People you split expenses with.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition self-start"
        >
          <UserPlus size={16} />
          Add friend
        </button>

      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* SEARCH */}
      {safeFriends.length > 0 && (
        <div className="relative max-w-sm">

          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends…"
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

        </div>
      )}

      {/* NO FRIENDS */}
      {safeFriends.length === 0 ? (

        <EmptyState
          icon="🤝"
          title="No friends yet"
          subtitle="Add friends to start splitting expenses with them."
          action={
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Add your first friend
            </button>
          }
        />

      ) : (

        /* FRIEND LIST */
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">

          {filtered.map((f, index) => {

            const bal = balanceFor(f.id);

            return (
              <div
                key={f.id ?? `friend-${index}`}
                className="flex items-center gap-4 p-4"
              >

                {/* AVATAR */}
                <Avatar
                  name={f.name || 'Friend'}
                  url={f.avatar_url}
                />

                {/* INFO */}
                <div className="min-w-0 flex-1">

                  <p className="text-sm font-medium text-slate-900">
                    {f.name || 'Friend'}
                  </p>

                  <p className="text-xs text-slate-500">
                    {f.email || 'No email on file'}
                  </p>

                </div>

                {/* BALANCE */}
                <div className="text-right">

                  <p
                    className={`text-sm font-semibold ${
                      bal > 0
                        ? 'text-emerald-600'
                        : bal < 0
                        ? 'text-rose-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {bal === 0
                      ? 'Settled up'
                      : formatCurrency(Math.abs(bal))}
                  </p>

                  <p className="text-xs text-slate-400">
                    {bal > 0
                      ? 'owes you'
                      : bal < 0
                      ? 'you owe'
                      : ''}
                  </p>

                </div>

                {/* ACTIONS */}
                <div className="hidden sm:flex items-center gap-2">

                  <button
                    onClick={() => openAddExpense()}
                    className="text-xs font-medium text-indigo-600 border border-indigo-100 hover:bg-indigo-50 rounded-lg px-3 py-1.5"
                  >
                    Add expense
                  </button>

                  {bal !== 0 && (
                    <button
                      onClick={() => setSettleTarget(f)}
                      className="text-xs font-medium text-emerald-600 border border-emerald-100 hover:bg-emerald-50 rounded-lg px-3 py-1.5 inline-flex items-center gap-1"
                    >
                      <HandCoins size={13} />
                      Settle
                    </button>
                  )}

                </div>

              </div>
            );
          })}

          {/* SEARCH EMPTY */}
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 p-4">
              No friends match "{search}".
            </p>
          )}

        </div>
      )}

      {/* ADD FRIEND MODAL */}
      {showAdd && (
        <AddFriendModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            load();
            bumpRefresh();
          }}
        />
      )}

      {/* SETTLE MODAL */}
      {settleTarget && (
        <SettleUpModal
          friendId={settleTarget.id}
          friendName={settleTarget.name}
          suggestedAmount={balanceFor(settleTarget.id)}
          direction={
            balanceFor(settleTarget.id) > 0
              ? 'they_pay'
              : 'you_pay'
          }
          onClose={() => setSettleTarget(null)}
          onSettled={() => {
            load();
            bumpRefresh();
          }}
        />
      )}

    </div>
  );
}
