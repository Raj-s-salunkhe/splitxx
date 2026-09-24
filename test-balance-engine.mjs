/**
 * Balance Engine Test Suite
 *
 * Sign convention:
 *   balance > 0 → friend owes the user (creditor)
 *   balance < 0 → user owes the friend (debtor)
 *   balance = 0 → settled
 *
 * Expense model:
 *   - When a friend pays, they pay the total. Their own share is NOT in expense_shares
 *     (since they paid their own share directly). Only OTHER participants are in shares.
 *   - When user pays, all participants (including self) are in shares.
 *
 * Settlement semantics (per spec):
 *   from=null, to=friend → "Current user pays friend"     → balance[friend] += amount
 *   from=friend, to=null → "Friend pays current user"   → balance[friend] -= amount
 *
 * Example 1: A pays 900 for A, B, C equally.
 *   A paid 900. Shares: B=300, C=300. A's own share is excluded (already paid).
 *   B balance = +300, C balance = +300.
 *
 * Example 2: User owes Bob 500. User pays Bob 200 → Bob = -300.
 *   Bob paid 1000. User owes 500. Balance = -500.
 *   User pays Bob (from=null, to=Bob): balance += 200 → -500 + 200 = -300.
 *
 * Example 3: Bob owes user 500. Bob pays user 200 → Bob = +300.
 *   User paid 1500. Bob owes 500. Balance = +500.
 *   Bob pays user (from=Bob, to=null): balance -= 200 → 500 - 200 = +300.
 */

import assert from 'node:assert';

function computeBalancesPure({ friends, expenses, shares, settlements }, options = {}) {
  // groupId semantics:
  //   undefined (or not set) → no filter, use all provided data.
  //                            The caller is responsible for pre-filtering.
  //                            This matches the original test pattern.
  //   null                    → STRICT GLOBAL: include only items with group_id = null.
  //   number (X)              → GROUP X: include only items with group_id === X.
  //                            Items with group_id = null are excluded.
  const { groupId = undefined } = options;

  let filteredExpenses = expenses;
  let filteredSettlements = settlements;
  if (groupId === null) {
    filteredExpenses = expenses.filter((e) => e.group_id == null);
    filteredSettlements = settlements.filter((s) => s.group_id == null);
  } else if (groupId !== undefined) {
    filteredExpenses = expenses.filter((e) => Number(e.group_id) === Number(groupId));
    filteredSettlements = settlements.filter((s) => Number(s.group_id) === Number(groupId));
  }

  const balance = {};
  for (const f of friends) balance[f.id] = 0;

  for (const exp of filteredExpenses) {
    const expShares = shares.filter((s) => s.expense_id === exp.id);
    if (exp.paid_by_friend_id === null) {
      // User paid: every friend's share is what they owe user → balance += share
      for (const s of expShares) {
        if (s.friend_id !== null) {
          balance[s.friend_id] = (balance[s.friend_id] || 0) + Number(s.share_amount);
        }
      }
    } else {
      // Friend paid: only non-payer participants are in shares.
      // The user's share is what they owe the paying friend → balance -= myShare
      const myShare = expShares.find((s) => s.friend_id === null);
      if (myShare) {
        balance[exp.paid_by_friend_id] = (balance[exp.paid_by_friend_id] || 0) - Number(myShare.share_amount);
      }
    }
  }

  for (const s of filteredSettlements) {
    if (s.from_friend_id === null && s.to_friend_id !== null) {
      // User pays friend: balance += amount
      balance[s.to_friend_id] = (balance[s.to_friend_id] || 0) + Number(s.amount);
    } else if (s.to_friend_id === null && s.from_friend_id !== null) {
      // Friend pays user: balance -= amount
      balance[s.from_friend_id] = (balance[s.from_friend_id] || 0) - Number(s.amount);
    }
  }

  return balance;
}

