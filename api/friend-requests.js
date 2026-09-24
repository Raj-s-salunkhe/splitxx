import supabase from './db-client.js';
import { getUserFromReq, corsHeaders } from './_auth.js';

const ALLOWED_STATUSES = ['pending', 'accepted', 'rejected'];

function getPath(req) {
  try {
    return new URL(req.url, 'http://localhost').pathname;
  } catch (_) {
    return '/api/friend-requests';
  }
}

function getSegments(req) {
  const pathname = getPath(req);
  const parts = pathname.split('/').filter(Boolean);
  return parts.slice(1);
}

async function getProfile(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getFriendRequest(id) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, requester_id, addressee_id, status, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Ensures a friend row exists for the given user with the target profile's info.
 * Checks for existing friend row by user_id AND email (if present) to avoid duplicates.
 * Returns the existing or newly created friend row.
 */
async function ensureFriendRow(userId, profile) {
  if (!profile) return null;

  // Build query to find existing friend by user_id and identifying info
  let query = supabase.from('friends').select('id').eq('user_id', userId);

  // Only match by email (names are not unique; name-based matching is unsafe)
  if (profile.email) {
    query = query.eq('email', profile.email);
  } else {
    return null;
  }

  const { data: existing, error: err } = await query.maybeSingle();

  if (err) throw err;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('friends')
    .insert({
      user_id: userId,
      name: profile.full_name || profile.email?.split('@')[0] || 'Friend',
      email: profile.email || null,
      avatar_url: profile.avatar_url || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export default async function handler(req, res) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { user, error: authErr } = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: authErr });

  try {
    const segments = getSegments(req);
    const direction = new URL(req.url, 'http://localhost').searchParams.get('direction');

    if (req.method === 'POST' && segments.length === 0) {
      const body = req.body || {};
      const addresseeId = body.addressee_id;

      if (!addresseeId) {
        return res.status(400).json({ error: 'addressee_id is required' });
      }

      if (addresseeId === user.id) {
        return res.status(400).json({ error: 'Cannot request yourself' });
      }

      const addressee = await getProfile(addresseeId);
      if (!addressee) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check for duplicate pending request in same direction
      const duplicateSame = await supabase
        .from('friend_requests')
        .select('id')
        .eq('requester_id', user.id)
        .eq('addressee_id', addresseeId)
        .eq('status', 'pending')
        .maybeSingle();

      if (duplicateSame) {
        return res.status(409).json({ error: 'A pending request already exists' });
      }

      // Check for pending request in reverse direction (B already requested A)
      const duplicateReverse = await supabase
        .from('friend_requests')
        .select('id')
        .eq('requester_id', addresseeId)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (duplicateReverse) {
        return res.status(409).json({ error: 'This user has already sent you a pending request' });
      }

      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending',
        })
        .select('id, requester_id, addressee_id, status, created_at, updated_at')
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    }

    if (req.method === 'GET' && segments.length === 0) {
      if (direction !== 'incoming' && direction !== 'outgoing') {
        return res.status(400).json({ error: 'direction must be incoming or outgoing' });
      }

      const isIncoming = direction === 'incoming';
      const query = supabase
        .from('friend_requests')
        .select('id, requester_id, addressee_id, status, created_at, updated_at')
        .eq('status', 'pending')
        .eq(isIncoming ? 'addressee_id' : 'requester_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const safeFriends = Array.isArray(data) ? data : [];
      const profileIds = safeFriends.map((request) =>
        isIncoming ? request.requester_id : request.addressee_id
      );
      const profiles = await Promise.all(profileIds.map((id) => getProfile(id)));

      return res.status(200).json(safeFriends.map((request, index) => ({
        ...request,
        profile: profiles[index],
      })));
    }

    if (req.method === 'PATCH' && segments.length === 1) {
      const request = await getFriendRequest(segments[0]);
      if (!request) {
        return res.status(404).json({ error: 'Friend request not found' });
      }

      if (request.addressee_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized to accept this request' });
      }

      if (request.status !== 'pending') {
        return res.status(409).json({ error: 'Only pending requests can be accepted or rejected' });
      }

      const body = req.body || {};
      const status = body.status;

      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'status must be pending, accepted, or rejected' });
      }

      if (status === 'accepted') {
        const requester = await getProfile(request.requester_id);
        const addressee = await getProfile(user.id);

        await Promise.all([
          ensureFriendRow(request.requester_id, requester),
          ensureFriendRow(user.id, addressee),
        ]);
      }

      const { data, error } = await supabase
        .from('friend_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', request.id)
        .eq('status', 'pending')
        .select('id, requester_id, addressee_id, status, created_at, updated_at')
        .single();

      if (error) throw error;

      return res.status(200).json(data);
    }

    if (req.method === 'DELETE' && segments.length === 1) {
      const request = await getFriendRequest(segments[0]);
      if (!request) {
        return res.status(404).json({ error: 'Friend request not found' });
      }

      if (request.requester_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized to cancel this request' });
      }

      if (request.status !== 'pending') {
        return res.status(409).json({ error: 'Only pending requests can be cancelled' });
      }

      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', request.id)
        .eq('status', 'pending');

      if (error) throw error;

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}