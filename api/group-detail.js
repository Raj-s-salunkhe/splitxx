import supabase from './db-client.js';
import { getUserFromReq, corsHeaders } from './_auth.js';

function simplifyDebts(netByPerson) {
  const creditors = [];
  const debtors = [];
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
    transfers.push({ from: debtors[i].key, to: creditors[j].key, amount: Math.round(pay * 100) / 100 });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }
  return transfers;
}

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { user, error: authErr } = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: authErr });

  try {
    const groupId = Number(req.query.id || (req.body && req.body.group_id));
    if (!groupId) return res.status(400).json({ error: 'group_id is required' });

    if (req.method === 'GET') {
      const { data: group, error: gErr } = await supabase.from('groups').select('*').eq('id', groupId).eq('user_id', user.id).maybeSingle();
      if (gErr) throw gErr;
      if (!group) return res.status(404).json({ error: 'Group not found' });

      const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle();
      const { data: memberRows, error: membersError } = await supabase.from('group_members').select('*').eq('group_id', groupId);
      if (membersError) throw membersError;
      const safeMemberRows = Array.isArray(memberRows) ? memberRows : [];
      const friendIds = safeMemberRows.filter((m) => m.friend_id !== null).map((m) => m.friend_id);
      let friends = [];
      if (friendIds.length) {
        const { data, error: friendsError } = await supabase.from('friends').select('*').in('id', friendIds);
        if (friendsError) throw friendsError;
        friends = data || [];
      }
      const nameFor = (friendId) => friendId === null ? (profile?.full_name || 'You') : (friends.find((f) => f.id === friendId)?.name || 'Unknown');
      const avatarFor = (friendId) => friendId === null ? (profile?.avatar_url || null) : (friends.find((f) => f.id === friendId)?.avatar_url || null);
      const keyFor = (friendId) => friendId === null ? 'you' : `f${friendId}`;

      const members = safeMemberRows.map((m) => ({ friend_id: m.friend_id, key: keyFor(m.friend_id), name: nameFor(m.friend_id), avatar_url: avatarFor(m.friend_id) }));

      const { data: expenses, error: eErr } = await supabase.from('expenses').select('*').eq('group_id', groupId).order('date', { ascending: false }).order('id', { ascending: false });
      if (eErr) throw eErr;
      const safeExpenses = Array.isArray(expenses) ? expenses : [];
      const expenseIds = safeExpenses.map((e) => e.id);
      let shares = [];
      if (expenseIds.length) {
        const { data } = await supabase.from('expense_shares').select('*').in('expense_id', expenseIds);
        shares = data || [];
      }
      const expensesWithShares = safeExpenses.map((e) => ({
        ...e,
        paid_by_name: nameFor(e.paid_by_friend_id),
        shares: shares.filter((s) => s.expense_id === e.id).map((s) => ({ ...s, name: nameFor(s.friend_id) })),
      }));

      const { data: settlements, error: sErr } = await supabase.from('settlements').select('*').eq('group_id', groupId).order('date', { ascending: false });
      if (sErr) throw sErr;
      const safeSettlements = Array.isArray(settlements) ? settlements : [];
      const settlementsWithNames = safeSettlements.map((s) => ({ ...s, from_name: nameFor(s.from_friend_id), to_name: nameFor(s.to_friend_id) }));

      const net = {};
      for (const m of members) net[m.key] = 0;
      for (const e of safeExpenses) {
        net[keyFor(e.paid_by_friend_id)] = (net[keyFor(e.paid_by_friend_id)] || 0) + Number(e.amount);
        for (const s of shares.filter((sh) => sh.expense_id === e.id)) {
          net[keyFor(s.friend_id)] = (net[keyFor(s.friend_id)] || 0) - Number(s.share_amount);
        }
      }
      for (const s of safeSettlements) {
        // Convention: from paid, to received.
        // Payer's net decreases (they paid out), receiver's net increases (they received).
        net[keyFor(s.from_friend_id)] = (net[keyFor(s.from_friend_id)] || 0) - Number(s.amount);
        net[keyFor(s.to_friend_id)] = (net[keyFor(s.to_friend_id)] || 0) + Number(s.amount);
      }
      const memberNets = members.map((m) => ({ ...m, net: Math.round((net[m.key] || 0) * 100) / 100 }));
      const transfersRaw = simplifyDebts(net);
      const keyToMember = Object.fromEntries(members.map((m) => [m.key, m]));
      const simplified = transfersRaw.map((t) => ({
        from_key: t.from, to_key: t.to,
        from_name: keyToMember[t.from]?.name || 'Unknown',
        to_name: keyToMember[t.to]?.name || 'Unknown',
        from_friend_id: keyToMember[t.from]?.friend_id ?? null,
        to_friend_id: keyToMember[t.to]?.friend_id ?? null,
        amount: t.amount,
      }));

      // Get all user's friends for the "add members" modal (exclude already-members)
      const { data: allFriends, error: allFriendsErr } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (allFriendsErr) throw allFriendsErr;

      const memberFriendIds = new Set(safeMemberRows.filter((m) => m.friend_id !== null).map((m) => m.friend_id));
      const availableFriends = (allFriends || []).map((f) => ({
        ...f,
        is_member: memberFriendIds.has(f.id),
      }));

      return res.status(200).json({
        group,
        members: memberNets,
        expenses: expensesWithShares,
        settlements: settlementsWithNames,
        simplified,
        available_friends: availableFriends,
        is_owner: true,
      });
    }

    if (req.method === 'POST') {
      // add member(s) to group
      const { friend_ids } = req.body || {};
      const friendIds = Array.isArray(friend_ids) ? friend_ids : [];
      if (!friendIds.length) return res.status(400).json({ error: 'friend_ids required' });

      // Verify the group belongs to the user
      const { data: ownerCheck, error: ownErr } = await supabase
        .from('groups')
        .select('id')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (ownErr) throw ownErr;
      if (!ownerCheck) return res.status(403).json({ error: 'Not authorized' });

      // Get existing memberships to avoid duplicates
      const { data: existing, error: existingErr } = await supabase
        .from('group_members')
        .select('friend_id')
        .eq('group_id', groupId);
      if (existingErr) throw existingErr;
      const existingIds = new Set((existing || []).map((m) => m.friend_id));
      const newFriendIds = friendIds.filter((fid) => !existingIds.has(fid));

      if (!newFriendIds.length) {
        return res.status(200).json({ ok: true, added: 0, skipped: friendIds.length });
      }

      const rows = newFriendIds.map((fid) => ({ group_id: groupId, friend_id: fid }));
      const { error } = await supabase.from('group_members').insert(rows);
      if (error) throw error;
      return res.status(201).json({ ok: true, added: newFriendIds.length, skipped: friendIds.length - newFriendIds.length });
    }

    if (req.method === 'DELETE') {
      // Remove a member from the group (only if no expense_shares/expenses/settlements reference this friend in the group)
      const { friend_id } = req.body || {};
      if (friend_id === undefined) return res.status(400).json({ error: 'friend_id required' });

      // Verify ownership
      const { data: ownerCheck, error: ownErr } = await supabase
        .from('groups')
        .select('id')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (ownErr) throw ownErr;
      if (!ownerCheck) return res.status(403).json({ error: 'Not authorized' });

      // Never allow removing the user (friend_id = null)
      if (friend_id === null) {
        return res.status(400).json({ error: 'Cannot remove yourself' });
      }

      // Check if friend has any activity in this group
      const { data: exps } = await supabase
        .from('expenses')
        .select('id')
        .eq('group_id', groupId);
      const expIds = (exps || []).map((e) => e.id);
      let conflictingShares = 0;
      if (expIds.length) {
        const { count } = await supabase
          .from('expense_shares')
          .select('id', { count: 'exact', head: true })
          .eq('friend_id', friend_id)
          .in('expense_id', expIds);
        conflictingShares = count || 0;
      }
      const { count: paidCount } = await supabase
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('paid_by_friend_id', friend_id);
      const { count: settleCount } = await supabase
        .from('settlements')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .or(`from_friend_id.eq.${friend_id},to_friend_id.eq.${friend_id}`);

      if (conflictingShares > 0 || (paidCount || 0) > 0 || (settleCount || 0) > 0) {
        return res.status(400).json({
          error: 'Cannot remove member: they have expenses or settlements in this group',
        });
      }

      const { error: delErr } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('friend_id', friend_id);
      if (delErr) throw delErr;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
