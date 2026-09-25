import supabase from '../lib/supabase';
import type {
  User,
  Friend,
  FriendRequest,
  Group,
  Expense,
  BalancesResponse,
  Settlement,
  Activity,
  GroupDetailResponse,
  CreateExpensePayload,
  CreateGroupPayload,
  CreateSettlementPayload,
} from '../types';

const BASE_URL = '';

async function authedFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const token = session.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers)) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (!res.ok) {
      const message = body?.error || `Request failed (${res.status})`;
      throw new Error(message);
    }

    return body as T;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Could not reach the server. Check your connection.');
  }
}

// Profile API
export const profileApi = {
  get: () => authedFetch<User>('/api/profile'),
  update: (data: Partial<User>) => authedFetch<User>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Groups API
export const groupsApi = {
  get: () => authedFetch<Group[]>('/api/groups'),
  create: (data: CreateGroupPayload) => authedFetch<Group>('/api/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => authedFetch<{ ok: boolean }>('/api/groups', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
  getDetail: (id: string) => authedFetch<GroupDetailResponse>(`/api/group-detail?id=${id}`),
  addMembers: (groupId: string, friendIds: string[]) => authedFetch<{ ok: boolean; added?: number; skipped?: number }>(`/api/group-detail?id=${groupId}`, {
    method: 'POST',
    body: JSON.stringify({ friend_ids: friendIds }),
  }),
  removeMember: (groupId: string, friendId: string) => authedFetch<{ ok: boolean }>(`/api/group-detail?id=${groupId}`, {
    method: 'DELETE',
    body: JSON.stringify({ friend_id: friendId }),
  }),
};

// Friends API
export const friendsApi = {
  get: () => authedFetch<Friend[]>('/api/friends'),
  create: (data: { name: string; email?: string }) => authedFetch<Friend>('/api/friends', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => authedFetch<{ ok: boolean }>('/api/friends', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
};

// Friend Requests API
export const friendRequestsApi = {
  get: (direction: 'incoming' | 'outgoing') =>
    authedFetch<FriendRequest[]>(`/api/friend-requests?direction=${direction}`),
  create: (data: { addressee_id: string }) => authedFetch<FriendRequest>('/api/friend-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, status: 'accepted' | 'rejected') =>
    authedFetch<FriendRequest>(`/api/friend-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  cancel: (id: string) => authedFetch<{ ok: boolean }>(`/api/friend-requests/${id}`, {
    method: 'DELETE',
  }),
};

// Search users API
export const searchApi = {
  byEmail: (email: string) => authedFetch<User>(`/api/search-users?email=${encodeURIComponent(email)}`),
};

// Expenses API
export const expensesApi = {
  get: (groupId?: string, limit?: number) => {
    let path = '/api/expenses';
    const params = new URLSearchParams();
    if (groupId) params.set('group_id', groupId);
    if (limit) params.set('limit', limit.toString());
    const query = params.toString();
    if (query) path += `?${query}`;
    return authedFetch<Expense[]>(path);
  },
  create: (data: CreateExpensePayload) => authedFetch<Expense>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => authedFetch<{ ok: boolean }>('/api/expenses', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
};

// Balances API
// Pass groupId to get group-scoped balances instead of global balances.
export const balancesApi = {
  get: (groupId?: string) => {
    const params = new URLSearchParams();
    if (groupId) params.set('group_id', groupId);
    const query = params.toString();
    return authedFetch<BalancesResponse>(`/api/balances${query ? `?${query}` : ''}`);
  },
};

// Settlements API
export const settlementsApi = {
  get: (groupId?: string) => {
    let path = '/api/settlements';
    if (groupId) path += `?group_id=${groupId}`;
    return authedFetch<Settlement[]>(path);
  },
  create: (data: CreateSettlementPayload) => authedFetch<Settlement>('/api/settlements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => authedFetch<{ ok: boolean }>('/api/settlements', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
};

// Activity API
export const activityApi = {
  get: (limit?: number) => {
    let path = '/api/activity';
    if (limit) path += `?limit=${limit}`;
    return authedFetch<Activity[]>(path);
  },
};
