import supabase from './db-client.js';

export async function getUserFromReq(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return { user: null, error: 'Unauthorized' };

  // TEMP DIAGNOSTIC: decode JWT header to get project ref (public metadata, not a secret)
  try {
    const h = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const hdr = JSON.parse(Buffer.from(h + '=='.slice(0, (4 - h.length % 4) % 4), 'base64').toString());
    console.error('[auth] Token project ref (c):', hdr?.c);
  } catch (_) {}

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    // Log error code/details — NOT the token value
    console.error('[auth] getUser error message:', error.message);
  }
  if (error || !data?.user) return { user: null, error: 'Invalid token' };
  return { user: data.user, error: null };
}

export function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
