import supabase from './db-client.js';
import { getUserFromReq, corsHeaders } from './_auth.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { user, error: authErr } = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: authErr });

  try {
    if (req.method === 'GET') {
      let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (error) throw error;
      if (!data) {
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User';
        const insertRes = await supabase.from('profiles').insert({
          id: user.id,
          full_name: fullName,
          email: user.email,
          currency: 'USD',
        }).select().single();
        if (insertRes.error) throw insertRes.error;
        data = insertRes.data;
      }
      return res.status(200).json(data);
    }
    if (req.method === 'PUT') {
      const { full_name, avatar_url, currency, notifications_enabled } = req.body || {};
      const update = {};
      if (full_name !== undefined) update.full_name = full_name;
      if (avatar_url !== undefined) update.avatar_url = avatar_url;
      if (currency !== undefined) update.currency = currency;
      if (notifications_enabled !== undefined) update.notifications_enabled = notifications_enabled;
      const { data, error } = await supabase.from('profiles').update(update).eq('id', user.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
