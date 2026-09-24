import { useEffect, useState, useCallback } from 'react';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, HandCoins, RefreshCw, AlertCircle, Wallet } from 'lucide-react';
import { Card, Avatar, Button, Skeleton } from '../../components/ui';
import { SettleUpModal } from '../../components/modals';
import { balancesApi } from '../../services/api';
import { formatCurrency, cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import type { BalancesResponse, User } from '../../types';

export default function Balances() {
  const { profile } = useAuth();
  const currency = (profile as User)?.currency || 'USD';
  const [data, setData] = useState<BalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settleUpOpen, setSettleUpOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | undefined>();

  const loadBalances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const balancesData = await balancesApi.get();
      setData(balancesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  function handleSettleUp(friendId: string) {
    setSelectedFriend(friendId);
    setSettleUpOpen(true);
  }

  function handleSettled() {
    loadBalances();
    setSettleUpOpen(false);
    setSelectedFriend(undefined);
  }

  const balances = data?.balances || [];
  const totalOwed = data?.totalOwed || 0;
  const totalOwe = data?.totalOwe || 0;
  const netBalance = data?.netBalance || 0;
  const owesYou = balances.filter(b => b.balance > 0);
  const youOwe = balances.filter(b => b.balance < 0);
  const settled = balances.filter(b => b.balance === 0);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/70 p-5">
              <Skeleton className="h-10 w-10 rounded-full mx-auto mb-3" />
              <Skeleton className="h-3 w-20 mx-auto mb-2" />
              <Skeleton className="h-7 w-28 mx-auto mb-1" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="divide-y divide-slate-100">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3 p-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Balances</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {balances.length === 0
              ? 'Add expenses to see your balances'
              : `${balances.length} friend${balances.length !== 1 ? 's' : ''} · ${settled.length} settled`}
          </p>
        </div>
        <button
          onClick={loadBalances}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error state */}
      {error && balances.length === 0 && (
        <Card>
          <div className="py-14 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Couldn't load balances</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">{error}</p>
            <Button onClick={loadBalances} icon={RefreshCw} variant="secondary">
              Try again
            </Button>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Net Balance */}
          <Card className={cn(
            'sm:col-span-3',
            netBalance > 0 ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white' :
            netBalance < 0 ? 'border-rose-200 bg-gradient-to-br from-rose-50/80 to-white' :
            'border-slate-200'
          )}>
            <div className="p-5 flex items-center gap-4">
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
                netBalance > 0 ? 'bg-emerald-100' :
                netBalance < 0 ? 'bg-rose-100' : 'bg-slate-100'
              )}>
                <Wallet className={cn(
                  'w-7 h-7',
                  netBalance > 0 ? 'text-emerald-600' :
                  netBalance < 0 ? 'text-rose-600' : 'text-slate-500'
                )} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Balance</p>
                <p className={cn(
                  'text-2xl md:text-3xl font-bold leading-tight mt-0.5',
                  netBalance > 0 ? 'text-emerald-600' :
                  netBalance < 0 ? 'text-rose-600' : 'text-slate-600'
                )}>
                  {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance, currency)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {netBalance > 0 ? "You're owed more than you owe" :
                   netBalance < 0 ? "You owe more than you're owed" :
                   'All balances are settled'}
                </p>
              </div>
            </div>
          </Card>

          {/* Owed to you */}
          <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <ArrowDownRight className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-emerald-700">Owed to you</p>
                <p className="text-lg font-bold text-emerald-600 tabular-nums truncate">
                  {formatCurrency(totalOwed, currency)}
                </p>
              </div>
            </div>
          </Card>

          {/* You owe */}
          <Card className="border-rose-100 bg-gradient-to-br from-rose-50/60 to-white">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-rose-700">You owe</p>
                <p className="text-lg font-bold text-rose-600 tabular-nums truncate">
                  {formatCurrency(totalOwe, currency)}
                </p>
              </div>
            </div>
          </Card>

          {/* Settled */}
          <Card className="border-slate-100 bg-gradient-to-br from-slate-50/60 to-white">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-600">Settled</p>
                <p className="text-lg font-bold text-slate-600">
                  {settled.length} friend{settled.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {balances.length === 0 && !error && (
        <Card>
          <div className="py-14 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl mx-auto mb-4">
              💰
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No balances yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
              Add expenses with friends to see your balances here
            </p>
          </div>
        </Card>
      )}

      {/* Balance columns */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Owes You */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900">Owes you</h2>
              <span className="ml-auto text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {owesYou.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {owesYou.length === 0 ? (
                <p className="p-5 text-sm text-slate-500 text-center">No outstanding balances</p>
              ) : (
                owesYou.map(friend => (
                  <div key={friend.friend_id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <Avatar name={friend.name} url={friend.avatar_url} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{friend.name}</p>
                      <p className="text-xs text-emerald-600 font-medium">owes you</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-emerald-600 tabular-nums">
                        {formatCurrency(friend.balance, currency)}
                      </p>
                      <button
                        onClick={() => handleSettleUp(friend.friend_id)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Settle up
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* You Owe */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-semibold text-slate-900">You owe</h2>
              <span className="ml-auto text-xs font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                {youOwe.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {youOwe.length === 0 ? (
                <p className="p-5 text-sm text-slate-500 text-center">Nothing owed</p>
              ) : (
                youOwe.map(friend => (
                  <div key={friend.friend_id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <Avatar name={friend.name} url={friend.avatar_url} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{friend.name}</p>
                      <p className="text-xs text-rose-600 font-medium">you owe</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-rose-600 tabular-nums">
                        {formatCurrency(Math.abs(friend.balance), currency)}
                      </p>
                      <button
                        onClick={() => handleSettleUp(friend.friend_id)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Settle up
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Settled */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Settled</h2>
              <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {settled.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {settled.length === 0 ? (
                <p className="p-5 text-sm text-slate-500 text-center">No settled friendships yet</p>
              ) : (
                settled.map(friend => (
                  <div key={friend.friend_id} className="flex items-center gap-3 p-4">
                    <Avatar name={friend.name} url={friend.avatar_url} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{friend.name}</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0">
                      ✓ Settled
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={settleUpOpen}
        onClose={() => {
          setSettleUpOpen(false);
          setSelectedFriend(undefined);
        }}
        preselectedFriend={selectedFriend}
        onSuccess={handleSettled}
      />
    </div>
  );
}
