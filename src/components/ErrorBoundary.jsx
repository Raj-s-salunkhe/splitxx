import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled application error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <section className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-500">Please reload the page. If this keeps happening, try signing in again.</p>
            <button onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">Reload page</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