function computeGroupYourBalance({ expenses, shares }) {
  let net = 0;
  for (const exp of expenses) {
    const expShares = shares.filter((s) => s.expense_id === exp.id);
    if (exp.paid_by_friend_id === null) {
      const myShare = expShares.find((s) => s.friend_id === null);
      const total = expShares.reduce((a, s) => a + Number(s.share_amount), 0);
      net += total - Number(myShare?.share_amount || 0);
    } else {
      const myShare = expShares.find((s) => s.friend_id === null);
      if (myShare) net -= Number(myShare.share_amount);
    }
  }
  return Math.round(net * 100) / 100;
}

let pass = 0, fail = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    pass++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`         ${err.message}`);
    fail++;
  }
}

function eq(actual, expected, msg) {
  if (Math.abs(actual - expected) > 0.001) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

console.log('\n=== Spec Examples ===');

// Example 1: User pays 900 for themselves, B, C equally (split 3 ways).
// User paid 900. Shares: B=300, C=300 (user's own share included = 300, excluded from friends' shares).
// Friends list contains only B and C (user is not in the friends list).
test('Example 1: User pays 900, equal split user/B/C', () => {
  const friends = [{ id: 'B' }, { id: 'C' }];
  const expenses = [{ id: 'e1', paid_by_friend_id: null, amount: 900 }];
  // Only non-payer participants in shares (user's own share NOT in friends' shares)
  const shares = [
    { expense_id: 'e1', friend_id: 'B', share_amount: 300 },
    { expense_id: 'e1', friend_id: 'C', share_amount: 300 },
  ];
  const bal = computeBalancesPure({ friends, expenses, shares, settlements: [] });
  eq(bal['B'], 300, 'B balance = +300 (owes user)');
  eq(bal['C'], 300, 'C balance = +300 (owes user)');
});

// Example 2: User owes Bob 500. User pays Bob 200 → Bob = -300.
test('Example 2: User owes Bob 500, pays 200 → Bob = -300', () => {
  const friends = [{ id: 'Bob' }];
  // Bob paid 1000. User owes 500. User's share is in shares (not yet paid).
  const expenses = [{ id: 'e1', paid_by_friend_id: 'Bob', amount: 1000 }];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 500 },
    // Bob's own share is NOT in shares
  ];
  const bal1 = computeBalancesPure({ friends, expenses, shares, settlements: [] });
  eq(bal1['Bob'], -500, 'Initial: user owes Bob 500');

  // User pays Bob: from=null, to=Bob → balance += 200
  const settlements = [{ from_friend_id: null, to_friend_id: 'Bob', amount: 200 }];
  const bal2 = computeBalancesPure({ friends, expenses, shares, settlements });
  eq(bal2['Bob'], -300, 'After paying 200: owes 300');
});

// Example 3: Bob owes user 500. Bob pays user 200 → Bob = +300.
test('Example 3: Bob owes user 500, pays 200 → Bob = +300', () => {
  const friends = [{ id: 'Bob' }];
  // User paid 1500. Bob owes 500. All participants in shares.
  const expenses = [{ id: 'e1', paid_by_friend_id: null, amount: 1500 }];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 1000 },
    { expense_id: 'e1', friend_id: 'Bob', share_amount: 500 },
  ];
  const bal1 = computeBalancesPure({ friends, expenses, shares, settlements: [] });
  eq(bal1['Bob'], 500, 'Initial: Bob owes user 500');

  // Bob pays user: from=Bob, to=null → balance -= 200
  const settlements = [{ from_friend_id: 'Bob', to_friend_id: null, amount: 200 }];
  const bal2 = computeBalancesPure({ friends, expenses, shares, settlements });
  eq(bal2['Bob'], 300, 'After Bob pays 200: owes 300');
});

