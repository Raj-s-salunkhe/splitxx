import { useState, useEffect } from 'react';
import { ArrowRight, Users, RefreshCw } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { settlementsApi, friendsApi, balancesApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../ui/Avatar';
import { formatCurrency, cn } from '../../utils';
import type { Friend, SimplifiedDebt, BalancesResponse, GroupMember } from '../../types';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedFriend?: string;
  groupId?: string;
  groupMembers?: GroupMember[];
  onSuccess?: () => void;
}

export function SettleUpModal({
  isOpen,
  onClose,
  preselectedFriend,
  groupId,
  groupMembers,
  onSuccess,
}: SettleUpModalProps) {
  const { profile } = useAuth();
  const currency = (profile as User)?.currency || 'USD';
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [friendId, setFriendId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDataLoading(true);
      loadData();
      if (preselectedFriend) {
        setFriendId(preselectedFriend);
      }
    }
  }, [isOpen, preselectedFriend]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [groupMembers]);

  async function loadData() {
    try {
      const balancesData = await balancesApi
        .get(groupId ?? undefined)
        .catch(() => null);
      setBalances(balancesData);

      if (groupId) {
        if (groupMembers && groupMembers.length > 0) {
          const groupFriends: Friend[] = groupMembers
            .filter((m) => m.friend_id !== null)
            .map((m) => ({
              id: m.friend_id as string,
              user_id: '',
              name: m.name,
              avatar_url: m.avatar_url,
              created_at: '',
            }));
          setFriends(groupFriends);
        } else {
          const fromBalances: Friend[] = (balancesData?.balances || [])
            .filter((b) => b.friend_id)
            .map((b) => ({
              id: b.friend_id as string,
              user_id: '',
              name: b.name,
              avatar_url: b.avatar_url,
              created_at: '',
            }));
          setFriends(fromBalances);
        }
      } else {
        const friendsData = await friendsApi.get().catch(() => []);
        setFriends(friendsData);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setDataLoading(false);
    }
  }

  function getBalanceForFriend(fid: string): number | null {
    if (!balances?.balances) return null;
    const found = balances.balances.find(b => b.friend_id === fid);
    return found ? found.balance : null;
  }

  function getSettlementDirection(fid: string): { from: string | null; to: string | null } | null {
    const bal = getBalanceForFriend(fid);
    if (bal === null) return null;
    if (Math.abs(bal) < 0.005) return null;
    if (bal > 0) return { from: fid, to: null };
    return { from: null, to: fid };
  }

  function getMaxSettlable(fid: string): number | null {
    const bal = getBalanceForFriend(fid);
    if (bal === null) return null;
    return Math.abs(bal);
  }

  function getSuggestedAmount(fid: string): number | null {
    const bal = getBalanceForFriend(fid);
    if (bal === null) return null;
    if (Math.abs(bal) < 0.005) return null;
    return Math.abs(bal);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!friendId) {
      showError('Please select a friend');
      return;
    }

    const direction = getSettlementDirection(friendId);
    if (!direction) {
      showError('There is no outstanding balance with this friend to settle');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    const maxAmount = getMaxSettlable(friendId) || 0;
    if (numAmount > maxAmount + 0.01) {
      showError(`Amount exceeds the outstanding balance. Maximum: ${formatCurrency(maxAmount, currency)}`);
      return;
    }

    setLoading(true);
    try {
      await settlementsApi.create({
        from_friend_id: direction.from,
        to_friend_id: direction.to,
        amount: numAmount,
        note: note.trim() || undefined,
        group_id: groupId,
      });

      showSuccess('Settlement recorded!');
      onSuccess?.();
      handleClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to record settlement');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setFriendId('');
    setAmount('');
    setNote('');
    onClose();
  }

  function selectFriend(id: string) {
    setFriendId(id);
    setAmount('');
  }

  const selectedBalance = friendId ? getBalanceForFriend(friendId) : null;
  const direction = friendId ? getSettlementDirection(friendId) : null;
  const suggestedAmount = friendId ? getSuggestedAmount(friendId) : null;
  const maxSettlable = friendId ? getMaxSettlable(friendId) : null;
  const selectedFriend = friendId ? friends.find(f => f.id === friendId) : null;
  const showNoGroupMembers = groupId && friends.length === 0;

  // Build options with inline balance info
  const owesYouFriends = friends.filter(f => {
    const bal = balances?.balances?.find(b => b.friend_id === f.id);
    return bal && bal.balance > 0;
  });
  const youOweFriends = friends.filter(f => {
    const bal = balances?.balances?.find(b => b.friend_id === f.id);
    return bal && bal.balance < 0;
  });
  const settledFriends = friends.filter(f => {
    const bal = balances?.balances?.find(b => b.friend_id === f.id);
    return bal && Math.abs(bal.balance) < 0.005;
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Settle Up" size="md">
      {showNoGroupMembers ? (
        <div className="py-8 px-2 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No friends in this group</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Add members to this group before recording settlements.
          </p>
          <Button variant="ghost" onClick={handleClose} className="mt-2">Close</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Friend selection */}
          {friendId ? (
            /* Selected friend view */
            <div className="space-y-4">
              {/* Direction banner */}
              {selectedBalance !== null && Math.abs(selectedBalance) >= 0.005 && (
                <div className={cn(
                  'rounded-2xl p-4 text-center',
                  selectedBalance > 0
                    ? 'bg-gradient-to-br from-emerald-50 to-white border border-emerald-200'
                    : 'bg-gradient-to-br from-rose-50 to-white border border-rose-200'
                )}>
                  <div className="flex items-center justify-center gap-3">
                    <Avatar name={selectedFriend?.name} size="md" />
                    <div>
                      <p className={cn(
                        'text-sm font-semibold',
                        selectedBalance > 0 ? 'text-emerald-700' : 'text-rose-700'
                      )}>
                        {selectedBalance > 0
                          ? `${selectedFriend?.name || 'Friend'} owes you`
                          : `You owe ${selectedFriend?.name || 'Friend'}`}
                      </p>
                      <p className={cn(
                        'text-2xl font-bold tabular-nums',
                        selectedBalance > 0 ? 'text-emerald-600' : 'text-rose-600'
                      )}>
                        {formatCurrency(Math.abs(selectedBalance), currency)}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    'mt-3 flex items-center justify-center gap-2 text-xs font-medium rounded-full px-3 py-1',
                    selectedBalance > 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  )}>
                    <ArrowRight className="w-3 h-3" />
                    {selectedBalance > 0
                      ? `${selectedFriend?.name || 'Friend'} pays you`
                      : 'You pay them'}
                  </div>
                </div>
              )}

              {selectedBalance !== null && Math.abs(selectedBalance) < 0.005 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    You're all settled with {selectedFriend?.name || 'this friend'}
                  </p>
                </div>
              )}

              {/* Amount input */}
              {direction && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Amount
                      {maxSettlable !== null && (
                        <span className="text-slate-400 font-normal text-xs ml-1">
                          (max {formatCurrency(maxSettlable, currency)})
                        </span>
                      )}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={maxSettlable ?? undefined}
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder={suggestedAmount ? suggestedAmount.toFixed(2) : '0.00'}
                    />
                  </div>

                  {suggestedAmount !== null && (
                    <button
                      type="button"
                      onClick={() => setAmount(suggestedAmount.toFixed(2))}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Pay full amount ({formatCurrency(suggestedAmount, currency)})
                    </button>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Note <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
                    <Input
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="What's this payment for?"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setFriendId(''); setAmount(''); setNote(''); }}
                  className="flex-1"
                  disabled={loading}
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={Boolean(!direction || !amount)}
                  className="flex-1"
                >
                  {selectedBalance !== null && selectedBalance > 0 ? 'Record received' : 'Record payment'}
                </Button>
              </div>
            </div>
          ) : (
            /* Friend picker */
            <div className="space-y-3">
              {dataLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="w-10 h-10 rounded-full skeleton" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3.5 w-28 rounded" />
                        <div className="skeleton h-3 w-20 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {owesYouFriends.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 px-1">
                        Who owes you ({owesYouFriends.length})
                      </p>
                      <div className="space-y-1">
                        {owesYouFriends.map(friend => {
                          const bal = balances?.balances?.find(b => b.friend_id === friend.id);
                          return (
                            <button
                              key={friend.id}
                              type="button"
                              onClick={() => selectFriend(friend.id)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 hover:bg-emerald-100 transition-colors text-left"
                            >
                              <Avatar name={friend.name} url={friend.avatar_url} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{friend.name}</p>
                                <p className="text-xs text-emerald-600 font-medium">owes you</p>
                              </div>
                              <p className="text-sm font-bold text-emerald-600 tabular-nums">
                                {bal ? formatCurrency(bal.balance, currency) : ''}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {youOweFriends.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-2 px-1">
                        Who you owe ({youOweFriends.length})
                      </p>
                      <div className="space-y-1">
                        {youOweFriends.map(friend => {
                          const bal = balances?.balances?.find(b => b.friend_id === friend.id);
                          return (
                            <button
                              key={friend.id}
                              type="button"
                              onClick={() => selectFriend(friend.id)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-50/60 hover:bg-rose-100 transition-colors text-left"
                            >
                              <Avatar name={friend.name} url={friend.avatar_url} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{friend.name}</p>
                                <p className="text-xs text-rose-600 font-medium">you owe</p>
                              </div>
                              <p className="text-sm font-bold text-rose-600 tabular-nums">
                                {bal ? formatCurrency(Math.abs(bal.balance), currency) : ''}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {settledFriends.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
                        Settled ({settledFriends.length})
                      </p>
                      <div className="space-y-1">
                        {settledFriends.map(friend => (
                          <div
                            key={friend.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60 opacity-60"
                          >
                            <Avatar name={friend.name} url={friend.avatar_url} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700">{friend.name}</p>
                            </div>
                            <span className="text-xs text-emerald-600 font-medium">✓ Settled</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {friends.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-500">No friends with outstanding balances</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
