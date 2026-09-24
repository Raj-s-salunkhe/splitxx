export function formatCurrency(amount: number, currency = 'USD'): string {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export function formatCurrencyCompact(amount: number, currency = 'USD'): string {
  const n = Number(amount) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const symbol = (() => {
    try {
      const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency }).formatToParts(0);
      return parts.find(p => p.type === 'currency')?.value || '$';
    } catch {
      return '$';
    }
  })();

  if (abs >= 10000000) return `${sign}${symbol}${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}${symbol}${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}${symbol}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${symbol}${abs.toFixed(2)}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-fuchsia-500',
  'bg-orange-500',
  'bg-indigo-500',
  'bg-cyan-500',
];

export function colorForName(name: string | null | undefined): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const diff = (Date.now() - date.getTime()) / 1000;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
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
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { id: 'other', label: 'Other', emoji: '📁' },
];

export function getCategoryEmoji(categoryId: string | null | undefined): string {
  if (!categoryId) return '🧾';
  return CATEGORIES.find(c => c.id === categoryId)?.emoji || '🧾';
}

export function getGroupTypeEmoji(typeId: string | null | undefined): string {
  if (!typeId) return '👥';
  return GROUP_TYPES.find(g => g.id === typeId)?.emoji || '👥';
}
