import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronRight, Users } from 'lucide-react';
import { Card } from '../../components/ui';
import { SkeletonGroups } from '../../components/ui/Skeleton';
import { CreateGroupModal } from '../../components/modals';
import { groupsApi } from '../../services/api';
import { formatCurrency, getGroupTypeEmoji, cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import type { Group, User } from '../../types';

export default function Groups() {
  const { profile } = useAuth();
  const currency = (profile as User)?.currency || 'USD';
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await groupsApi.get();
      setGroups(data || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  function handleGroupCreated() {
    loadGroups();
    setCreateModalOpen(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonGroups />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Groups</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {groups.length === 0
              ? 'Create a group to start splitting expenses'
              : `${groups.length} group${groups.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-all duration-150 shadow-sm shadow-indigo-200 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <Card>
          <div className="py-14 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mx-auto mb-4">
              👥
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No groups yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
              Create a group to start tracking shared expenses with friends
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-all duration-150 shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Create your first group
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {groups.map(group => {
            const bal = group.yourBalance || 0;
            const memberCount = group.memberCount || group.members?.length || 0;
            return (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card
                  hover
                  className="h-full"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">
                        {getGroupTypeEmoji(group.type) || group.icon || '👥'}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 mt-1" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-0.5 truncate">{group.name}</h3>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className={cn(
                      'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full',
                      bal > 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : bal < 0
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-500'
                    )}>
                      {bal > 0
                        ? `+${formatCurrency(bal, currency)} owed to you`
                        : bal < 0
                        ? `You owe ${formatCurrency(Math.abs(bal), currency)}`
                        : 'All settled'}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleGroupCreated}
      />
    </div>
  );
}
