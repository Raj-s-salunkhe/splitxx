/**
 * CENTRALIZED BALANCE ENGINE — Source of Truth for All Balance Calculations
 * ================================================================
 *
 * SIGN CONVENTION:
 *   balance[friendId] > 0  →  FRIEND OWES THE USER (creditor)
 *   balance[friendId] < 0  →  USER OWES THE FRIEND (debtor)
 *   balance[friendId] = 0  →  SETTLED
 *
 * EXPENSE MODEL:
 *   An expense has:
 *     - paid_by_friend_id (null = user paid, else friend paid)
 *     - amount (total)
 *     - expense_shares: each share has friend_id (null = user) and share_amount
 *   Sum of all share_amounts ≈ amount (within 0.05 tolerance)
 *
 * SETTLEMENT MODEL:
 *   A settlement has:
 *     - from_friend_id (null = user is payer, else friend is payer)
 *     - to_friend_id   (null = user is receiver, else friend is receiver)
 *     - amount
 *   Exactly one of from/to must be null (user must be involved)
 *
 *   Semantic meaning (per spec):
 *     from=null, to=friend → "Current user pays friend" → user's debt to friend is reduced
 *     from=friend, to=null → "Friend pays current user" → friend's debt to user is reduced
 *
 * SETTLEMENT EFFECTS ON BALANCE:
 *   Settlement: from=null, to=FriendID
 *     → User paid friend. User's debt to friend is reduced.
 *     → balance[FriendID] += amount  (moves toward 0)
 *
 *   Settlement: from=FriendID, to=null
 *     → Friend paid user. Friend's debt to user is reduced.
 *     → balance[FriendID] -= amount  (moves toward 0)
 */

/**
 * Compute balances for a user.
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {Object} options
 * @param {number|null} options.groupId - If set, compute only group-specific balances
 * @returns {Promise<{balances: Object, totalOwed: number, totalOwe: number, netBalance: number, simplified: Array}>}
 */
export async function computeBalances(supabase, userId, options = {}) {
  const { groupId = null } = options;

  // 1. Fetch all friends
  const { data: friends, error: fErr } = await supabase
    .from('friends')
    .select('*')
    .eq('user_id', userId);
  if (fErr) throw fErr;
  const safeFriends = Array.isArray(friends) ? friends : [];

  // 2. Fetch expenses for this user / group
  let expensesQuery = supabase
    .from('expenses')
    .select('id, paid_by_friend_id, amount')
    .eq('user_id', userId);

  if (groupId !== null) {
    expensesQuery = expensesQuery.eq('group_id', groupId);
  }

  const { data: expenses, error: eErr } = await expensesQuery;
  if (eErr) throw eErr;
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const expenseIds = safeExpenses.map((e) => e.id);

  // 3. Fetch expense shares
  let shares = [];
  if (expenseIds.length) {
    const { data } = await supabase
      .from('expense_shares')
      .select('*')
      .in('expense_id', expenseIds);
    shares = data || [];
  }

  // 4. Fetch settlements
  let settlementsQuery = supabase
    .from('settlements')
    .select('*')
    .eq('user_id', userId);

  if (groupId !== null) {
    settlementsQuery = settlementsQuery.eq('group_id', groupId);
  }

  const { data: settlements, error: sErr } = await settlementsQuery;
  if (sErr) throw sErr;
  const safeSettlements = Array.isArray(settlements) ? settlements : [];

  // 5. Initialize balance map: balance[friendId] = 0 for all friends
  const balance = {};
  for (const f of safeFriends) {
    balance[f.id] = 0;
  }

  // 6. Process expenses
  for (const exp of safeExpenses) {
    const expShares = shares.filter((s) => s.expense_id === exp.id);

    if (exp.paid_by_friend_id === null) {
      // User paid the expense
      // Every friend's share is what they owe the user
      for (const s of expShares) {
        if (s.friend_id !== null) {
          balance[s.friend_id] = (balance[s.friend_id] || 0) + Number(s.share_amount);
        }
      }
    } else {
      // A friend paid the expense
      // Find the user's share in this expense
      const myShare = expShares.find((s) => s.friend_id === null);
      if (myShare) {
        // The user owes their share to the paying friend
        balance[exp.paid_by_friend_id] = (balance[exp.paid_by_friend_id] || 0) - Number(myShare.share_amount);
      }
    }
  }

  // 7. Process settlements
  for (const s of safeSettlements) {
    if (s.from_friend_id === null && s.to_friend_id !== null) {
      // User paid friend. User's debt to friend is reduced.
      // Friend's balance moves toward 0: balance += amount
      balance[s.to_friend_id] = (balance[s.to_friend_id] || 0) + Number(s.amount);
    } else if (s.to_friend_id === null && s.from_friend_id !== null) {
      // Friend paid user. Friend's debt to user is reduced.
      // Friend's balance moves toward 0: balance -= amount
      balance[s.from_friend_id] = (balance[s.from_friend_id] || 0) - Number(s.amount);
    }
  }

  // 8. Round and build result
  const round2 = (n) => Math.round(n * 100) / 100;
  const result = {};
  for (const f of safeFriends) {
    result[f.id] = round2(balance[f.id] || 0);
  }

  const balanceList = safeFriends.map((f) => ({
    friend_id: f.id,
    name: f.name,
    email: f.email,
    avatar_url: f.avatar_url,
    balance: result[f.id],
  }));

  const totalOwed = round2(balanceList.filter((r) => r.balance > 0).reduce((a, r) => a + r.balance, 0));
  const totalOwe = round2(balanceList.filter((r) => r.balance < 0).reduce((a, r) => a + Math.abs(r.balance), 0));

  // 9. Simplified debts (greedy algorithm)
  const simplified = simplifyDebts(result, safeFriends);

  return {
    balances: result,         // { [friendId]: number } raw map
    balanceList,              // [{ friend_id, name, balance, ... }]
    totalOwed,
    totalOwe,
    netBalance: round2(totalOwed - totalOwe),
    simplified,
  };
}

