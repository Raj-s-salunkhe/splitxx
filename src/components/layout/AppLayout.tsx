import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { AddExpenseModal } from '../modals/AddExpenseModal';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex bg-slate-50">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        onAddExpense={() => setAddExpenseOpen(true)}
      />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 flex items-center px-4">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-slate-900">SplitX</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-14 md:pt-0 pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6">
          <Outlet />
        </div>
      </main>

      <MobileNav />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
      />
    </div>
  );
}
