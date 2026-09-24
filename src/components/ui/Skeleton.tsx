import { cn } from '../../utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-slate-200',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-4">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-7 w-20 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 bg-white shadow-sm shadow-slate-200/50">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-12 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGroups() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/70 p-4">
            <Skeleton className="h-11 w-11 rounded-xl mb-3" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonFriends() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-10 rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 bg-white shadow-sm shadow-slate-200/50">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGroupDetails() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