/**
 * Greedy simplify-debts algorithm.
 * Takes balance map { [friendId]: number } where positive = friend owes user.
 * Returns optimized transfers to settle all debts.
 */
export function simplifyDebts(balanceMap, friends) {
  // Build net map: positive = creditor (user/friend is owed), negative = debtor
  // In this system, positive balance means friend owes user → friend is debtor
  // We invert: net > 0 means user owes friend, net < 0 means friend owes user
  const netByPerson = { you: 0 };
  for (const f of friends) {
    // balance > 0 means friend owes user → friend is a debtor (negative in net)
    // balance < 0 means user owes friend → friend is a creditor (positive in net)
    netByPerson[`f${f.id}`] = -(balanceMap[f.id] || 0); // negate: positive balance → negative net
    netByPerson.you += balanceMap[f.id] || 0; // user's net = sum of what friends owe them
  }
  // netByPerson.you is positive = user is owed (creditor), negative = user owes (debtor)

  const creditors = []; // people who are owed (positive net)
  const debtors = [];   // people who owe (negative net)

  for (const [key, net] of Object.entries(netByPerson)) {
    if (net > 0.005) creditors.push({ key, amount: net });
    else if (net < -0.005) debtors.push({ key, amount: -net });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    const amount = Math.round(pay * 100) / 100;
    if (amount >= 0.01) {
      transfers.push({ from: debtors[i].key, to: creditors[j].key, amount });
    }
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  // Resolve names
  const nameFor = (key) => {
    if (key === 'you') return 'You';
    const fid = key.replace('f', '');
    return friends.find((f) => f.id === fid)?.name || 'Unknown';
  };

  const friendIdFor = (key) => {
    if (key === 'you') return null;
    return key.replace('f', '');
  };

  // Filter to only transfers involving "you"
  return transfers.map((t) => ({
    from_key: t.from,
    to_key: t.to,
    from_name: nameFor(t.from),
    to_name: nameFor(t.to),
    from_friend_id: friendIdFor(t.from),
    to_friend_id: friendIdFor(t.to),
    amount: t.amount,
  }));
}
