import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Globe, Bell, Shield, ChevronRight } from 'lucide-react';
import { Card, Button, Select, Input, ConfirmDialog } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { profileApi } from '../../services/api';
import { formatCurrency, initials, colorForName, cn } from '../../utils';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
];

export default function Profile() {
  const { profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setCurrency(profile.currency || 'USD');
      setNotifications(profile.notifications_enabled !== false);
    }
  }, [profile]);

  async function handleSave() {
    if (!name.trim()) {
      showError('Name is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await profileApi.update({
        full_name: name.trim(),
        currency,
        notifications_enabled: notifications
      });
      await refreshProfile();
      showSuccess('Settings saved!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await signOut();
    navigate('/login');
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);
  const avatarColor = colorForName(name || profile?.email || 'U');
  const avatarInitials = initials(name || profile?.email || 'User');

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-4 bg-gradient-to-r from-indigo-50/50 to-white">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm flex-shrink-0',
            avatarColor
          )}>
            {avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{name || 'User'}</h2>
            <p className="text-sm text-slate-500 truncate">{profile?.email}</p>
          </div>
        </div>
        <div className="p-5 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Display name
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              Currency
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CURRENCIES.slice(0, 8).map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                    currency === c.code
                      ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <span className="text-lg font-bold text-slate-900 w-8 text-center">{c.symbol}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.code}</p>
                    <p className="text-xs text-slate-500 truncate">{c.name}</p>
                  </div>
                  {currency === c.code && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Display currency for amounts. Existing expenses are not converted.
            </p>
          </div>

          {/* Notifications */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-400" />
              Notifications
            </label>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">Push notifications</p>
                  <p className="text-xs text-slate-500">Alerts for expenses and settlements</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                  notifications ? 'bg-indigo-600' : 'bg-slate-200'
                )}
                aria-label="Toggle notifications"
              >
                <span className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                  notifications ? 'left-5' : 'left-0.5'
                )} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">{error}</p>
          )}

          {/* Save */}
          <Button onClick={handleSave} loading={saving} className="w-full" icon={undefined}>
            Save changes
          </Button>
        </div>
      </Card>

      {/* Account */}
      <Card>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800">Account</h3>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-900 truncate">{profile?.email}</p>
            </div>
          </div>

          <Button
            variant="danger"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full"
            icon={LogOut}
          >
            Sign out
          </Button>
        </div>
      </Card>

      {/* Logout confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign out?"
        description="You'll need to sign back in to access your account."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        variant="danger"
      />
    </div>
  );
}