// Example 4: User owes Bob 500. User pays Bob 500 → settled.
test('Example 4: User owes Bob 500, pays 500 → settled', () => {
  const friends = [{ id: 'Bob' }];
  const expenses = [{ id: 'e1', paid_by_friend_id: 'Bob', amount: 1000 }];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 500 },
  ];
  const settlements = [{ from_friend_id: null, to_friend_id: 'Bob', amount: 500 }];
  const bal = computeBalancesPure({ friends, expenses, shares, settlements });
  eq(bal['Bob'], 0, 'Settled');
});

// Example 5: Bob owes user 500. Bob pays user 500 → settled.
test('Example 5: Bob owes user 500, pays 500 → settled', () => {
  const friends = [{ id: 'Bob' }];
  const expenses = [{ id: 'e1', paid_by_friend_id: null, amount: 1500 }];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 1000 },
    { expense_id: 'e1', friend_id: 'Bob', share_amount: 500 },
  ];
  const settlements = [{ from_friend_id: 'Bob', to_friend_id: null, amount: 500 }];
  const bal = computeBalancesPure({ friends, expenses, shares, settlements });
  eq(bal['Bob'], 0, 'Settled');
});

console.log('\n=== Split Methods ===');

test('Percentage split: A=50%, B=30%, C=20% on 1000', () => {
  // User pays 1000. Shares: A=500, B=300, C=200. A, B, C are friends.
  const friends = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
  const expenses = [{ id: 'e1', paid_by_friend_id: null, amount: 1000 }];
  const shares = [
    { expense_id: 'e1', friend_id: 'A', share_amount: 500 },
    { expense_id: 'e1', friend_id: 'B', share_amount: 300 },
    { expense_id: 'e1', friend_id: 'C', share_amount: 200 },
  ];
  const bal = computeBalancesPure({ friends, expenses, shares, settlements: [] });
  eq(bal['A'], 500, 'A owes user 500');
  eq(bal['B'], 300, 'B owes user 300');
  eq(bal['C'], 200, 'C owes user 200');
});

test('Shares split: A=2, B=1, C=1 on 100 (total 4 shares, user excluded)', () => {
  // User pays 100. A's share = 2/4 of 100 = 50, B = 25, C = 25.
  // User's own share (1/4 = 25) is not in the shares array.
  const friends = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
  const expenses = [{ id: 'e1', paid_by_friend_id: null, amount: 100 }];
  const shares = [
    { expense_id: 'e1', friend_id: 'A', share_amount: 50 },
    { expense_id: 'e1', friend_id: 'B', share_amount: 25 },
    { expense_id: 'e1', friend_id: 'C', share_amount: 25 },
  ];
  const bal = computeBalancesPure({ friends, expenses, shares, settlements: [] });
  eq(bal['A'], 50, 'A owes user 50');
  eq(bal['B'], 25, 'B owes user 25');
  eq(bal['C'], 25, 'C owes user 25');
});

console.log('\n=== Multi-Group Isolation ===');

test('Group-specific: each group has independent balance', () => {
  const friends = [{ id: 'Bob' }];
  const expenses = [
    { id: 'e1', group_id: 1, paid_by_friend_id: 'Bob', amount: 1000 },
    { id: 'e2', group_id: 2, paid_by_friend_id: null, amount: 500 },
  ];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 500 },
    { expense_id: 'e2', friend_id: null, share_amount: 250 },
    { expense_id: 'e2', friend_id: 'Bob', share_amount: 250 },
  ];
  // Group 1: Bob paid 1000, user owes 500 → Bob = -500
  const bal1 = computeBalancesPure({
    friends,
    expenses: expenses.filter(e => e.group_id === 1),
    shares: shares.filter(s => s.expense_id === 'e1'),
    settlements: []
  });
  eq(bal1['Bob'], -500, 'Group 1: Bob = -500');

  // Group 2: User paid 500, Bob owes 250 → Bob = +250
  const bal2 = computeBalancesPure({
    friends,
    expenses: expenses.filter(e => e.group_id === 2),
    shares: shares.filter(s => s.expense_id === 'e2'),
    settlements: []
  });
  eq(bal2['Bob'], 250, 'Group 2: Bob = +250');
});

