import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Clock, X } from 'lucide-react';
import { Card, Avatar, Button } from './ui';
import { friendRequestsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { FriendRequest } from '../types';

interface FriendRequestsSectionProps {
  onRequestHandled?: () => void;
}

export function FriendRequestsSection({ onRequestHandled }: FriendRequestsSectionProps) {
  const { showSuccess, showError } = useToast();
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOutgoing, setLoadingOutgoing] = useState(false);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [incomingData, outgoingData] = await Promise.all([
        friendRequestsApi.get('incoming'),
        friendRequestsApi.get('outgoing'),
      ]);
      setIncoming(incomingData);
      setOutgoing(outgoingData);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRequests();
  }, [loadRequests]);

  async function handleRespond(requestId: string, status: 'accepted' | 'rejected') {
    try {
      await friendRequestsApi.update(requestId, status);
      setIncoming(prev => prev.filter(r => r.id !== requestId));
      showSuccess(`Friend request ${status === 'accepted' ? 'accepted' : 'rejected'}`);
      onRequestHandled?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : `Failed to ${status} request`);
    }
  }

  async function handleCancel(requestId: string) {
    setLoadingOutgoing(true);
    try {
      await friendRequestsApi.cancel(requestId);
      setOutgoing(prev => prev.filter(r => r.id !== requestId));
      showSuccess('Friend request cancelled');
      onRequestHandled?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to cancel request');
    } finally {
      setLoadingOutgoing(false);
    }
  }

  const requests = activeTab === 'incoming' ? incoming : outgoing;
  const hasRequests = requests.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-lg bg-slate-100/50 p-1.5">
        {[
          { id: 'incoming' as const, label: 'Incoming', count: incoming.length },
          { id: 'outgoing' as const, label: 'Outgoing', count: outgoing.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {tab.label}
              <span className={`px-1.5 rounded-full text-xs font-semibold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <div className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center animate-pulse mx-auto">
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Loading friend requests...</p>
          </div>
        </Card>
      ) : !hasRequests ? (
        <Card>
          <div className="py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
              {activeTab === 'incoming' ? 'No incoming requests' : 'No outgoing requests'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {activeTab === 'incoming'
                ? 'Friend requests will appear here when someone sends you one'
                : 'Your sent friend requests will appear here'}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {requests.map(request => {
              const profile = request.profile;
              const name = profile?.full_name || profile?.email || 'Unknown user';
              const email = profile?.email || '';

              return (
                <div key={request.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={name} url={profile?.avatar_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                    {email && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {email}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Sent {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {activeTab === 'incoming' ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRespond(request.id, 'rejected')}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRespond(request.id, 'accepted')}
                      >
                        Accept
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={loadingOutgoing}
                      disabled={loadingOutgoing}
                      onClick={() => handleCancel(request.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}