import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Receipt,
  HandCoins,
  Users,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Trash2,
  X,
  MoreVertical,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Button, Card, CardContent, Avatar, ConfirmDialog } from '../../components/ui';
import { SkeletonGroupDetails } from '../../components/ui/Skeleton';
import { AddExpenseModal, SettleUpModal, AddMembersModal } from '../../components/modals';
import { groupsApi } from '../../services/api';
import { formatCurrency, formatDateShort, getCategoryEmoji, cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { GroupDetailResponse, GroupMember, User } from '../../types';

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = (profile as User)?.currency || 'USD';

  const [data, setData] = useState<GroupDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [settleUpOpen, setSettleUpOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [removeMember, setRemoveMember] = useState<GroupMember | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);

  const loadGroupDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await groupsApi.getDetail(id);
      setData(response);
    } catch (err) {
      console.error('Failed to load group:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGroupDetails();
  }, [loadGroupDetails]);

  function handleExpenseAdded() {
    loadGroupDetails();
    setAddExpenseOpen(false);
  }

  function handleSettled() {
    loadGroupDetails();
    setSettleUpOpen(false);
  }

  function handleMembersAdded() {
    loadGroupDetails();
  }

  async function handleDeleteGroup() {
    if (!id) return;
    try {
      await groupsApi.delete(id);
      showSuccess('Group deleted');
      navigate('/groups');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete group');
      throw err;
    }
  }

  async function handleRemoveMember() {
    if (!id || !removeMember || removeMember.friend_id === null) return;
    try {
      await groupsApi.removeMember(id, removeMember.friend_id);
      showSuccess(`${removeMember.name} removed from group`);
      setRemoveMember(null);
      loadGroupDetails();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonGroupDetails />
      </div>
    );
  }

  if (!data?.group) {
    return (
      <div className="space-y-4">
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to groups
        </Link>
        <Card>
          <div className="py-14 px-4 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Group not found</h3>
            <p className="text-sm text-slate-500 mb-6">This group may have been deleted or you don't have access</p>
            <button
              onClick={() => navigate('/groups')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all groups →
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const { group, members, expenses, simplified, available_friends, is_owner } = data;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const yourMember = members.find(m => m.key === 'you');
  const yourNet = yourMember?.net || 0;
  const youAreOwedInGroup = members
    .filter(m => m.friend_id !== null && (m.net || 0) < 0)
    .reduce((sum, m) => sum + Math.abs(m.net || 0), 0);
  const youOweInGroup = members
    .filter(m => m.friend_id !== null && (m.net || 0) > 0)
    .reduce((sum, m) => sum + Math.abs(m.net || 0), 0);
  const memberCount = members.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            to="/groups"
            className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors flex-shrink-0 -ml-1"
            aria-label="Back to groups"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl md:text-3xl flex-shrink-0">
            {group.icon || '👥'}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight truncate">{group.name}</h1>
            <p className="text-xs text-slate-500">
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex gap-2 flex-shrink-0">
          {is_owner && (
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Group options"
                className="!px-2.5"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200/70 rounded-xl shadow-lg z-20 py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteGroupOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete group
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <Button variant="outline" onClick={() => setSettleUpOpen(true)} className="!px-3">
            <HandCoins className="w-4 h-4" />
            <span className="hidden lg:inline">Settle Up</span>
          </Button>
          <Button onClick={() => setAddExpenseOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Add Expense</span>
          </Button>
        </div>

        {/* Mobile compact actions */}
        <div className="md:hidden flex gap-2 flex-shrink-0">
          <Button size="sm" onClick={() => setAddExpenseOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Expense</span>
          </Button>
        </div>
      </div>

      {/* Mobile secondary actions */}
      <div className="md:hidden flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setSettleUpOpen(true)} className="flex-1">
          <HandCoins className="w-4 h-4" />
          Settle Up
        </Button>
        {is_owner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteGroupOpen(true)}
            className="!text-rose-600 !border-rose-200 hover:!bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-3 gap-3">
        {/* Your Net */}
        <Card
          className={cn(
            'overflow-hidden relative',
            yourNet >= 0
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
              : 'bg-gradient-to-br from-rose-500 to-rose-600'
          )}
        >
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              {yourNet > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-100" />
              ) : yourNet < 0 ? (
                <TrendingDown className="w-3.5 h-3.5 text-rose-100" />
              ) : (
                <HandCoins className="w-3.5 h-3.5 text-white/60" />
              )}
              <p className="text-xs font-medium text-white/70">Your Balance</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-white">
              {yourNet >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(yourNet), currency)}
            </p>
            <p className="text-xs text-white/60 mt-1">
              {yourNet > 0 ? "You're owed" : yourNet < 0 ? 'You owe' : 'All settled'}
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
              {formatCurrency(youAreOwedInGroup, currency)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">From this group</p>
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
              {formatCurrency(youOweInGroup, currency)}
            </p>
            <p className="text-xs text-rose-600 mt-1">In this group</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column - expenses + simplified */}
        <div className="lg:col-span-2 space-y-4">
          {/* Simplified balances */}
          {simplified.length > 0 && (
            <Card className="border-emerald-200/70 bg-emerald-50/30">
              <div className="px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-emerald-600" />
                <h2 className="font-semibold text-sm text-emerald-800">Suggested Settlements</h2>
                <span className="text-xs text-emerald-600 ml-1">to minimize transfers</span>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-emerald-100">
                  {simplified.map((transfer, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar name={transfer.from_name} size="xs" />
                        <span className="text-sm font-medium text-slate-700 truncate">{transfer.from_name}</span>
                        <span className="text-slate-400 flex-shrink-0">→</span>
                        <Avatar name={transfer.to_name} size="xs" />
                        <span className="text-sm font-medium text-slate-700 truncate">{transfer.to_name}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 ml-2 flex-shrink-0">
                        {formatCurrency(transfer.amount, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expenses */}
          <Card>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-500" />
                Expenses
                <span className="text-xs text-slate-500 font-normal">
                  · {expenses.length} total · {formatCurrency(totalExpenses, currency)}
                </span>
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-3">
                    🧾
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">No expenses yet</p>
                  <p className="text-xs text-slate-500 mb-4">Add your first expense to start tracking</p>
                  <button
                    onClick={() => setAddExpenseOpen(true)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Add your first expense →
                  </button>
                </div>
              ) : (
                expenses.map(expense => (
                  <div key={expense.id}>
                    <button
                      onClick={() => setExpandedExpense(expandedExpense === expense.id ? null : expense.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                        {getCategoryEmoji(expense.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{expense.description}</p>
                        <p className="text-xs text-slate-500 truncate">
                          Paid by {expense.paid_by_name} · {formatDateShort(expense.date)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-2">
                        <p className="font-semibold text-slate-900 text-sm">{formatCurrency(expense.amount, currency)}</p>
                        {expandedExpense === expense.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {expandedExpense === expense.id && expense.shares && expense.shares.length > 0 && (
                      <div className="px-4 pb-3 bg-slate-50/50">
                        <div className="space-y-1.5 pt-2">
                          {expense.shares.map((share, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar name={share.name} size="xs" />
                                <span className="text-sm text-slate-700 truncate">{share.name}</span>
                              </div>
                              <span className="text-sm font-medium text-slate-900 flex-shrink-0">
                                {formatCurrency(share.share_amount, currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right column - members */}
        <div className="space-y-4">
          <Card>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Members
                <span className="text-xs text-slate-500 font-normal">· {memberCount}</span>
              </h2>
              {is_owner && (
                <button
                  onClick={() => setAddMembersOpen(true)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add
                </button>
              )}
            </div>
            <div className="p-3">
              {members.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No members yet</p>
              ) : (
                <div className="space-y-1">
                  {members.map(member => {
                    const net = member.net || 0;
                    const isRemovable = is_owner && member.friend_id !== null;
                    const isYou = member.key === 'you';
                    return (
                      <div
                        key={member.key}
                        className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <Avatar name={member.name} url={member.avatar_url} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {member.name}
                            {isYou && <span className="ml-1.5 text-xs text-slate-500">(you)</span>}
                          </p>
                          <p className={cn(
                            'text-xs',
                            net > 0 ? 'text-emerald-600' : net < 0 ? 'text-rose-600' : 'text-slate-400'
                          )}>
                            {net === 0 ? 'Settled' : net > 0 ? `Owed ${formatCurrency(net, currency)}` : `Owes ${formatCurrency(Math.abs(net), currency)}`}
                          </p>
                        </div>
                        {isRemovable && (
                          <button
                            onClick={() => setRemoveMember(member)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label={`Remove ${member.name}`}
                            title="Remove member"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        preselectedGroupId={id}
        onSuccess={handleExpenseAdded}
      />
      <SettleUpModal
        isOpen={settleUpOpen}
        onClose={() => setSettleUpOpen(false)}
        groupId={id}
        groupMembers={members}
        onSuccess={handleSettled}
      />
      {is_owner && available_friends && (
        <AddMembersModal
          isOpen={addMembersOpen}
          onClose={() => setAddMembersOpen(false)}
          groupId={id!}
          availableFriends={available_friends}
          onSuccess={handleMembersAdded}
        />
      )}
      <ConfirmDialog
        isOpen={deleteGroupOpen}
        onClose={() => setDeleteGroupOpen(false)}
        onConfirm={handleDeleteGroup}
        title="Delete this group?"
        description="This action cannot be undone. The group will be removed from your list."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
      <ConfirmDialog
        isOpen={!!removeMember}
        onClose={() => setRemoveMember(null)}
        onConfirm={handleRemoveMember}
        title={`Remove ${removeMember?.name}?`}
        description="They will no longer be part of this group. This only works if they have no expenses in this group."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
