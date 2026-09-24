import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Layers, Scale, Activity as ActivityIcon, Settings, Plus, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { authedFetch } from '../lib/api';
import supabase from '../lib/supabase';
import Avatar from './Avatar';
import AddExpenseModal from './AddExpenseModal';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/groups', label: 'Groups', icon: Layers },
  { to: '/balances', label: 'Balances', icon: Scale },
  { to: '/activity', label: 'Activity', icon: ActivityIcon },
];

export default function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { expenseModal, openAddExpense, closeAddExpense, bumpRefresh } = useModal();
  const [profile, setProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    authedFetch('/api/profile').then(setProfile).catch(() => {});
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-slate-900 text-slate-300 min-h-screen sticky top-0">
        <div className="px-6 py-6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center font-bold text-white text-sm">S</div>
          <span className="text-white font-semibold text-lg tracking-tight">SplitMate</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`
            }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-3">
          <button onClick={() => openAddExpense()} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl py-2.5 transition">
            <Plus size={16} /> Add expense
          </button>
        </div>
        <div className="border-t border-white/10 px-3 py-3 space-y-1">
          <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Settings size={18} /> Settings
          </NavLink>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition">
            <LogOut size={18} /> Log out
          </button>
          <NavLink to="/profile" className="flex items-center gap-2.5 px-2 pt-2">
            <Avatar name={profile?.full_name || user?.email} url={profile?.avatar_url} size="sm" />
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">{profile?.full_name || 'Your account'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs">S</div>
          <span className="font-semibold text-slate-900">SplitMate</span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="text-slate-500"><Menu size={22} /></button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold text-slate-900">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-slate-50">
              <Avatar name={profile?.full_name || user?.email} url={profile?.avatar_url} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name || 'Your account'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <nav className="space-y-1">
              {[...NAV_ITEMS, { to: '/profile', label: 'Settings', icon: Settings }].map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
                <LogOut size={18} /> Log out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
      <button onClick={() => openAddExpense()} className="lg:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center active:scale-95 transition">
        <Plus size={24} />
      </button>

      <main className="flex-1 min-w-0 pt-14 pb-20 lg:pt-0 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {expenseModal.open && (
        <AddExpenseModal groupId={expenseModal.groupId} onClose={closeAddExpense} onCreated={bumpRefresh} />
      )}
    </div>
  );
}
