import supabase from './db-client.js';
import { getUserFromReq, corsHeaders } from './_auth.js';

async function computeYourBalanceForGroup(groupId, userId) {
  // Sign convention: positive = group owes you, negative = you owe the group.
  // Model: yourBalance = sum of (expenses_paid - your_share) + settlements_you_made.
  // Uses the same per-person balance convention as balance-engine.js.
  const { data: expenses } = await supabase.from('expenses').select('id, paid_by_friend_id').eq('group_id', groupId);
  const expenseIds = (expenses || []).map((e) => e.id);
  let shares = [];
  if (expenseIds.length) {
    const { data } = await supabase.from('expense_shares').select('*').in('expense_id', expenseIds);
    shares = data || [];
  }
  const { data: settlements } = await supabase.from('settlements').select('*').eq('group_id', groupId).eq('user_id', userId);

  let net = 0;
  for (const exp of expenses || []) {
    if (exp.paid_by_friend_id === null) {
      // User paid: net += (total - user's share) = what group owes user
      const myShare = shares.find((s) => s.expense_id === exp.id && s.friend_id === null);
      const total = shares.filter((s) => s.expense_id === exp.id).reduce((a, s) => a + Number(s.share_amount), 0);
      net += total - Number(myShare?.share_amount || 0);
    } else {
      // Friend paid: user's share is owed to the friend → net decreases
      const myShare = shares.find((s) => s.expense_id === exp.id && s.friend_id === null);
      if (myShare) net -= Number(myShare.share_amount);
    }
  }
  // Settlements using the per-person balance convention:
  // from=null, to=friend (user pays friend): yourBalance += amount
  // from=friend, to=null (friend pays user): yourBalance -= amount
  for (const s of settlements || []) {
    if (s.from_friend_id === null && s.to_friend_id !== null) {
      net += Number(s.amount); // user paid → group owes you more
    } else if (s.to_friend_id === null && s.from_friend_id !== null) {
      net -= Number(s.amount); // friend paid → group owes you less
    }
  }
  return Math.round(net * 100) / 100;
}

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { user, error: authErr } = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: authErr });

  try {
    if (req.method === 'GET') {
      const { data: groups, error } = await supabase.from('groups').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;

      const safeGroups = Array.isArray(groups) ? groups : [];
      const groupIds = safeGroups.map((g) => g.id);
      let members = [];
      if (groupIds.length) {
        const { data } = await supabase.from('group_members').select('*').in('group_id', groupIds);
        members = data || [];
      }
      const { data: friends, error: friendsError } = await supabase.from('friends').select('*').eq('user_id', user.id);
      if (friendsError) throw friendsError;

      const enriched = await Promise.all(safeGroups.map(async (g) => {
        const groupMembers = members.filter((m) => m.group_id === g.id).map((m) => {
          if (m.friend_id === null) return { id: 'you', friend_id: null, name: 'You', avatar_url: null };
          const f = (friends || []).find((fr) => fr.id === m.friend_id);
          return { id: m.friend_id, friend_id: m.friend_id, name: f?.name || 'Unknown', avatar_url: f?.avatar_url || null };
        });
        const yourBalance = await computeYourBalanceForGroup(g.id, user.id);
        return { ...g, members: groupMembers, memberCount: groupMembers.length, yourBalance };
      }));

      return res.status(200).json(enriched);
    }

    if (req.method === 'POST') {
      const { name, type, icon, member_friend_ids } = req.body || {};
      if (!name || !name.trim()) return res.status(400).json({ error: 'Group name is required' });
      const { data: group, error } = await supabase.from('groups').insert({
        user_id: user.id, name: name.trim(), type: type || 'other', icon: icon || '👥',
      }).select().single();
      if (error) throw error;

      const memberRows = [{ group_id: group.id, friend_id: null }];
      for (const fid of (Array.isArray(member_friend_ids) ? member_friend_ids : [])) {
        memberRows.push({ group_id: group.id, friend_id: fid });
      }
      const { error: memErr } = await supabase.from('group_members').insert(memberRows);
      if (memErr) throw memErr;

      await supabase.from('activity').insert({
        user_id: user.id, type: 'group_created', description: `You created the group "${name.trim()}"`, amount: null,
      });

      return res.status(201).json(group);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      // Verify ownership first - only owner can delete
      const { data: ownerCheck, error: ownErr } = await supabase
        .from('groups')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (ownErr) throw ownErr;
      if (!ownerCheck) return res.status(403).json({ error: 'Not authorized to delete this group' });

      // Check if any expenses/settlements exist
      const { data: exps } = await supabase.from('expenses').select('id').eq('group_id', id);
      const expIds = (exps || []).map((e) => e.id);
      const { data: settlements } = await supabase.from('settlements').select('id').eq('group_id', id);

      if (expIds.length || (settlements || []).length) {
        // Group has financial records - do a safe deletion that preserves them
        // Remove only group memberships, then the group itself.
        // We do NOT delete the expenses/settlements so the user's other totals are preserved.
        await supabase.from('group_members').delete().eq('group_id', id);
        const { error } = await supabase.from('groups').delete().eq('id', id).eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Empty group - safe to remove everything
        await supabase.from('group_members').delete().eq('group_id', id);
        const { error } = await supabase.from('groups').delete().eq('id', id).eq('user_id', user.id);
        if (error) throw error;
      }
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
