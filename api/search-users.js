import supabase from './db-client.js';
import { getUserFromReq, corsHeaders } from './_auth.js';

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { user, error: authErr } = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: authErr });

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      const email = url.searchParams.get('email');

      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'email query parameter is required' });
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        return res.status(404).json({ error: 'User not found', email: email.trim() });
      }

      // Don't return yourself
      if (profile.id === user.id) {
        return res.status(400).json({ error: 'Cannot search for yourself' });
      }

      return res.status(200).json(profile);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}