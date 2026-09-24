import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Receipt,
  Scale,
  Activity,
  LogOut,
  Plus,
  X,
} from 'lucide-react';
import { Avatar } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onAddExpense?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose, onAddExpense }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/groups', icon: Users, label: 'Groups' },
    { to: '/friends', icon: UserPlus, label: 'Friends' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/balances', icon: Scale, label: 'Balances' },
    { to: '/activity', icon: Activity, label: 'Activity' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">SplitX</h1>
            <p className="text-xs text-slate-500">Split expenses smartly</p>
          </div>
        </div>
      </div>

      {/* Add Expense Button */}
      <div className="px-4 py-4">
        <button
          onClick={onAddExpense}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl py-2.5 px-4 transition-all duration-150 shadow-md shadow-indigo-200/80 hover:shadow-lg hover:shadow-indigo-200/60 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-100">
        <NavLink
          to="/profile"
          onClick={onMobileClose}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <Avatar name={profile?.full_name} url={profile?.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 mt-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-100 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in"
            onClick={onMobileClose}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 animate-in slide-in-from-left">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <h1 className="text-lg font-bold text-slate-900">SplitX</h1>
              </div>
              <button onClick={onMobileClose} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
