import { useState, useEffect } from 'react';
import { Modal, Button, Avatar } from '../ui';
import { groupsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { Friend } from '../../types';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  availableFriends: Friend[];
  onSuccess?: () => void;
}

export function AddMembersModal({
  isOpen,
  onClose,
  groupId,
  availableFriends,
  onSuccess,
}: AddMembersModalProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelected([]);
    }
  }, [isOpen]);

  function toggleFriend(friendId: string) {
    setSelected(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected.length) {
      showError('Please select at least one friend to add');
      return;
    }
    setLoading(true);
    try {
      const result: any = await groupsApi.addMembers(groupId, selected);
      const added = result?.added ?? selected.length;
      const skipped = result?.skipped ?? 0;
      if (added > 0) {
        showSuccess(`Added ${added} member${added !== 1 ? 's' : ''} successfully!`);
      } else if (skipped > 0) {
        showSuccess(`${skipped} friend${skipped !== 1 ? 's' : ''} already in group`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add members');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSelected([]);
    onClose();
  }

  const eligible = availableFriends.filter(f => !(f as any).is_member);
  const alreadyMembers = availableFriends.filter(f => (f as any).is_member);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Members" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {eligible.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl mx-auto mb-3">
              👥
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No friends to add</h3>
            <p className="text-sm text-slate-500">
              {alreadyMembers.length > 0
                ? 'All your friends are already in this group.'
                : 'Add some friends first to invite them to this group.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              Select friends to add to this group.
              {selected.length > 0 && (
                <span className="ml-1 text-indigo-600 font-medium">
                  {selected.length} selected
                </span>
              )}
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto -mx-1 px-1">
              {eligible.map(friend => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => toggleFriend(friend.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    selected.includes(friend.id)
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                  }`}
                >
                  <Avatar name={friend.name} url={friend.avatar_url} size="sm" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{friend.name}</p>
                    {friend.email && (
                      <p className="text-xs text-slate-500 truncate">{friend.email}</p>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selected.includes(friend.id)
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-slate-300'
                  }`}>
                    {selected.includes(friend.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!selected.length}
            className="flex-1"
          >
            Add {selected.length > 0 ? `(${selected.length})` : 'Members'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
