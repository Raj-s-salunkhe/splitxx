import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, X, Mail, TrendingUp, TrendingDown, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, Avatar, ConfirmDialog, Button } from '../../components/ui';
import { SkeletonFriends } from '../../components/ui/Skeleton';
import { AddFriendModal } from '../../components/modals';
import { friendsApi, balancesApi } from '../../services/api';
import { formatCurrency, cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Friend, Balance, User } from '../../types';

type FilterMode = 'all' | 'owe-you' | 'you-owe' | 'settled';

export default function Friends() {
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = (profile as User)?.currency || 'USD';
  const [friends, setFriends] = useState<Friend[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Friend | null>(null);
  const [removing, setRemoving] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');

  const loadFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [friendsData, balancesData] = await Promise.all([
        friendsApi.get().catch(() => []),
        balancesApi.get().catch(() => null),
      ]);
      setFriends(friendsData || []);
      if (balancesData?.balances) {
        const balanceMap: Record<string, number> = {};
        balancesData.balances.forEach((b: Balance) => {
          balanceMap[b.friend_id] = b.balance;
        });
        setBalances(balanceMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  async function handleDeleteFriend() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await friendsApi.delete(removeTarget.id);
      setFriends(prev => prev.filter(f => f.id !== removeTarget.id));
      showSuccess(`${removeTarget.name} removed`);
      setRemoveTarget(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove friend');
    } finally {
      setRemoving(false);
    }
  }

  function handleFriendCreated(friend: Friend) {
    setFriends(prev => [friend, ...prev]);
    setAddModalOpen(false);
    showSuccess(`${friend.name} added`);
  }

  const totalOwedToMe = Object.values(balances).filter(b => b > 0).reduce((a, b) => a + b, 0);
  const totalIOwe = Object.values(balances).filter(b => b < 0).reduce((a, b) => a + Math.abs(b), 0);
  const oweMeCount = Object.values(balances).filter(b => b > 0).length;
  const iOweCount = Object.values(balances).filter(b => b < 0).length;
  const settledCount = friends.length - oweMeCount - iOweCount;

  const filteredFriends = friends
    .filter(f => {
      const bal = balances[f.id] || 0;
      if (filter === 'owe-you' && bal <= 0) return false;
      if (filter === 'you-owe' && bal >= 0) return false;
      if (filter === 'settled' && bal !== 0) return false;
      return true;
    })
    .filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const ba = balances[a.id] || 0;
      const bb = balances[b.id] || 0;
      // Active balances first (largest absolute value first), then settled
      const aActive = ba !== 0 ? 1 : 0;
      const bActive = bb !== 0 ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return Math.abs(bb) - Math.abs(ba);
    });

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonFriends />
      </div>
    );
  }

  // Error state
  if (error && friends.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Friends</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your friends and balances</p>
          </div>
          <Button onClick={() => setAddModalOpen(true)} icon={UserPlus}>
            Add Friend
          </Button>
        </div>
        <Card>
          <div className="py-14 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Couldn't load friends</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">{error}</p>
            <Button onClick={loadFriends} icon={RefreshCw} variant="secondary">
              Try again
            </Button>
          </div>
        </Card>
        <AddFriendModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleFriendCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Friends</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {friends.length === 0
              ? 'Add a friend to start splitting expenses'
              : `${friends.length} friend${friends.length !== 1 ? 's' : ''} · ${settledCount} settled`}
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} icon={Plus}>
          Add Friend
        </Button>
      </div>

      {/* Summary row (only when friends exist) */}
      {friends.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white">
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Owed to you</p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-emerald-600 leading-tight">
                {formatCurrency(totalOwedToMe, currency)}
              </p>
              <p className="text-xs text-emerald-600/80 mt-1 font-medium">
                {oweMeCount > 0 ? `from ${oweMeCount} friend${oweMeCount !== 1 ? 's' : ''}` : 'no outstanding'}
              </p>
            </div>
          </Card>
          <Card className="border-rose-100 bg-gradient-to-br from-rose-50/70 to-white">
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 rounded-md bg-rose-100 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">You owe</p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-rose-600 leading-tight">
                {formatCurrency(totalIOwe, currency)}
              </p>
              <p className="text-xs text-rose-600/80 mt-1 font-medium">
                {iOweCount > 0 ? `to ${iOweCount} friend${iOweCount !== 1 ? 's' : ''}` : 'no outstanding'}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Search + filter */}
      {friends.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search friends by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5 scrollbar-hide">
            {([
              { id: 'all', label: 'All', count: friends.length },
              { id: 'owe-you', label: 'Owes you', count: oweMeCount },
              { id: 'you-owe', label: 'You owe', count: iOweCount },
              { id: 'settled', label: 'Settled', count: settledCount },
            ] as const).map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0',
                  filter === f.id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {f.label}
                <span className={cn(
                  'px-1.5 rounded text-[10px] font-semibold min-w-[18px] text-center',
                  filter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                )}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      {friends.length === 0 ? (
        <Card>
          <div className="py-14 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl mx-auto mb-4">
              👋
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No friends yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
              Add your first friend to start tracking shared expenses
            </p>
            <Button onClick={() => setAddModalOpen(true)} icon={UserPlus}>
              Add your first friend
            </Button>
          </div>
        </Card>
      ) : filteredFriends.length === 0 ? (
        <Card>
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-3">
              🔍
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No results found</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {searchQuery
                ? `No friends matching "${searchQuery}"`
                : `No friends in the "${filter === 'owe-you' ? 'Owes you' : filter === 'you-owe' ? 'You owe' : 'Settled'}" filter`}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setFilter('all'); }}
              className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredFriends.map(friend => {
              const balance = balances[friend.id] || 0;
              const isSettled = balance === 0;
              return (
                <div
                  key={friend.id}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <Avatar name={friend.name} url={friend.avatar_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{friend.name}</p>
                    {friend.email ? (
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{friend.email}</span>
                      </p>
                    ) : (
                      <p className={cn(
                        'text-xs font-medium mt-0.5',
                        balance > 0 ? 'text-emerald-600' :
                        balance < 0 ? 'text-rose-600' : 'text-slate-400'
                      )}>
                        {balance > 0 ? 'Owes you' : balance < 0 ? 'You owe' : 'Settled up'}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'text-sm font-bold tabular-nums',
                      balance > 0 ? 'text-emerald-600' :
                      balance < 0 ? 'text-rose-600' : 'text-slate-400'
                    )}>
                      {isSettled ? '—' : formatCurrency(Math.abs(balance), currency)}
                    </p>
                    {!friend.email && (
                      <p className={cn(
                        'text-[11px] font-medium mt-0.5',
                        balance > 0 ? 'text-emerald-600/80' :
                        balance < 0 ? 'text-rose-600/80' : 'text-slate-400'
                      )}>
                        {balance > 0 ? 'owes you' : balance < 0 ? 'you owe' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setRemoveTarget(friend)}
                    className="p-2 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove ${friend.name}`}
                    title="Remove friend"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Modals */}
      <AddFriendModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleFriendCreated}
      />
      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleDeleteFriend}
        title={`Remove ${removeTarget?.name}?`}
        description="You can still see past expenses, but you won't be able to add new shared expenses with them."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
