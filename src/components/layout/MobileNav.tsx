import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Scale,
} from 'lucide-react';
import { cn } from '../../utils';

export function MobileNav() {
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/groups', icon: Users, label: 'Groups' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/balances', icon: Scale, label: 'Balances' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-3 px-4 flex-1 transition-colors',
                isActive
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
