import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { authedFetch, formatCurrency } from '../lib/api';
import { useModal } from '../contexts/ModalContext';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import CreateGroupModal from '../components/CreateGroupModal';

export default function Groups() {
  const { refreshKey, bumpRefresh } = useModal();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await authedFetch('/api/groups');

      const safeGroups = Array.isArray(data)
        ? data
        : Array.isArray(data?.groups)
        ? data.groups
        : [];

      setGroups(safeGroups.filter((group) => group && typeof group === 'object'));
    } catch (e) {
      console.error('Groups API error:', e);

      setGroups([]);
      setError(
        e?.message || 'Could not load your groups.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  if (loading) {
    return <LoadingSpinner label="Loading groups…" />;
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Groups
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Trips, roommates, family — organize expenses by group.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition self-start"
        >
          <Plus size={16} />
          Create group
        </button>

      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* EMPTY STATE */}
      {groups.length === 0 ? (

        <EmptyState
          icon="📁"
          title="No groups yet"
          subtitle="Create your first group for a trip, apartment, or family fund."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Create a group
            </button>
          }
        />

      ) : (

        /* GROUP CARDS */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {groups.map((g, index) => {

            const members = Array.isArray(g?.members)
              ? g.members
              : [];

            const memberCount =
              Number(g?.memberCount) ||
              members.length;

            const yourBalance =
              Number(g?.yourBalance) || 0;

            return (
              <Link
                key={g.id ?? `group-${index}`}
                to={`/groups/${g.id}`}
                className="bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/40 transition p-5"
              >

                {/* GROUP HEADER */}
                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
                    {g?.icon || '📁'}
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="font-semibold text-slate-900 truncate">
                      {g?.name || 'Unnamed group'}
                    </p>

                    <p className="text-xs text-slate-500 capitalize">
                      {g?.type || 'group'}
                    </p>

                  </div>

                </div>

                {/* MEMBERS */}
                {members.length > 0 ? (

                  <div className="flex items-center -space-x-2 mt-4">

                    {members
                      .slice(0, 5)
                      .map((m) => (
                        <Avatar
                          key={m.id}
                          name={m?.name || 'Member'}
                          url={m?.avatar_url}
                          size="sm"
                        />
                      ))}

                    {members.length > 5 && (
                      <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center ring-2 ring-white">
                        +{members.length - 5}
                      </span>
                    )}

                  </div>

                ) : (

                  <p className="text-xs text-slate-400 mt-4">
                    No members yet
                  </p>

                )}

                {/* FOOTER */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">

                  <span className="text-xs text-slate-400">
                    {memberCount} members
                  </span>

                  <span
                    className={`text-sm font-semibold ${
                      yourBalance > 0
                        ? 'text-emerald-600'
                        : yourBalance < 0
                        ? 'text-rose-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {yourBalance === 0
                      ? 'Settled up'
                      : `${
                          yourBalance > 0
                            ? 'you get '
                            : 'you owe '
                        }${formatCurrency(
                          Math.abs(yourBalance)
                        )}`}
                  </span>

                </div>

              </Link>
            );
          })}

        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            bumpRefresh();
            load();
          }}
        />
      )}

    </div>
  );
}
