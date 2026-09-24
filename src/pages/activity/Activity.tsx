import { useEffect, useState, useCallback } from 'react';
import { Receipt, HandCoins, Users, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, Button, Skeleton } from '../../components/ui';
import { activityApi } from '../../services/api';
import { formatCurrency, timeAgo, formatDate, cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import type { Activity, User } from '../../types';

export default function ActivityPage() {
  const { profile } = useAuth();
  const currency = (profile as User)?.currency || 'USD';
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await activityApi.get();
      setActivities(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  function getActivityIcon(type: string) {
    switch (type) {
      case 'expense': return <Receipt className="w-4 h-4" />;
      case 'settlement': return <HandCoins className="w-4 h-4" />;
      case 'group_created': return <Users className="w-4 h-4" />;
      case 'friend_added': return <UserPlus className="w-4 h-4" />;
      default: return <Receipt className="w-4 h-4" />;
    }
  }

  function getActivityColor(type: string) {
    switch (type) {
      case 'expense': return 'bg-indigo-100 text-indigo-600';
      case 'settlement': return 'bg-emerald-100 text-emerald-600';
      case 'group_created': return 'bg-violet-100 text-violet-600';
      case 'friend_added': return 'bg-cyan-100 text-cyan-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  function getActivityAccent(type: string) {
    switch (type) {
      case 'expense': return 'border-l-indigo-400';
      case 'settlement': return 'border-l-emerald-400';
      case 'group_created': return 'border-l-violet-400';
      case 'friend_added': return 'border-l-cyan-400';
      default: return 'border-l-slate-300';
    }
  }

  function groupByDay(items: Activity[]) {
    const groups: Record<string, Activity[]> = {};
    for (const item of items) {
      const d = new Date(item.created_at);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      let label: string;
      if (isToday) label = 'Today';
      else if (isYesterday) label = 'Yesterday';
      else label = formatDate(item.created_at);

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    }
    return groups;
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Activity</h1>
            <p className="text-sm text-slate-500 mt-0.5">Your recent activity</p>
          </div>
          <Button onClick={loadActivity} icon={RefreshCw} variant="secondary">
            Retry
          </Button>
        </div>
        <Card>
          <div className="py-14 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Couldn't load activity</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  const grouped = groupByDay(activities);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Activity</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activities.length === 0
              ? 'No activity yet'
              : `${activities.length} activit${activities.length !== 1 ? 'ies' : 'y'} recorded`}
          </p>
        </div>
        <button
          onClick={loadActivity}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Empty state */}
      {activities.length === 0 ? (
        <Card>
          <div className="py-14 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl mx-auto mb-4">
              📜
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No activity yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
              Your activity will appear here as you add expenses, friends, and groups
            </p>
          </div>
        </Card>
      ) : (
        /* Timeline by day */
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, list]) => (
            <div key={day}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                {day}
              </p>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-2">
                  {list.map((activity, i) => (
                    <div key={activity.id} className={cn(
                      'relative flex items-start gap-4 pl-12',
                      // don't show line on last item in day for clean ending
                    )}>
                      {/* Timeline dot */}
                      <div className={cn(
                        'absolute left-3 top-4 w-4 h-4 rounded-full border-2 border-white z-10 shadow-sm',
                        getActivityColor(activity.type).split(' ')[0]
                      )} />

                      {/* Activity card */}
                      <Card
                        className={cn(
                          'flex-1 border-l-4 flex items-center gap-3 p-4',
                          getActivityAccent(activity.type)
                        )}
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                          getActivityColor(activity.type)
                        )}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 leading-snug">
                            {activity.description}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {timeAgo(activity.created_at)}
                          </p>
                        </div>
                        {activity.amount && (
                          <p className="text-sm font-bold text-slate-900 tabular-nums flex-shrink-0">
                            {formatCurrency(activity.amount, currency)}
                          </p>
                        )}
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
