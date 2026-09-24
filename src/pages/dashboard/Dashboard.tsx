import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Users,
  UserPlus,
  Layers,
  Receipt,
  HandCoins,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, Avatar } from '../../components/ui';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import { AddExpenseModal } from '../../components/modals';
import { useAuth } from '../../context/AuthContext';
import { activityApi, balancesApi, groupsApi } from '../../services/api';
import { formatCurrency, timeAgo, getGroupTypeEmoji, cn } from '../../utils';
import type { BalancesResponse, Group, Activity, User } from '../../types';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const currency = (profile as User)?.currency || 'USD';
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [balancesData, groupsData, activityData] = await Promise.all([
        balancesApi.get().catch(() => null),
        groupsApi.get().catch(() => []),
        activityApi.get(5).catch(() => []),
      ]);
      setBalances(balancesData);
      setGroups(groupsData);
      setActivity(activityData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonDashboard />
      </div>
    );
  }

  const firstName = (profile?.full_name || profile?.email || 'there').split(' ')[0];
  const netBalance = balances?.netBalance || 0;
  const totalOwed = balances?.totalOwed || 0;
  const totalOwe = balances?.totalOwe || 0;
  const friendBalances = balances?.balances || [];
  const nonZeroBalances = friendBalances.filter(b => b.balance !== 0);
  const owesYouCount = nonZeroBalances.filter(b => b.balance > 0).length;
  const youOweCount = nonZeroBalances.filter(b => b.balance < 0).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const isAllSettled = netBalance === 0 && owesYouCount === 0 && youOweCount === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAllSettled
              ? "You're all settled up! 🎉"
              : netBalance > 0
              ? `You are owed ${formatCurrency(netBalance, currency)} in total`
              : netBalance < 0
              ? `You owe ${formatCurrency(Math.abs(netBalance), currency)} in total`
              : "Here's your financial overview"}
          </p>
        </div>
        <button
          onClick={() => setAddExpenseOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-all duration-150 shadow-sm shadow-indigo-200 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Expense</span>
        </button>
      </div>

      {/* Balance Summary Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Net Balance */}
        <Card
          className={cn(
            'overflow-hidden relative',
            netBalance >= 0
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
              : netBalance < 0
              ? 'bg-gradient-to-br from-rose-500 to-rose-600'
              : 'bg-gradient-to-br from-slate-700 to-slate-800'
          )}
        >
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              {netBalance > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-100" />
              ) : netBalance < 0 ? (
                <TrendingDown className="w-3.5 h-3.5 text-rose-100" />
              ) : (
                <HandCoins className="w-3.5 h-3.5 text-slate-300" />
              )}
              <p className="text-xs font-medium text-white/70">Net Balance</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-white">
              {netBalance >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(netBalance), currency)}
            </p>
            <p className="text-xs text-white/60 mt-1">
              {netBalance > 0 ? "You're owed more" : netBalance < 0 ? 'You owe more' : 'All settled'}
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        </Card>

        {/* You are owed */}
        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs font-medium text-emerald-700">You are owed</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-emerald-600">
              {formatCurrency(totalOwed, currency)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {owesYouCount > 0
                ? `${owesYouCount} friend${owesYouCount !== 1 ? 's' : ''} owe${owesYouCount === 1 ? 's' : ''} you`
                : 'No outstanding'}
            </p>
          </CardContent>
        </Card>

        {/* You owe */}
        <Card className="border-rose-100 bg-rose-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
              <p className="text-xs font-medium text-rose-700">You owe</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-rose-600">
              {formatCurrency(totalOwe, currency)}
            </p>
            <p className="text-xs text-rose-600 mt-1">
              {youOweCount > 0
                ? `Owed to ${youOweCount} friend${youOweCount !== 1 ? 's' : ''}`
                : 'No outstanding'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Row */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setAddExpenseOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-150 flex-shrink-0 font-medium text-sm shadow-sm"
        >
          <Receipt className="w-4 h-4" />
          Add Expense
        </button>
        <button
          onClick={() => navigate('/friends')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-150 flex-shrink-0 font-medium text-sm shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Friend
        </button>
        <button
          onClick={() => navigate('/groups')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-150 flex-shrink-0 font-medium text-sm shadow-sm"
        >
          <Layers className="w-4 h-4" />
          Create Group
        </button>
        {nonZeroBalances.length > 0 && (
          <button
            onClick={() => navigate('/balances')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-150 flex-shrink-0 font-medium text-sm shadow-sm"
          >
            <HandCoins className="w-4 h-4" />
            Settle Up
          </button>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Column - Groups + Activity */}
        <div className="lg:col-span-3 space-y-4">
          {/* Groups */}
          <Card>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Your Groups
              </h2>
              <Link
                to="/groups"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardContent className="p-0">
              {groups.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-3">
                    👥
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">No groups yet</p>
                  <p className="text-xs text-slate-500 mb-4">Create a group to track shared expenses</p>
                  <button
                    onClick={() => navigate('/groups')}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Create your first group →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {groups.slice(0, 3).map(group => {
                    const bal = group.yourBalance || 0;
                    return (
                      <Link
                        key={group.id}
                        to={`/groups/${group.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                          {getGroupTypeEmoji(group.type) || group.icon || '👥'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{group.name}</p>
                          <p className="text-xs text-slate-500">
                            {group.memberCount || group.members?.length || 0} member{(group.memberCount || group.members?.length || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className={cn(
                          'text-xs font-semibold flex-shrink-0 px-2 py-1 rounded-full',
                          bal > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : bal < 0
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-500'
                        )}>
                          {bal === 0 ? 'Settled' : formatCurrency(Math.abs(bal), currency)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-500" />
                Recent Activity
              </h2>
              <Link
                to="/activity"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardContent className="p-0">
              {activity.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-3">
                    📊
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">No activity yet</p>
                  <p className="text-xs text-slate-500 mb-4">Add your first expense to get started</p>
                  <button
                    onClick={() => setAddExpenseOpen(true)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Add your first expense →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activity.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        item.type === 'expense' ? 'bg-indigo-100 text-indigo-600' :
                        item.type === 'settlement' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-slate-100 text-slate-600'
                      )}>
                        {item.type === 'expense' ? <Receipt className="w-4 h-4" /> :
                         item.type === 'settlement' ? <HandCoins className="w-4 h-4" /> :
                         <Users className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.description}</p>
                        <p className="text-xs text-slate-500">{timeAgo(item.created_at)}</p>
                      </div>
                      {item.amount && (
                        <p className="text-xs font-semibold text-slate-700 flex-shrink-0">
                          {formatCurrency(item.amount, currency)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Friend Balances */}
        <div className="lg:col-span-2 space-y-4">
          {/* Friend Balances */}
          <Card>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Friend Balances
              </h2>
              <Link
                to="/balances"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
              >
                Details <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardContent className="p-0">
              {friendBalances.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-3">
                    👋
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">No friends yet</p>
                  <p className="text-xs text-slate-500 mb-4">Add friends to start tracking balances</p>
                  <button
                    onClick={() => navigate('/friends')}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Add your first friend →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {friendBalances.slice(0, 5).map(friend => (
                    <Link
                      key={friend.friend_id}
                      to="/balances"
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    >
                      <Avatar name={friend.name} url={friend.avatar_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{friend.name}</p>
                        <p className={cn(
                          'text-xs',
                          friend.balance > 0 ? 'text-emerald-600' :
                          friend.balance < 0 ? 'text-rose-600' : 'text-slate-400'
                        )}>
                          {friend.balance > 0 ? 'owes you' : friend.balance < 0 ? 'you owe' : 'settled up'}
                        </p>
                      </div>
                      <span className={cn(
                        'text-sm font-semibold flex-shrink-0',
                        friend.balance > 0 ? 'text-emerald-600' :
                        friend.balance < 0 ? 'text-rose-600' : 'text-slate-400'
                      )}>
                        {friend.balance === 0 ? '✓' : formatCurrency(Math.abs(friend.balance), currency)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mini All-Settled Card (when everything is settled) */}
          {isAllSettled && friendBalances.length > 0 && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-sm font-semibold text-emerald-800">All settled up!</p>
                <p className="text-xs text-emerald-600 mt-0.5">No outstanding balances</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onSuccess={() => {
          setAddExpenseOpen(false);
          loadDashboard();
        }}
      />
    </div>
  );
}
