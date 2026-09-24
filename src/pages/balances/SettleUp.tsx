import { useState, useEffect, useCallback } from 'react';
import { ArrowDownRight, ArrowUpRight, HandCoins, CheckCircle2 } from 'lucide-react';
import { Card, Avatar, Button } from '../../components/ui';
import { SettleUpModal } from '../../components/modals';
import { balancesApi } from '../../services/api';
import { formatCurrency, cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import type { BalancesResponse, User } from '../../types';

export default function SettleUp() {
  const { profile } = useAuth();
  const currency = (profile as User)?.currency || 'USD';
  const [data, setData] = useState<BalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [settleUpOpen, setSettleUpOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | undefined>();

  const loadBalances = useCallback(async () => {
    setLoading(true);
    try {
      const balancesData = await balancesApi.get();
      setData(balancesData);
    } catch (err) {
      console.error('Failed to load balances:', err);
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

  if (loading) {
    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/70 p-4 space-y-3">
          {[0, 1].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const balances = data?.balances || [];
  const owesYou = balances.filter(b => b.balance > 0);
  const youOwe = balances.filter(b => b.balance < 0);
  const allToSettle = [...owesYou, ...youOwe];

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Settle Up</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {allToSettle.length === 0
            ? 'All settled up'
            : `Record a payment for ${allToSettle.length} outstanding balance${allToSettle.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {allToSettle.length === 0 ? (
        <Card>
          <div className="py-14 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">All settled up!</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              You don't have any outstanding balances to settle right now
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {owesYou.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900">Owes you</h2>
              <span className="ml-auto text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {owesYou.length}
              </span>
            </div>
          )}
          <div className="divide-y divide-slate-100">
            {owesYou.map(friend => (
              <div key={friend.friend_id} className="p-4 flex items-center gap-4">
                <Avatar name={friend.name} url={friend.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{friend.name}</p>
                  <p className="text-xs text-emerald-600 font-medium">owes you</p>
                </div>
                <div className="text-right flex-shrink-0 mr-2">
                  <p className="text-base font-bold text-emerald-600 tabular-nums">{formatCurrency(friend.balance, currency)}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSettleUp(friend.friend_id)}
                  icon={HandCoins}
                >
                  Settle
                </Button>
              </div>
            ))}
          </div>

          {youOwe.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-semibold text-slate-900">You owe</h2>
              <span className="ml-auto text-xs font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                {youOwe.length}
              </span>
            </div>
          )}
          <div className="divide-y divide-slate-100">
            {youOwe.map(friend => (
              <div key={friend.friend_id} className="p-4 flex items-center gap-4">
                <Avatar name={friend.name} url={friend.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{friend.name}</p>
                  <p className="text-xs text-rose-600 font-medium">you owe</p>
                </div>
                <div className="text-right flex-shrink-0 mr-2">
                  <p className="text-base font-bold text-rose-600 tabular-nums">{formatCurrency(Math.abs(friend.balance), currency)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSettleUp(friend.friend_id)}
                  icon={HandCoins}
                >
                  Pay
                </Button>
              </div>
            ))}
          </div>
        </Card>
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