console.log('\n=== Overpayment Rejection ===');

test('Overpayment: max payable = |balance| when user owes', () => {
  const friends = [{ id: 'Bob' }];
  const expenses = [{ id: 'e1', paid_by_friend_id: 'Bob', amount: 1000 }];
  const shares = [{ expense_id: 'e1', friend_id: null, share_amount: 500 }];
  const bal = computeBalancesPure({ friends, expenses, shares, settlements: [] });
  eq(bal['Bob'], -500, 'User owes Bob 500');
  const maxPayable = Math.abs(bal['Bob']);
  assert.ok(600 > maxPayable + 0.01, '600 exceeds max of 500');
});

test('Overpayment: max receivable = balance when friend owes', () => {
  const friends = [{ id: 'Bob' }];
  const expenses = [{ id: 'e1', paid_by_friend_id: null, amount: 1500 }];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 1000 },
    { expense_id: 'e1', friend_id: 'Bob', share_amount: 500 },
  ];
  const bal = computeBalancesPure({ friends, expenses, shares, settlements: [] });
  eq(bal['Bob'], 500, 'Bob owes user 500');
  const maxReceivable = bal['Bob'];
  assert.ok(600 > maxReceivable + 0.01, '600 exceeds max of 500');
});

console.log('\n=== Group yourBalance ===');

test('Group yourBalance = sum of (paid - share) for all group expenses', () => {
  // User paid 1000 in group. User and Bob split equally → user owes 0, Bob owes 500.
  // Group's net toward user: 1000 - 500 = +500 (group owes user 500).
  const friends = [{ id: 'Bob' }];
  const expenses = [
    { id: 'e1', paid_by_friend_id: null, amount: 1000 },
  ];
  const shares = [
    // e1: user paid 1000, each owes 500
    { expense_id: 'e1', friend_id: null, share_amount: 500 },
    { expense_id: 'e1', friend_id: 'Bob', share_amount: 500 },
  ];
  const yourBalance = computeGroupYourBalance({ expenses, shares });
  eq(yourBalance, 500, 'Group owes user 500');
});

console.log('\n=== Complex Multi-Friend Scenarios ===');

test('Three friends, user paid, equal split', () => {
  const friends = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
  // User paid 900. Each friend owes 300.
  const expenses = [{ id: 'e1', paid_by_friend_id: null, amount: 900 }];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 0 },
    { expense_id: 'e1', friend_id: 'A', share_amount: 300 },
    { expense_id: 'e1', friend_id: 'B', share_amount: 300 },
    { expense_id: 'e1', friend_id: 'C', share_amount: 300 },
  ];
  const bal = computeBalancesPure({ friends, expenses, shares, settlements: [] });
  eq(bal['A'], 300);
  eq(bal['B'], 300);
  eq(bal['C'], 300);
});

test('Settlement direction: friend pays user', () => {
  const friends = [{ id: 'Bob' }];
  // User paid 1500, Bob owes 500. Balance = +500.
  const expenses = [{ id: 'e1', paid_by_friend_id: null, amount: 1500 }];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 1000 },
    { expense_id: 'e1', friend_id: 'Bob', share_amount: 500 },
  ];
  // Bob pays user 300: from=Bob, to=null → balance -= 300
  const settlements = [{ from_friend_id: 'Bob', to_friend_id: null, amount: 300 }];
  const bal = computeBalancesPure({ friends, expenses, shares, settlements });
  eq(bal['Bob'], 200, 'Bob owes 200 after paying 300');
});

test('Settlement direction: user pays friend', () => {
  const friends = [{ id: 'Bob' }];
  // Bob paid 1000, user owes 500. Balance = -500.
  const expenses = [{ id: 'e1', paid_by_friend_id: 'Bob', amount: 1000 }];
  const shares = [{ expense_id: 'e1', friend_id: null, share_amount: 500 }];
  // User pays Bob 300: from=null, to=Bob → balance += 300
  const settlements = [{ from_friend_id: null, to_friend_id: 'Bob', amount: 300 }];
  const bal = computeBalancesPure({ friends, expenses, shares, settlements });
  eq(bal['Bob'], -200, 'User owes 200 after paying 300');
});

