import supabase from './db-client.js';
import { getUserFromReq, corsHeaders } from './_auth.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { user, error: authErr } = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: authErr });

  try {
    if (req.method === 'GET') {
      let query = supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }).order('id', { ascending: false });
      if (req.query.group_id) query = query.eq('group_id', Number(req.query.group_id));
      if (req.query.limit) query = query.limit(Number(req.query.limit));
      const { data: expenses, error } = await query;
      if (error) throw error;
      const safeExpenses = Array.isArray(expenses) ? expenses : [];
      const ids = safeExpenses.map((e) => e.id);
      let shares = [];
      if (ids.length) {
        const { data } = await supabase.from('expense_shares').select('*').in('expense_id', ids);
        shares = data || [];
      }
      const { data: friends, error: friendsError } = await supabase.from('friends').select('id, name, avatar_url').eq('user_id', user.id);
      if (friendsError) throw friendsError;
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      const safeFriends = Array.isArray(friends) ? friends : [];
      const nameFor = (fid) => fid === null ? (profile?.full_name || 'You') : (safeFriends.find((f) => f.id === fid)?.name || 'Unknown');
      const result = safeExpenses.map((e) => ({
        ...e,
        paid_by_name: nameFor(e.paid_by_friend_id),
        shares: shares.filter((s) => s.expense_id === e.id).map((s) => ({ ...s, name: nameFor(s.friend_id) })),
      }));
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const { description, amount, category, paid_by_friend_id, split_type, date, group_id, shares } = req.body || {};
      if (!description || !amount || !Array.isArray(shares) || !shares.length) {
        return res.status(400).json({ error: 'description, amount and shares are required' });
      }
      const totalShares = shares.reduce((a, s) => a + Number(s.share_amount), 0);
      if (Math.abs(totalShares - Number(amount)) > 0.05) {
        return res.status(400).json({ error: 'Shares must add up to the total amount' });
      }
      const { data: expense, error } = await supabase.from('expenses').insert({
        user_id: user.id,
        group_id: group_id || null,
        description: description.trim(),
        amount: Number(amount),
        category: category || 'general',
        paid_by_friend_id: paid_by_friend_id === undefined ? null : paid_by_friend_id,
        split_type: split_type || 'equal',
        date: date || new Date().toISOString().slice(0, 10),
      }).select().single();
      if (error) throw error;

      const shareRows = shares.map((s) => ({ expense_id: expense.id, friend_id: s.friend_id === undefined ? null : s.friend_id, share_amount: Number(s.share_amount) }));
      const { error: shareErr } = await supabase.from('expense_shares').insert(shareRows);
      if (shareErr) throw shareErr;

      await supabase.from('activity').insert({
        user_id: user.id,
        type: 'expense',
        description: `${description.trim()} — ${Number(amount).toFixed(2)}`,
        amount: Number(amount),
      });

      return res.status(201).json(expense);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await supabase.from('expense_shares').delete().eq('expense_id', id);
      const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
