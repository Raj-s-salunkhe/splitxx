import supabase from './db-client.js';
import { getUserFromReq, corsHeaders } from './_auth.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { user, error: authErr } = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: authErr });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('friends').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(Array.isArray(data) ? data : []);
    }
    if (req.method === 'POST') {
      const { name, email } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
      const { data, error } = await supabase.from('friends').insert({
        user_id: user.id, name: name.trim(), email: email?.trim() || null,
      }).select().single();
      if (error) throw error;
      await supabase.from('activity').insert({
        user_id: user.id, type: 'friend_added', description: `You added ${name.trim()} as a friend`, amount: null,
      });
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('friends').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
