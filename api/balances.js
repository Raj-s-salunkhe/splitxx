import supabase from './db-client.js';
import { getUserFromReq, corsHeaders } from './_auth.js';
import { computeBalances } from './balance-engine.js';

/**
 * GET /api/balances
 *   → returns GLOBAL per-friend balances for the current user
 *
 * GET /api/balances?group_id=123
 *   → returns GROUP-SPECIFIC per-friend balances (only expenses/settlements
 *     with that group_id contribute to the balance)
 *
 * All balance math is delegated to api/balance-engine.js — the source of truth.
 */
export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { user, error: authErr } = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: authErr });

  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    let groupId = null;
    if (req.query.group_id !== undefined && req.query.group_id !== null && req.query.group_id !== '') {
      groupId = Number(req.query.group_id);
      if (!Number.isFinite(groupId) || groupId <= 0) {
        res.status(400).json({ error: 'Invalid group_id' });
        return;
      }
      // Verify the group belongs to the user before exposing any per-friend data.
      const { data: gc, error: gcErr } = await supabase
        .from('groups')
        .select('id')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (gcErr) throw gcErr;
      if (!gc) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }
    }

    const result = await computeBalances(supabase, user.id, { groupId });

    return res.status(200).json({
      balances: result.balanceList,
      totalOwed: result.totalOwed,
      totalOwe: result.totalOwe,
      netBalance: result.netBalance,
      simplified: result.simplified,
    });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
