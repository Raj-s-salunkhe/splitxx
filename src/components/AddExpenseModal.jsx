import { useState, useEffect, useMemo } from 'react';
import { X, Receipt, Scale, Percent, ListChecks } from 'lucide-react';
import { authedFetch, CATEGORIES, formatCurrency } from '../lib/api';
import ErrorBanner from './ErrorBanner';
import Avatar from './Avatar';

export default function AddExpenseModal({ groupId = null, onClose, onCreated }) {
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId);
  const [people, setPeople] = useState([]);
  const [participantKeys, setParticipantKeys] = useState([]);
  const [paidByKey, setPaidByKey] = useState('you');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [splitType, setSplitType] = useState('equal');
  const [customAmounts, setCustomAmounts] = useState({});
  const [customPercents, setCustomPercents] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const results = await Promise.allSettled([
          authedFetch('/api/groups'),
          authedFetch('/api/friends'),
        ]);

        const groupsResult = results[0];
        const friendsResult = results[1];

        if (groupsResult.status === 'fulfilled') {
          const data = groupsResult.value;

          const safeGroups = Array.isArray(data)
            ? data
            : Array.isArray(data?.groups)
            ? data.groups
            : [];

          setGroups(safeGroups);
        } else {
          console.error('Groups API error:', groupsResult.reason);
          setGroups([]);
          setError(groupsResult.reason?.message || 'Could not load groups. You can still add an expense without a group.');
        }

        if (friendsResult.status === 'fulfilled') {
          const data = friendsResult.value;

          const safeFriends = Array.isArray(data)
            ? data
            : Array.isArray(data?.friends)
            ? data.friends
            : [];

          setFriends(safeFriends);
        } else {
          console.error('Friends API error:', friendsResult.reason);
          setFriends([]);
          setError((current) => current || friendsResult.reason?.message || 'Could not load friends.');
        }
      } catch (e) {
        console.error('Add expense loading error:', e);
        setGroups([]);
        setFriends([]);
        setError(e?.message || 'Could not load expense data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const safeGroups = Array.isArray(groups) ? groups.filter((group) => group && typeof group === 'object') : [];
    const safeFriends = Array.isArray(friends) ? friends.filter((friend) => friend && typeof friend === 'object') : [];

    if (selectedGroupId) {
      const g = safeGroups.find(
        (gr) => gr?.id === Number(selectedGroupId)
      );

      if (g) {
        const members = Array.isArray(g.members)
          ? g.members
          : [];

        const ppl = members.map((m) => ({
          key:
            m?.friend_id === null
              ? 'you'
              : `f${m?.friend_id}`,
          friend_id: m?.friend_id ?? null,
          name: m?.name || 'Member',
          avatar_url: m?.avatar_url || null,
        }));

        setPeople(ppl);
        setParticipantKeys(ppl.map((p) => p.key));

        if (!ppl.some((p) => p.key === paidByKey)) {
          setPaidByKey('you');
        }

        return;
      }
    }

    const ppl = [
      {
        key: 'you',
        friend_id: null,
        name: 'You',
        avatar_url: null,
      },
      ...safeFriends.map((f) => ({
        key: `f${f.id}`,
        friend_id: f.id,
        name: f?.name || 'Friend',
        avatar_url: f?.avatar_url || null,
      })),
    ];

    setPeople(ppl);
    setParticipantKeys(ppl.map((p) => p.key));

    if (!ppl.some((p) => p.key === paidByKey)) {
      setPaidByKey('you');
    }
  }, [selectedGroupId, groups, friends]);

  const toggleParticipant = (key) => {
    setParticipantKeys((keys) =>
      keys.includes(key)
        ? keys.filter((k) => k !== key)
        : [...keys, key]
    );
  };

  const totalAmount = Number(amount) || 0;

  const safePeople = Array.isArray(people)
    ? people
    : [];

  const activeParticipants = safePeople.filter((p) =>
    participantKeys.includes(p.key)
  );

  const equalShare = activeParticipants.length
    ? totalAmount / activeParticipants.length
    : 0;

  const customTotal = useMemo(() => {
    return activeParticipants.reduce(
      (sum, p) =>
        sum + (Number(customAmounts[p.key]) || 0),
      0
    );
  }, [customAmounts, activeParticipants]);

  const percentTotal = useMemo(() => {
    return activeParticipants.reduce(
      (sum, p) =>
        sum + (Number(customPercents[p.key]) || 0),
      0
    );
  }, [customPercents, activeParticipants]);

  const buildShares = () => {
    if (splitType === 'equal') {
      return activeParticipants.map((p) => ({
        friend_id: p.friend_id,
        share_amount:
          Math.round(equalShare * 100) / 100,
      }));
    }

    if (splitType === 'unequal') {
      return activeParticipants.map((p) => ({
        friend_id: p.friend_id,
        share_amount:
          Number(customAmounts[p.key]) || 0,
      }));
    }

    return activeParticipants.map((p) => ({
      friend_id: p.friend_id,
      share_amount:
        Math.round(
          (
            totalAmount *
            (Number(customPercents[p.key]) || 0) /
            100
          ) * 100
        ) / 100,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      return setError('Please add a description.');
    }

    if (!totalAmount || totalAmount <= 0) {
      return setError('Please enter a valid amount.');
    }

    if (activeParticipants.length === 0) {
      return setError('Select at least one participant.');
    }

    if (
      splitType === 'unequal' &&
      Math.abs(customTotal - totalAmount) > 0.05
    ) {
      return setError(
        `Custom amounts total ${formatCurrency(
          customTotal
        )}, but the expense is ${formatCurrency(
          totalAmount
        )}.`
      );
    }

    if (
      splitType === 'percentage' &&
      Math.abs(percentTotal - 100) > 0.5
    ) {
      return setError(
        `Percentages total ${percentTotal.toFixed(
          1
        )}%, they must add up to 100%.`
      );
    }

    const payer =
      safePeople.find((p) => p.key === paidByKey) ||
      safePeople.find((p) => p.key === 'you');

    setSaving(true);

    try {
      await authedFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          description,
          amount: totalAmount,
          category,
          date,
          group_id: selectedGroupId || null,
          paid_by_friend_id: payer
            ? payer.friend_id
            : null,
          split_type: splitType,
          shares: buildShares(),
        }),
      });

      if (onCreated) {
        onCreated();
      }

      onClose();
    } catch (err) {
      setError(
        err?.message || 'Could not save expense.'
      );
    } finally {
      setSaving(false);
    }
  };

  const safeGroups = Array.isArray(groups)
    ? groups.filter((group) => group && typeof group === 'object')
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt size={18} />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              Add an expense
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 py-10 text-center">
            Loading…
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-5">

            <div>
              <label className="text-xs font-medium text-slate-500">
                Group (optional)
              </label>

              <select
                value={selectedGroupId || ''}
                onChange={(e) =>
                  setSelectedGroupId(
                    e.target.value
                      ? Number(e.target.value)
                      : null
                  )
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">
                  No group — just friends
                </option>

                {safeGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g?.icon || '📁'} {g?.name || 'Unnamed group'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">
                Description
              </label>

              <input
                autoFocus
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="e.g. Dinner at Cafe Noir"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Amount
                </label>

                <div className="mt-1 relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    $
                  </span>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Date
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">
                Category
              </label>

              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() =>
                      setCategory(c.id)
                    }
                    className={`text-xs px-2.5 py-1.5 rounded-full border font-medium transition ${
                      category === c.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">
                Paid by
              </label>

              <select
                value={paidByKey}
                onChange={(e) =>
                  setPaidByKey(e.target.value)
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {safePeople.map((p) => (
                  <option
                    key={p.key}
                    value={p.key}
                  >
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">
                Split between
              </label>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">

                {safePeople.map((p) => (
                  <label
                    key={p.key}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 cursor-pointer hover:bg-slate-50"
                  >

                    <input
                      type="checkbox"
                      checked={participantKeys.includes(
                        p.key
                      )}
                      onChange={() =>
                        toggleParticipant(p.key)
                      }
                      className="accent-indigo-600"
                    />

                    <Avatar
                      name={p.name}
                      url={p.avatar_url}
                      size="sm"
                    />

                    <span className="text-sm text-slate-700 flex-1">
                      {p.name}
                    </span>

                    {splitType === 'equal' &&
                      participantKeys.includes(p.key) &&
                      totalAmount > 0 && (
                        <span className="text-xs text-slate-400">
                          {formatCurrency(equalShare)}
                        </span>
                      )}

                    {splitType === 'unequal' &&
                      participantKeys.includes(p.key) && (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={
                            customAmounts[p.key] ?? ''
                          }
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                          onChange={(e) =>
                            setCustomAmounts((c) => ({
                              ...c,
                              [p.key]: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs text-right"
                        />
                      )}

                    {splitType === 'percentage' &&
                      participantKeys.includes(p.key) && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={
                              customPercents[p.key] ?? ''
                            }
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                            onChange={(e) =>
                              setCustomPercents((c) => ({
                                ...c,
                                [p.key]:
                                  e.target.value,
                              }))
                            }
                            placeholder="0"
                            className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-xs text-right"
                          />

                          <span className="text-xs text-slate-400">
                            %
                          </span>
                        </div>
                      )}

                  </label>
                ))}

                {safePeople.length === 0 && (
                  <p className="text-sm text-slate-400 py-3">
                    No friends or group members available.
                  </p>
                )}

              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">
                Split type
              </label>

              <div className="grid grid-cols-3 gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setSplitType('equal')
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition ${
                    splitType === 'equal'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Scale size={16} />
                  Equally
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSplitType('unequal')
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition ${
                    splitType === 'unequal'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <ListChecks size={16} />
                  Exact amounts
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSplitType('percentage')
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition ${
                    splitType === 'percentage'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Percent size={16} />
                  Percentage
                </button>

              </div>

              {splitType === 'unequal' &&
                totalAmount > 0 && (
                  <p
                    className={`text-xs mt-2 ${
                      Math.abs(
                        customTotal - totalAmount
                      ) > 0.05
                        ? 'text-rose-500'
                        : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(customTotal)} of{' '}
                    {formatCurrency(totalAmount)} allocated
                  </p>
                )}

              {splitType === 'percentage' && (
                <p
                  className={`text-xs mt-2 ${
                    Math.abs(percentTotal - 100) > 0.5
                      ? 'text-rose-500'
                      : 'text-emerald-600'
                  }`}
                >
                  {percentTotal.toFixed(1)}% of 100%
                  allocated
                </p>
              )}
            </div>

            <ErrorBanner message={error} />

            <button
              disabled={saving}
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl py-2.5 text-sm transition"
            >
              {saving
                ? 'Saving…'
                : 'Save expense'}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
