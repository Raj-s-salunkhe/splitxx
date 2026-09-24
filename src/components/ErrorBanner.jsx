import { AlertCircle } from 'lucide-react';

export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
