export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