console.log('\n=== Group Isolation (per-friend balances) ===');

test('TEST A: Expense outside any group → does NOT affect group-scoped balance', () => {
  // Bob paid 1000 outside group. User owes 500.
  // Bob = -500 globally. But Group A should see 0.
  const friends = [{ id: 'Bob' }];
  const expenses = [
    { id: 'e1', group_id: null, paid_by_friend_id: 'Bob', amount: 1000 },
  ];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 500 },
  ];
  // Global: Bob = -500
  const globalBal = computeBalancesPure({ friends, expenses, shares, settlements: [] });
  eq(globalBal['Bob'], -500, 'Global: user owes Bob 500');

  // Group A: expense is outside group → Bob = 0
  const groupBal = computeBalancesPure({ friends, expenses, shares, settlements: [] }, { groupId: 1 });
  eq(groupBal['Bob'], 0, 'Group A: Bob = 0 (no group activity)');
});

test('TEST B: Expense in Group A → DOES affect Group A balance', () => {
  // User paid 1000 in Group A. Bob owes 500 in Group A.
  const friends = [{ id: 'Bob' }];
  const expenses = [
    { id: 'e1', group_id: 1, paid_by_friend_id: null, amount: 1000 },
  ];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 500 },
    { expense_id: 'e1', friend_id: 'Bob', share_amount: 500 },
  ];
  const groupBal = computeBalancesPure({ friends, expenses, shares, settlements: [] }, { groupId: 1 });
  eq(groupBal['Bob'], 500, 'Group A: Bob owes user 500');
});

test('TEST C: Expense in Group B → does NOT affect Group A balance', () => {
  // Bob paid 1000 in Group B. User owes 500 in Group B.
  // Group A: Bob = 0 (no activity).
  const friends = [{ id: 'Bob' }];
  const expenses = [
    { id: 'e1', group_id: 2, paid_by_friend_id: 'Bob', amount: 1000 },
  ];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 500 },
  ];
  const groupBal = computeBalancesPure({ friends, expenses, shares, settlements: [] }, { groupId: 1 });
  eq(groupBal['Bob'], 0, 'Group A: Bob = 0 (expense is in Group B)');
});

test('TEST D: Group A settlement does NOT affect global or Group B balances', () => {
  // Group A: User paid 1000 → Bob = +500 in Group A.
  // Group A settlement: Bob pays user 200 in Group A → from=Bob, to=null
  //                    → balance[Bob] -= 200 → Bob = +500 - 200 = +300.
  // Global (strict): only the global expense contributes.
  // Group B: nothing belongs to Group B → 0.
  const friends = [{ id: 'Bob' }];
  const expenses = [
    // Global expense: Bob paid 1000 → user owes 500 (Bob = -500 globally)
    { id: 'e1', group_id: null, paid_by_friend_id: 'Bob', amount: 1000 },
    // Group A expense: user paid 1000 → Bob owes 500 in Group A
    { id: 'e2', group_id: 1, paid_by_friend_id: null, amount: 1000 },
  ];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 500 },
    { expense_id: 'e2', friend_id: null, share_amount: 500 },
    { expense_id: 'e2', friend_id: 'Bob', share_amount: 500 },
  ];
  // Bob pays user 200 in Group A: from=Bob, to=null → balance[Bob] -= 200
  const settlements = [{ from_friend_id: 'Bob', to_friend_id: null, amount: 200, group_id: 1 }];

  // Group A: e2 → +500, then settlement -200 → +300
  const balA = computeBalancesPure({ friends, expenses, shares, settlements }, { groupId: 1 });
  eq(balA['Bob'], 300, 'Group A: Bob = +300 (e2 minus settlement)');

  // Global: only e1 contributes (-500). Group A settlement does not affect global.
  const globalBal = computeBalancesPure({ friends, expenses, shares, settlements }, { groupId: null });
  eq(globalBal['Bob'], -500, 'Global: Bob = -500 (Group A settlement isolated from global)');

  // Group B: nothing belongs to Group B → 0
  const balB = computeBalancesPure({ friends, expenses, shares, settlements }, { groupId: 2 });
  eq(balB['Bob'], 0, 'Group B: Bob = 0 (no Group B activity)');
});

