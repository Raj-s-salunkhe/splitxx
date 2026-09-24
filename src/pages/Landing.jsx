import { Link } from 'react-router-dom';
import { ArrowRight, Users, Scale, HandCoins, Layers, Check, Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-sm">S</div>
          <span className="font-semibold text-lg tracking-tight">SplitMate</span>
        </div>
        <nav className="hidden sm:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#how" className="hover:text-slate-900">How it works</a>
          <a href="#groups" className="hover:text-slate-900">Use cases</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Log in</Link>
          <Link to="/signup" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-full transition">Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Sparkles size={13} /> Group money, made simple
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Split expenses.<br /><span className="text-indigo-600">Settle up.</span> Stay friends.
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-md">
            SplitMate keeps track of who paid for what across trips, roommates, and
            friend groups — so you always know exactly who owes whom, down to the cent.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-full transition">
              Create your account <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium px-6 py-3 rounded-full transition">
              I already have an account
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-1.5"><Check size={15} className="text-emerald-500" /> Free to use</div>
            <div className="flex items-center gap-1.5"><Check size={15} className="text-emerald-500" /> No credit card</div>
            <div className="flex items-center gap-1.5"><Check size={15} className="text-emerald-500" /> Set up in minutes</div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-8 bg-gradient-to-tr from-indigo-100 via-violet-50 to-transparent rounded-[3rem] -z-10" />
          <img src="/images/hero-illustration.png" alt="SplitMate dashboard preview" className="w-full rounded-3xl shadow-2xl shadow-indigo-900/10" />
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap justify-center gap-x-12 gap-y-3 text-sm text-slate-500 font-medium">
          <span>Trips</span><span>Roommates</span><span>College friends</span><span>Family</span><span>Couples</span><span>Events</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-xl mx-auto text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need to split fair</h2>
          <p className="mt-3 text-slate-600">A complete toolkit for managing shared money with anyone — no spreadsheets required.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Users, title: 'Friends & groups', desc: 'Add friends once, organize them into trip, roommate, or family groups.' },
            { icon: Scale, title: 'Flexible splitting', desc: 'Split equally, by exact amounts, or by percentage — your call every time.' },
            { icon: HandCoins, title: 'Settle up instantly', desc: 'Record payments and watch balances update in real time, automatically.' },
            { icon: Layers, title: 'Simplified debts', desc: 'SplitMate collapses tangled IOUs into the fewest possible payments.' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-200/50 transition">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4"><f.icon size={20} /></div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-xl mx-auto text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight">How SplitMate works</h2>
            <p className="mt-3 text-slate-400">Three steps between you and a drama-free group budget.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Add your people', desc: 'Invite friends and organize them into groups for trips, homes, or family.' },
              { step: '02', title: 'Log shared expenses', desc: 'Add what was spent, who paid, and how it should be split — equally or custom.' },
              { step: '03', title: 'Settle with confidence', desc: 'See exactly who owes whom, and record payments the moment they happen.' },
            ].map((s) => (
              <div key={s.step} className="relative">
                <span className="text-5xl font-bold text-white/10">{s.step}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="groups" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Built for every kind of group</h2>
            <p className="mt-3 text-slate-600 max-w-md">Whether it's a weekend getaway or the monthly rent split with roommates, SplitMate adapts to how your group actually spends money together.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm">
              {['🧳 Trips', '🏡 Roommates', '🎓 College friends', '👨‍👩‍👧‍👦 Family'].map((t) => (
                <div key={t} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">{t}</div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="/images/friends-dinner.jpg" alt="Friends sharing a meal" className="rounded-2xl object-cover h-64 w-full shadow-xl" />
            <img src="/images/friends-trip.jpg" alt="Friends on a trip" className="rounded-2xl object-cover h-64 w-full mt-8 shadow-xl" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight">Ready to stop doing the math?</h2>
          <p className="mt-3 text-indigo-100 max-w-md mx-auto">Join SplitMate and keep every shared expense fair, transparent, and settled.</p>
          <Link to="/signup" className="mt-7 inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-7 py-3 rounded-full hover:bg-indigo-50 transition">
            Get started for free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-[10px]">S</div>
            <span>SplitMate © {new Date().getFullYear()}</span>
          </div>
          <span>Built for splitting bills, not friendships.</span>
        </div>
      </footer>
    </div>
  );
}
