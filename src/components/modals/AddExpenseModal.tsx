import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '../ui';
import { expensesApi, groupsApi, friendsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { Group, Friend, Expense, SplitMethod, User } from '../../types';
import { CATEGORIES, formatCurrency, cn } from '../../utils';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedGroupId?: string;
  preselectedFriends?: string[];
  onSuccess?: (expense: Expense) => void;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  preselectedGroupId,
  preselectedFriends = [],
  onSuccess,
}: AddExpenseModalProps) {
  const { profile } = useAuth();
  const currency = (profile as User)?.currency || 'USD';
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [paidBy, setPaidBy] = useState<string>('me');
  const [shares, setShares] = useState<{ friend_id: string | null; share_amount: number }[]>([]);
  const [percentageInputs, setPercentageInputs] = useState<Record<string, string>>({});
  const [sharesInputs, setSharesInputs] = useState<Record<string, string>>({});
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (preselectedGroupId) {
        setSelectedGroupId(preselectedGroupId);
      }
    }
  }, [isOpen, preselectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find(g => g.id.toString() === selectedGroupId);
      if (group?.members) {
        const memberShares = group.members.map(m => ({
          friend_id: m.friend_id,
          share_amount: 0,
        }));
        setShares(memberShares);
      }
    } else if (friends.length > 0) {
      const friendShares: { friend_id: string | null; share_amount: number }[] = friends.map(f => ({
        friend_id: f.id,
        share_amount: 0,
      }));
      friendShares.push({ friend_id: null, share_amount: 0 });
      setShares(friendShares);
    }
    setPercentageInputs({});
    setSharesInputs({});
  }, [selectedGroupId, friends, groups]);

  useEffect(() => {
    if (splitMethod !== 'equal') return;
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) return;
    const totalParticipants = shares.length || 1;
    const perPerson = Math.round((numAmount / totalParticipants) * 100) / 100;
    setShares(prev => prev.map(s => ({ ...s, share_amount: perPerson })));
  }, [amount, splitMethod, shares.length]);

  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) return;
    if (splitMethod === 'percentage') {
      const totalParticipants = shares.length || 1;
      const equalPct = Math.round((100 / totalParticipants) * 100) / 100;
      const newInputs: Record<string, string> = {};
      shares.forEach(s => {
        const key = s.friend_id === null ? '__you__' : s.friend_id;
        newInputs[key] = equalPct.toString();
      });
      setPercentageInputs(newInputs);
      setShares(prev => prev.map(s => {
        const key = s.friend_id === null ? '__you__' : s.friend_id;
        const pct = Number(newInputs[key]) || 0;
        return { ...s, share_amount: Math.round((numAmount * pct / 100) * 100) / 100 };
      }));
    } else if (splitMethod === 'shares') {
      const newInputs: Record<string, string> = {};
      shares.forEach(s => {
        const key = s.friend_id === null ? '__you__' : s.friend_id;
        newInputs[key] = '1';
      });
      setSharesInputs(newInputs);
      applySharesSplit(newInputs, numAmount);
    } else {
      const totalParticipants = shares.length || 1;
      const perPerson = Math.round((numAmount / totalParticipants) * 100) / 100;
      setShares(prev => prev.map(s => ({ ...s, share_amount: perPerson })));
    }
  }, [splitMethod]);

  function applySharesSplit(inputs: Record<string, string>, totalAmount: number) {
    const totalWeight = Object.values(inputs).reduce((sum, v) => sum + (Number(v) || 0), 0);
    if (totalWeight <= 0) {
      setShares(prev => prev.map(s => ({ ...s, share_amount: 0 })));
      return;
    }
    setShares(prev => prev.map(s => {
      const key = s.friend_id === null ? '__you__' : s.friend_id;
      const weight = Number(inputs[key]) || 0;
      const share = Math.round((totalAmount * weight / totalWeight) * 100) / 100;
      return { ...s, share_amount: share };
    }));
  }

  function applyPercentageInput(key: string, value: string) {
    const newInputs = { ...percentageInputs, [key]: value };
    setPercentageInputs(newInputs);
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount)) return;
    setShares(prev => prev.map(s => {
      const k = s.friend_id === null ? '__you__' : s.friend_id;
      const pct = Number(newInputs[k]) || 0;
      return { ...s, share_amount: Math.round((numAmount * pct / 100) * 100) / 100 };
    }));
  }

  function applySharesInput(key: string, value: string) {
    const newInputs = { ...sharesInputs, [key]: value };
    setSharesInputs(newInputs);
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount)) return;
    applySharesSplit(newInputs, numAmount);
  }

  async function loadData() {
    try {
      const [groupsData, friendsData] = await Promise.all([
        groupsApi.get().catch(() => []),
        friendsApi.get().catch(() => []),
      ]);
      setGroups(groupsData);
      setFriends(friendsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }

  function updateShare(friendId: string | null, value: string) {
    const numValue = parseFloat(value) || 0;
    setShares(prev => prev.map(s =>
      s.friend_id === friendId ? { ...s, share_amount: numValue } : s
    ));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!description.trim()) {
      showError('Please enter a description');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    const validShares = shares.filter(s => s.share_amount > 0);
    if (validShares.length === 0) {
      showError('Please select at least one person to split with');
      return;
    }
    const totalShares = validShares.reduce((sum, s) => sum + s.share_amount, 0);

    if (Math.abs(totalShares - numAmount) > 0.05) {
      if (splitMethod === 'percentage') {
        showError('Percentages must add up to 100%');
      } else if (splitMethod === 'shares') {
        showError('Share amounts must add up to the total');
      } else {
        showError('Shares must add up to the total amount');
      }
      return;
    }

    if (splitMethod === 'percentage') {
      const totalPct = Object.values(percentageInputs).reduce((sum, v) => sum + (Number(v) || 0), 0);
      if (Math.abs(totalPct - 100) > 0.1) {
        showError(`Percentages must add up to 100% (currently ${totalPct.toFixed(2)}%)`);
        return;
      }
    }

    setLoading(true);
    try {
      const expense = await expensesApi.create({
        description: description.trim(),
        amount: numAmount,
        category,
        paid_by_friend_id: paidBy === 'me' ? null : paidBy,
        split_type: splitMethod,
        date,
        group_id: selectedGroupId ? parseInt(selectedGroupId) : undefined,
        shares: validShares,
      });

      showSuccess('Expense added!');
      onSuccess?.(expense);
      handleClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setDescription('');
    setAmount('');
    setCategory('general');
    setSplitMethod('equal');
    setPaidBy('me');
    setSelectedGroupId('');
    setShares([]);
    setPercentageInputs({});
    setSharesInputs({});
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  }

  const groupOptions = [
    { value: '', label: 'No group' },
    ...groups.map(g => ({ value: g.id.toString(), label: g.name })),
  ];

  const paidByOptions = [
    { value: 'me', label: 'You' },
    ...friends.map(f => ({ value: f.id, label: f.name })),
  ];

  const totalEntered = shares.reduce((sum, s) => sum + s.share_amount, 0);
  const totalPct = Object.values(percentageInputs).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const numAmount = parseFloat(amount) || 0;
  const totalWeight = Object.values(sharesInputs).reduce((sum, v) => sum + (Number(v) || 0), 0);

  const splitMethods: { id: SplitMethod; label: string; desc: string }[] = [
    { id: 'equal', label: 'Equal', desc: 'Split evenly' },
    { id: 'exact', label: 'Exact', desc: 'Enter amounts' },
    { id: 'percentage', label: '%', desc: 'By percent' },
    { id: 'shares', label: 'Shares', desc: 'By weight' },
  ];

  function renderShareRow(share: { friend_id: string | null; share_amount: number }) {
    const friend = share.friend_id === null ? null : friends.find(f => f.id === share.friend_id);
    const key = share.friend_id === null ? '__you__' : share.friend_id;
    const name = share.friend_id === null ? 'You' : (friend?.name || 'Unknown');

    let input: React.ReactNode;
    if (splitMethod === 'equal') {
      input = (
        <div className="w-28 px-3 py-1.5 text-sm text-right text-slate-700 rounded-lg bg-slate-50 border border-slate-200 font-medium tabular-nums">
          {numAmount > 0 && shares.length > 0
            ? formatCurrency(Math.round((numAmount / shares.length) * 100) / 100, currency)
            : formatCurrency(0, currency)}
        </div>
      );
    } else if (splitMethod === 'percentage') {
      input = (
        <div className="relative w-32">
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={percentageInputs[key] ?? ''}
            onChange={e => applyPercentageInput(key, e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-7 text-sm text-right font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
            placeholder="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
        </div>
      );
    } else if (splitMethod === 'shares') {
      input = (
        <div className="relative w-32">
          <input
            type="number"
            step="0.01"
            min="0"
            value={sharesInputs[key] ?? ''}
            onChange={e => applySharesInput(key, e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-14 text-sm text-right font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
            placeholder="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">×</span>
        </div>
      );
    } else {
      input = (
        <input
          type="number"
          step="0.01"
          min="0"
          value={share.share_amount || ''}
          onChange={e => updateShare(share.friend_id, e.target.value)}
          className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-right font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
          placeholder="0.00"
        />
      );
    }

    const showResolved = splitMethod === 'percentage' || splitMethod === 'shares';
    return (
      <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
          {showResolved && numAmount > 0 && (
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {formatCurrency(share.share_amount, currency)}
            </p>
          )}
        </div>
        {input}
      </div>
    );
  }

  const isBalanced = numAmount > 0 && Math.abs(totalEntered - numAmount) <= 0.05;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Expense" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Description */}
        <Input
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What was this expense for?"
        />

        {/* Amount + Category */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={`Amount (${currency})`}
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <Select
            label="Category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            options={CATEGORIES.map(c => ({ value: c.id, label: `${c.emoji} ${c.label}` }))}
          />
        </div>

        {/* Paid by + Date */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Paid by"
            value={paidBy}
            onChange={e => setPaidBy(e.target.value)}
            options={paidByOptions}
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Group */}
        <Select
          label="Group"
          value={selectedGroupId}
          onChange={e => setSelectedGroupId(e.target.value)}
          options={groupOptions}
        />

        {/* Split section */}
        <div className="space-y-3 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-sm font-semibold text-slate-700">Split between</label>
            {/* Split method pills */}
            <div className="flex gap-1.5">
              {splitMethods.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSplitMethod(m.id)}
                  title={m.desc}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                    splitMethod === m.id
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {shares.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500">Add friends to start splitting</p>
              </div>
            ) : (
              <>
                {shares.map(renderShareRow)}
                {/* Balance indicator */}
                {amount && shares.length > 0 && (
                  <div className="rounded-xl p-3 space-y-1.5 bg-white border border-slate-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">Total</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {formatCurrency(numAmount, currency)}
                      </span>
                    </div>
                    {splitMethod === 'percentage' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-xs text-slate-500">Allocated</span>
                        <span className={cn(
                          'text-xs font-semibold tabular-nums',
                          Math.abs(totalPct - 100) > 0.1 ? 'text-rose-600' : 'text-emerald-600'
                        )}>
                          {totalPct.toFixed(1)}% {Math.abs(totalPct - 100) > 0.1 && `· should be 100%`}
                        </span>
                      </div>
                    )}
                    {(splitMethod === 'exact' || splitMethod === 'equal') && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-xs text-slate-500">Allocated</span>
                        <span className={cn(
                          'text-xs font-semibold tabular-nums',
                          !isBalanced ? 'text-rose-600' : 'text-emerald-600'
                        )}>
                          {formatCurrency(totalEntered, currency)}
                          {!isBalanced && ` · should be ${formatCurrency(numAmount, currency)}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={handleClose} className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Add Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