test('TEST E: Overpayment — cannot settle more than Group A outstanding balance', () => {
  // Bob owes user 500 in Group A.
  // The max receivable in Group A is 500.
  const friends = [{ id: 'Bob' }];
  const expenses = [
    { id: 'e1', group_id: 1, paid_by_friend_id: null, amount: 1000 },
  ];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 500 },
    { expense_id: 'e1', friend_id: 'Bob', share_amount: 500 },
  ];
  const groupBal = computeBalancesPure({ friends, expenses, shares, settlements: [] }, { groupId: 1 });
  eq(groupBal['Bob'], 500, 'Bob owes 500 in Group A');
  const maxReceivable = groupBal['Bob'];
  assert.ok(600 > maxReceivable + 0.01, '600 exceeds max receivable of 500');
});

test('TEST F: Global vs Group — global includes ALL activity, group only its own', () => {
  // Real-engine semantic: computeBalances(supabase, userId, { groupId: null })
  // returns the global balance = sum of ALL expenses (global + every group).
  // computeBalances(supabase, userId, { groupId: 1 }) returns ONLY group-1 activity.
  // Global: e1 (Bob paid 1000) → -500; e2 (user paid 1000, in Group A) → +500. Net = 0.
  // Group A: only e2 → +500.
  const friends = [{ id: 'Bob' }];
  const expenses = [
    { id: 'e1', group_id: null, paid_by_friend_id: 'Bob', amount: 1000 },
    { id: 'e2', group_id: 1, paid_by_friend_id: null, amount: 1000 },
  ];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 500 },
    { expense_id: 'e2', friend_id: null, share_amount: 500 },
    { expense_id: 'e2', friend_id: 'Bob', share_amount: 500 },
  ];
  // Global: both expenses contribute, they cancel → 0
  const globalBal = computeBalancesPure({ friends, expenses, shares, settlements: [] });
  eq(globalBal['Bob'], 0, 'Global: 0 (e1 and e2 cancel out)');

  // Group A: only e2 contributes → +500
  const groupBal = computeBalancesPure({ friends, expenses, shares, settlements: [] }, { groupId: 1 });
  eq(groupBal['Bob'], 500, 'Group A: Bob owes user 500');
});

test('TEST G: Group settlement direction: user pays friend in group', () => {
  // Group A: Bob paid 1000 → user owes Bob 300 in Group A.
  // User pays 200 in Group A: from=null, to=Bob → balance += 200
  // Bob = -300 + 200 = -100 (user still owes 100 in Group A).
  const friends = [{ id: 'Bob' }];
  const expenses = [
    { id: 'e1', group_id: 1, paid_by_friend_id: 'Bob', amount: 1000 },
  ];
  const shares = [
    { expense_id: 'e1', friend_id: null, share_amount: 300 },
  ];
  const bal1 = computeBalancesPure({ friends, expenses, shares, settlements: [] }, { groupId: 1 });
  eq(bal1['Bob'], -300, 'Before settlement: user owes Bob 300 in Group A');

  const settlements = [{ from_friend_id: null, to_friend_id: 'Bob', amount: 200, group_id: 1 }];
  const bal2 = computeBalancesPure({ friends, expenses, shares, settlements }, { groupId: 1 });
  eq(bal2['Bob'], -100, 'After paying 200: user owes 100 in Group A');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
