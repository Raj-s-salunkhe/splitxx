import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, X, ChevronDown, Trash2, Receipt, AlertCircle, RefreshCw, Tag } from 'lucide-react';
import { Button, Card, Avatar, Skeleton } from '../../components/ui';
import { AddExpenseModal } from '../../components/modals';
import { expensesApi, groupsApi } from '../../services/api';
import { formatCurrency, formatDate, getCategoryEmoji, cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Expense, Group, User } from '../../types';

export default function Expenses() {
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = (profile as User)?.currency || 'USD';
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [expensesData, groupsData] = await Promise.all([
        expensesApi.get().catch(() => []),
        groupsApi.get().catch(() => []),
      ]);
      setExpenses(expensesData || []);
      setGroups(groupsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDeleteExpense(expenseId: string) {
    try {
      await expensesApi.delete(expenseId);
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      showSuccess('Expense deleted');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  }

  function handleExpenseCreated() {
    loadData();
    setAddModalOpen(false);
  }

  const filteredExpenses = expenses
    .filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.paid_by_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = !filterGroup || e.group_id?.toString() === filterGroup;
      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <Skeleton className="h-10 rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-200/50">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && expenses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Expenses</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track all your expenses</p>
          </div>
          <Button onClick={() => setAddModalOpen(true)} icon={Plus}>
            Add Expense
          </Button>
        </div>
        <Card>
          <div className="py-14 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Couldn't load expenses</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">{error}</p>
            <Button onClick={loadData} icon={RefreshCw} variant="secondary">
              Try again
            </Button>
          </div>
        </Card>
        <AddExpenseModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleExpenseCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {expenses.length === 0
              ? 'Add your first expense'
              : `${expenses.length} expense${expenses.length !== 1 ? 's' : ''} recorded`}
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} icon={Plus}>
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      {expenses.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search expenses by description or payer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterGroup}
              onChange={e => setFilterGroup(e.target.value)}
              className="flex-1 sm:flex-none sm:w-48 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">All groups</option>
              {groups.map(g => (
                <option key={g.id} value={g.id.toString()}>{g.name}</option>
              ))}
            </select>
            {(searchQuery || filterGroup) && (
              <button
                onClick={() => { setSearchQuery(''); setFilterGroup(''); }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary bar */}
      {filteredExpenses.length > 0 && (
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/70">
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
              {filterGroup && ` in ${groups.find(g => g.id.toString() === filterGroup)?.name}`}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/50 uppercase tracking-wide">Total</span>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(totalAmount, currency)}</p>
          </div>
        </div>
      )}

      {/* Expenses list */}
      {expenses.length === 0 ? (
        <Card>
          <div className="py-14 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl mx-auto mb-4">
              🧾
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No expenses yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
              Track your shared expenses to see who owes what
            </p>
            <Button onClick={() => setAddModalOpen(true)} icon={Plus}>
              Add your first expense
            </Button>
          </div>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <Card>
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-3">
              🔍
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No results found</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {searchQuery
                ? `No expenses matching "${searchQuery}"`
                : 'No expenses in this group'}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setFilterGroup(''); }}
              className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map(expense => {
            const group = groups.find(g => g.id === expense.group_id);
            const category = getCategoryEmoji(expense.category);
            return (
              <Card key={expense.id} hover>
                <div
                  className="cursor-pointer"
                  onClick={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
                >
                  <div className="p-4 flex items-center gap-3">
                    {/* Category icon */}
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                      {category}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{expense.description}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap mt-0.5">
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                            {expense.paid_by_name?.[0]?.toUpperCase() || '?'}
                          </span>
                          <span className="font-medium">{expense.paid_by_name || 'You'}</span>
                        </span>
                        <span>·</span>
                        <span>{formatDate(expense.date)}</span>
                        {group && (
                          <>
                            <span>·</span>
                            <Link
                              to={`/groups/${group.id}`}
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                              onClick={e => e.stopPropagation()}
                            >
                              {group.name}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount + expand chevron */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-base font-bold text-slate-900 tabular-nums">
                        {formatCurrency(expense.amount, currency)}
                      </p>
                      <ChevronDown className={cn(
                        'w-4 h-4 text-slate-400 transition-transform duration-200',
                        expandedId === expense.id && 'rotate-180'
                      )} />
                    </div>
                  </div>

                  {/* Your share badge (collapsed) */}
                  {expense.shares && expense.shares.length > 0 && (
                    <div className="px-4 pb-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
                        <Tag className="w-3 h-3" />
                        Split {expense.shares.length} way{expense.shares.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Expanded details */}
                  {expandedId === expense.id && (
                    <div className="border-t border-slate-100 pt-4 px-4 pb-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500 font-medium mb-0.5">Paid by</p>
                          <p className="text-sm font-semibold text-slate-900">{expense.paid_by_name || 'You'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500 font-medium mb-0.5">Date</p>
                          <p className="text-sm font-semibold text-slate-900">{formatDate(expense.date)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 col-span-2 sm:col-span-1">
                          <p className="text-xs text-slate-500 font-medium mb-0.5">Category</p>
                          <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{category}</span>
                            <span className="capitalize">{expense.category}</span>
                          </p>
                        </div>
                      </div>

                      {expense.shares && expense.shares.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Split between</p>
                          <div className="space-y-2">
                            {expense.shares.map((share, i) => (
                              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Avatar name={share.name} size="xs" />
                                  <span className="text-sm text-slate-700 font-medium truncate">{share.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900 tabular-nums ml-2 flex-shrink-0">
                                  {formatCurrency(share.share_amount, currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteExpense(expense.id);
                        }}
                        className="flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg px-3 py-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete expense
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AddExpenseModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleExpenseCreated}
      />
    </div>
  );
}
