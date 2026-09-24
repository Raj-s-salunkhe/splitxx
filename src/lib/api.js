import supabase from './supabase';

export async function authedFetch(path, options = {}) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error('Could not verify your session. Please sign in again.');
  const token = session?.access_token;
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  if (!res.ok) {
    const message = (body && body.error)
      || (res.status === 404 && path.startsWith('/api/')
        ? `The local API route ${path} was not found. Start the full app with "npm run dev".`
        : `Request failed (${res.status})`);
    throw new Error(message);
  }
  if (body === null) throw new Error('The server returned an invalid response. Please try again.');
  return body;
}

export const EMPTY_BALANCES = Object.freeze({
  balances: [], totalOwed: 0, totalOwe: 0, netBalance: 0, simplified: [],
});

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeBalances(value) {
  if (!value || typeof value !== 'object') return EMPTY_BALANCES;
  return {
    balances: asArray(value.balances),
    totalOwed: Number(value.totalOwed) || 0,
    totalOwe: Number(value.totalOwe) || 0,
    netBalance: Number(value.netBalance) || 0,
    simplified: asArray(value.simplified),
  };
}

export function formatCurrency(amount, currency = 'USD') {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AVATAR_COLORS = [
  'bg-violet-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500',
  'bg-sky-500', 'bg-emerald-500', 'bg-fuchsia-500', 'bg-orange-500',
];

export function colorForName(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const CATEGORIES = [
  { id: 'general', label: 'General', emoji: '🧾' },
  { id: 'food', label: 'Food & Drink', emoji: '🍔' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'housing', label: 'Rent & Housing', emoji: '🏠' },
  { id: 'utilities', label: 'Utilities', emoji: '💡' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'other', label: 'Other', emoji: '📦' },
];

export const GROUP_TYPES = [
  { id: 'trip', label: 'Trip', emoji: '🧳' },
  { id: 'roommates', label: 'Roommates', emoji: '🏡' },
  { id: 'college', label: 'College Friends', emoji: '🎓' },
  { id: 'family', label: 'Family', emoji: '👨\u200d👩\u200d👧\u200d👦' },
  { id: 'other', label: 'Other', emoji: '📁' },
];
