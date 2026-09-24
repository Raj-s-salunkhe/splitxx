export interface User {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  currency?: string;
  notifications_enabled?: boolean;
  created_at?: string;
}

export interface Friend {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Group {
  id: string;
  user_id: string;
  name: string;
  type: 'trip' | 'roommates' | 'college' | 'family' | 'other';
  icon?: string;
  created_at: string;
  members?: GroupMember[];
  memberCount?: number;
  yourBalance?: number;
}

export interface GroupMember {
  friend_id: string | null;
  key: string;
  name: string;
  avatar_url?: string;
  net?: number;
}

export interface Expense {
  id: string;
  user_id: string;
  group_id?: string;
  description: string;
  amount: number;
  category?: string;
  paid_by_friend_id: string | null;
  paid_by_name?: string;
  split_type?: 'equal' | 'exact' | 'percentage';
  date: string;
  shares?: ExpenseShare[];
  created_at?: string;
}

export interface ExpenseShare {
  id?: string;
  expense_id: string;
  friend_id: string | null;
  name?: string;
  share_amount: number;
}

export interface Balance {
  friend_id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  balance: number;
}

export interface SimplifiedDebt {
  from_key: string;
  to_key: string;
  from_name: string;
  to_name: string;
  from_friend_id: string | null;
  to_friend_id: string | null;
  amount: number;
}

export interface BalancesResponse {
  balances: Balance[];
  totalOwed: number;
  totalOwe: number;
  netBalance: number;
  simplified: SimplifiedDebt[];
}

export interface Settlement {
  id: string;
  user_id: string;
  group_id?: string;
  from_friend_id: string | null;
  to_friend_id: string | null;
  from_name?: string;
  to_name?: string;
  amount: number;
  note?: string;
  date: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: 'expense' | 'settlement' | 'group_created' | 'friend_added';
  description: string;
  amount?: number;
  created_at: string;
}

export interface GroupDetailResponse {
  group: Group;
  members: GroupMember[];
  expenses: Expense[];
  settlements: Settlement[];
  simplified: SimplifiedDebt[];
  available_friends?: Friend[];
  is_owner?: boolean;
}

export type SplitMethod = 'equal' | 'exact' | 'percentage' | 'shares';

export interface CreateExpensePayload {
  description: string;
  amount: number;
  category?: string;
  paid_by_friend_id?: string | null;
  split_type: SplitMethod;
  date: string;
  group_id?: number | null;
  shares: { friend_id: string | null; share_amount: number }[];
}

export interface CreateGroupPayload {
  name: string;
  type: 'trip' | 'roommates' | 'college' | 'family' | 'other';
  icon?: string;
  member_friend_ids?: string[];
}

export interface CreateSettlementPayload {
  from_friend_id?: string | null;
  to_friend_id?: string | null;
  amount: number;
  note?: string;
  date?: string;
  group_id?: string;
}
