import supabase from './db-client.js';
import { getUserFromReq, corsHeaders } from './_auth.js';
import { computeBalances } from './balance-engine.js';

/**
 * Settlement direction rules (per spec):
 *  - from_friend_id === null  → user is the payer (user pays friend)
 *  - to_friend_id   === null  → user is the receiver (friend pays user)
 *  - amount > 0
 *
 * Effect on balances (sign convention: positive = friend owes you):
 *  - from=null, to=friend  → user pays friend → user's debt to friend is reduced
 *                            → balance[friend] += amount (moves toward 0)
 *  - from=friend, to=null  → friend pays user → friend's debt to user is reduced
 *                            → balance[friend] -= amount (moves toward 0)
 *
 * These effects are computed by api/balance-engine.js and reused here.
 */

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { user, error: authErr } = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: authErr });

  try {
    if (req.method === 'GET') {
      let query = supabase.from('settlements').select('*').eq('user_id', user.id).order('date', { ascending: false }).order('id', { ascending: false });
      if (req.query.group_id) query = query.eq('group_id', Number(req.query.group_id));
      const { data, error } = await query;
      if (error) throw error;

      const { data: friends, error: friendsError } = await supabase.from('friends').select('id, name, avatar_url').eq('user_id', user.id);
      if (friendsError) throw friendsError;
      const safeFriends = Array.isArray(friends) ? friends : [];
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      const nameFor = (fid) => fid === null ? (profile?.full_name || 'You') : (safeFriends.find((f) => f.id === fid)?.name || 'Unknown');
      const result = (Array.isArray(data) ? data : []).map((s) => ({ ...s, from_name: nameFor(s.from_friend_id), to_name: nameFor(s.to_friend_id) }));
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const { from_friend_id, to_friend_id, amount, note, date, group_id } = req.body || {};
      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'A valid amount greater than zero is required' });
      }

      const from = from_friend_id === undefined || from_friend_id === null ? null : from_friend_id;
      const to = to_friend_id === undefined || to_friend_id === null ? null : to_friend_id;
      if (from === to) {
        return res.status(400).json({ error: 'From and To must be different people' });
      }
      // Must involve the user
      if (from !== null && to !== null) {
        return res.status(400).json({ error: 'A settlement must involve you' });
      }

      // Validate that the friend IDs belong to the user
      const friendIds = [from, to].filter((x) => x !== null);
      if (friendIds.length) {
        const { data: friendCheck, error: fcErr } = await supabase
          .from('friends')
          .select('id')
          .eq('user_id', user.id)
          .in('id', friendIds);
        if (fcErr) throw fcErr;
        if ((friendCheck || []).length !== friendIds.length) {
          return res.status(400).json({ error: 'Invalid friend reference' });
        }
      }

      // If a group_id is provided, verify the group belongs to the user
      if (group_id) {
        const { data: gc, error: gcErr } = await supabase
          .from('groups')
          .select('id')
          .eq('id', group_id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (gcErr) throw gcErr;
        if (!gc) return res.status(400).json({ error: 'Invalid group reference' });
      }

      // OVERPAYMENT VALIDATION:
      // Compute current balance for the friend (in overall balances or group-specific balances)
      // and refuse to over-settle.
      try {
        const balances = await computeBalances(supabase, user.id, { groupId: group_id ? Number(group_id) : null });
        const counterpartyId = from === null ? to : from;
        if (counterpartyId !== null) {
          const current = balances.balances[counterpartyId] || 0;
          // Sign convention: positive = friend owes you (you're the creditor)
          // Settlement from you (from=null) paying friend means you're settling what you owe.
          // We only allow this if the current balance is < 0 (i.e. you owe them).
          // Conversely, friend paying you (to=null) only if current balance > 0.
          if (from === null) {
            // You are paying friend. You can only do this if you owe them (current < 0).
            if (current >= -0.01) {
              return res.status(400).json({ error: 'You do not owe this person. Cannot settle.' });
            }
            const maxPayable = Math.abs(current);
            if (numAmount > maxPayable + 0.01) {
              return res.status(400).json({
                error: `Amount exceeds what you owe. Maximum payable: ${maxPayable.toFixed(2)}`,
              });
            }
          } else {
            // Friend is paying you. They can only do this if they owe you (current > 0).
            if (current <= 0.01) {
              return res.status(400).json({ error: 'This person does not owe you. Cannot settle.' });
            }
            const maxReceivable = current;
            if (numAmount > maxReceivable + 0.01) {
              return res.status(400).json({
                error: `Amount exceeds what they owe. Maximum receivable: ${maxReceivable.toFixed(2)}`,
              });
            }
          }
        }
      } catch (balErr) {
        // If balance computation fails, allow the settlement (don't block on transient errors)
        console.error('Balance pre-check failed (non-blocking):', balErr);
      }

      const { data, error } = await supabase.from('settlements').insert({
        user_id: user.id, group_id: group_id || null, from_friend_id: from, to_friend_id: to,
        amount: numAmount, note: note || null, date: date || new Date().toISOString().slice(0, 10),
      }).select().single();
      if (error) throw error;

      const { data: friends, error: friendsError } = await supabase.from('friends').select('id, name').eq('user_id', user.id);
      if (friendsError) throw friendsError;
      const safeFriends = Array.isArray(friends) ? friends : [];
      const nameFor = (fid) => fid === null ? 'You' : (safeFriends.find((f) => f.id === fid)?.name || 'Unknown');
      await supabase.from('activity').insert({
        user_id: user.id, type: 'settlement',
        description: `${nameFor(from)} paid ${nameFor(to)} ${numAmount.toFixed(2)}`,
        amount: numAmount,
      });

      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('settlements').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
