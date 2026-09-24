export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-slate-200 rounded-2xl bg-white">
      {icon && <div className="mb-4 text-4xl">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
