import supabase from './db-client.js';
import { getUserFromReq, corsHeaders } from './_auth.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { user, error: authErr } = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: authErr });

  try {
    if (req.method === 'GET') {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const { data, error } = await supabase.from('activity').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return res.status(200).json(Array.isArray(data) ? data : []);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
