import { Link } from 'react-router-dom';
import { ArrowRight, Receipt, Users, HandCoins, Shield } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-slate-100 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-slate-900">SplitX</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            Split expenses with friends easily
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Split expenses with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              friends
            </span>{' '}
            made simple
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Track shared expenses, settle balances, and never lose track of who owes what.
            Perfect for trips, roommates, and everyday splitting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Start for free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to split</h2>
            <p className="text-slate-600">Simple, intuitive expense tracking for any situation</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Receipt,
                title: 'Track Expenses',
                description: 'Add expenses in seconds with smart categorization and split options',
              },
              {
                icon: Users,
                title: 'Manage Groups',
                description: 'Create groups for trips, roommates, or any shared expense scenario',
              },
              {
                icon: HandCoins,
                title: 'Settle Up',
                description: 'See exactly who owes what and settle debts with one click',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to start splitting?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Join thousands of people who use SplitX to manage shared expenses.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-slate-900">SplitX</span>
          </div>
          <p className="text-sm text-slate-500">
            Split expenses smartly with friends
          </p>
        </div>
      </footer>
    </div>
  );
}
