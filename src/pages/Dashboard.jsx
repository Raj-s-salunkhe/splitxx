import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Users,
  Layers,
  Receipt,
  HandCoins,
} from 'lucide-react';

import { authedFetch, formatCurrency } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';

import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

function timeAgo(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const diff = (Date.now() - date.getTime()) / 1000;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  return `${Math.floor(diff / 86400)}d ago`;
}

const EMPTY_BALANCES = {
  netBalance: 0,
  totalOwed: 0,
  totalOwe: 0,
  balances: [],
  simplified: [],
};

export default function Dashboard() {
  const { user } = useAuth();
  const { openAddExpense, refreshKey } = useModal();

  const [profile, setProfile] = useState(null);
  const [balances, setBalances] = useState(EMPTY_BALANCES);
  const [groups, setGroups] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const results = await Promise.allSettled([
          authedFetch('/api/profile'),
          authedFetch('/api/balances'),
          authedFetch('/api/groups'),
          authedFetch('/api/activity?limit=6'),
        ]);

        if (cancelled) return;

        const [profileResult, balancesResult, groupsResult, activityResult] =
          results;

        // PROFILE
        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value && typeof profileResult.value === 'object' ? profileResult.value : null);
        } else {
          console.error('Profile API error:', profileResult.reason);
          setError('Some dashboard information could not be loaded. Please try again.');
        }

        // BALANCES
        if (balancesResult.status === 'fulfilled') {
          const data = balancesResult.value;

          setBalances({
            netBalance: Number(data?.netBalance) || 0,
            totalOwed: Number(data?.totalOwed) || 0,
            totalOwe: Number(data?.totalOwe) || 0,
            balances: Array.isArray(data?.balances)
              ? data.balances
              : [],
            simplified: Array.isArray(data?.simplified)
              ? data.simplified
              : [],
          });
        } else {
          console.error(
            'Balances API error:',
            balancesResult.reason
          );

          setBalances(EMPTY_BALANCES);

          setError(
            'Could not load your balances. Your dashboard is still available.'
          );
        }

        // GROUPS
        if (groupsResult.status === 'fulfilled') {
          setGroups(Array.isArray(groupsResult.value) ? groupsResult.value.filter((group) => group && typeof group === 'object') : []);
        } else {
          console.error('Groups API error:', groupsResult.reason);
          setGroups([]);
          setError((current) => current || 'Some dashboard information could not be loaded. Please try again.');
        }

        // ACTIVITY
        if (activityResult.status === 'fulfilled') {
          setActivity(Array.isArray(activityResult.value) ? activityResult.value.filter((item) => item && typeof item === 'object') : []);
        } else {
          console.error(
            'Activity API error:',
            activityResult.reason
          );
          setActivity([]);
          setError((current) => current || 'Some dashboard information could not be loaded. Please try again.');
        }
      } catch (err) {
        console.error('Dashboard loading error:', err);

        if (!cancelled) {
          setError(
            err?.message ||
              'Something went wrong while loading the dashboard.'
          );

          setBalances(EMPTY_BALANCES);
          setGroups([]);
          setActivity([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return <LoadingSpinner label="Loading your dashboard…" />;
  }

  const firstName = (
    profile?.full_name ||
    user?.email ||
    'there'
  ).split(' ')[0];

  const netBalance = Number(balances?.netBalance) || 0;
  const totalOwed = Number(balances?.totalOwed) || 0;
  const totalOwe = Number(balances?.totalOwe) || 0;

  const friendBalances = Array.isArray(balances?.balances)
    ? balances.balances
    : [];

  const owedFriends = friendBalances.filter(
    (b) => Number(b?.balance) > 0
  );

  const oweFriends = friendBalances.filter(
    (b) => Number(b?.balance) < 0
  );

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Hey {firstName} 👋
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Here's where things stand across all your friends and groups.
          </p>
        </div>

        <button
          onClick={() => openAddExpense()}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition self-start"
        >
          <Plus size={16} />
          Add expense
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* BALANCE CARDS */}
      <div className="grid sm:grid-cols-3 gap-4">

        {/* OVERALL BALANCE */}
        <div className="rounded-2xl bg-slate-900 text-white p-5">
          <p className="text-xs text-slate-400">
            Your overall balance
          </p>

          <p
            className={`mt-2 text-3xl font-semibold ${
              netBalance >= 0
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {netBalance >= 0 ? '+' : '-'}
            {formatCurrency(Math.abs(netBalance))}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            {netBalance >= 0
              ? "You're owed more than you owe"
              : 'You owe more than you are owed'}
          </p>
        </div>

        {/* OWED */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-center gap-2 text-emerald-600">
            <ArrowDownRight size={16} />

            <p className="text-xs font-medium text-slate-500">
              You are owed
            </p>
          </div>

          <p className="mt-2 text-3xl font-semibold text-emerald-600">
            {formatCurrency(totalOwed)}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            across {owedFriends.length} friends
          </p>
        </div>

        {/* OWE */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-center gap-2 text-rose-600">
            <ArrowUpRight size={16} />

            <p className="text-xs font-medium text-slate-500">
              You owe
            </p>
          </div>

          <p className="mt-2 text-3xl font-semibold text-rose-600">
            {formatCurrency(totalOwe)}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            across {oweFriends.length} friends
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* GROUPS */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">
                Your groups
              </h2>

              <Link
                to="/groups"
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                View all
              </Link>
            </div>

            {groups.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No groups yet"
                subtitle="Create a group for your next trip, apartment, or family fund."
                action={
                  <Link
                    to="/groups"
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    Create a group
                  </Link>
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">

                {groups.slice(0, 4).map((g) => (
                  <Link
                    key={g.id}
                    to={`/groups/${g.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 p-3 transition"
                  >

                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
                      {g.icon || '👥'}
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="text-sm font-medium text-slate-900 truncate">
                        {g.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {g.memberCount || 0} members
                      </p>

                    </div>

                    <span
                      className={`text-xs font-semibold ${
                        Number(g.yourBalance) > 0
                          ? 'text-emerald-600'
                          : Number(g.yourBalance) < 0
                          ? 'text-rose-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {Number(g.yourBalance) === 0
                        ? 'settled'
                        : formatCurrency(
                            Math.abs(Number(g.yourBalance) || 0)
                          )}
                    </span>

                  </Link>
                ))}

              </div>
            )}
          </div>

          {/* ACTIVITY */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">
                Recent activity
              </h2>

              <Link
                to="/activity"
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                View all
              </Link>
            </div>

            {activity.length === 0 ? (
              <EmptyState
                icon="🧾"
                title="No activity yet"
                subtitle="Add your first expense to see it appear here."
              />
            ) : (
              <ul className="divide-y divide-slate-100">

                {activity.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 py-3"
                  >

                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">

                      {a.type === 'expense' ? (
                        <Receipt size={15} />
                      ) : a.type === 'settlement' ? (
                        <HandCoins size={15} />
                      ) : (
                        <Users size={15} />
                      )}

                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="text-sm text-slate-800 truncate">
                        {a.description || 'Activity'}
                      </p>

                      <p className="text-xs text-slate-400">
                        {timeAgo(a.created_at)}
                      </p>

                    </div>

                  </li>
                ))}

              </ul>
            )}

          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          {/* WHO OWES WHAT */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <h2 className="font-semibold text-slate-900 mb-4">
              Who owes what
            </h2>

            {friendBalances.length === 0 ? (
              <EmptyState
                icon="👋"
                title="Add friends to get started"
                subtitle="Track balances with people once you add them."
                action={
                  <Link
                    to="/friends"
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    Go to friends
                  </Link>
                }
              />
            ) : (
              <>
                <ul className="space-y-3">

                  {friendBalances
                    .filter(
                      (b) => Number(b?.balance) !== 0
                    )
                    .slice(0, 6)
                    .map((b) => (
                      <li
                        key={b.friend_id}
                        className="flex items-center gap-3"
                      >

                        <Avatar
                          name={b.name || 'Friend'}
                          url={b.avatar_url}
                          size="sm"
                        />

                        <div className="min-w-0 flex-1">

                          <p className="text-sm font-medium text-slate-800 truncate">
                            {b.name || 'Friend'}
                          </p>

                          <p className="text-xs text-slate-400">
                            {Number(b.balance) > 0
                              ? 'owes you'
                              : 'you owe'}
                          </p>

                        </div>

                        <span
                          className={`text-sm font-semibold ${
                            Number(b.balance) > 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(
                            Math.abs(
                              Number(b.balance) || 0
                            )
                          )}
                        </span>

                      </li>
                    ))}

                  {friendBalances.every(
                    (b) => Number(b?.balance) === 0
                  ) && (
                    <p className="text-sm text-slate-400">
                      Everyone is settled up 🎉
                    </p>
                  )}

                </ul>

                <Link
                  to="/balances"
                  className="mt-4 block text-center text-sm font-medium text-indigo-600 hover:underline"
                >
                  See full balances
                </Link>
              </>
            )}

          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <h2 className="font-semibold text-slate-900 mb-3">
              Quick actions
            </h2>

            <div className="space-y-2">

              <Link
                to="/friends"
                className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-indigo-600 rounded-lg px-2 py-2 hover:bg-slate-50"
              >
                <Users size={16} />
                Add a friend
              </Link>

              <Link
                to="/groups"
                className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-indigo-600 rounded-lg px-2 py-2 hover:bg-slate-50"
              >
                <Layers size={16} />
                Create a group
              </Link>

              <Link
                to="/settle"
                className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-indigo-600 rounded-lg px-2 py-2 hover:bg-slate-50"
              >
                <HandCoins size={16} />
                Settle up
              </Link>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
