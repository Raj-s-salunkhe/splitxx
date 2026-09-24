import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../ui';
import { groupsApi, friendsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../ui/Avatar';
import type { Friend, Group } from '../../types';
import { GROUP_TYPES } from '../../utils';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (group: Group) => void;
}

export function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [type, setType] = useState('trip');

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  async function loadFriends() {
    try {
      const data = await friendsApi.get().catch(() => []);
      setFriends(data);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  }

  function toggleFriend(friendId: string) {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      showError('Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      const group = await groupsApi.create({
        name: name.trim(),
        type: type as 'trip' | 'roommates' | 'college' | 'family' | 'other',
        member_friend_ids: selectedFriends,
      });

      showSuccess('Group created successfully!');
      onSuccess?.(group);
      handleClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName('');
    setType('trip');
    setSelectedFriends([]);
    onClose();
  }

  const selectedType = GROUP_TYPES.find(t => t.id === type);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Group" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Group name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., Weekend Trip, Apartment"
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Group type</label>
          <div className="grid grid-cols-5 gap-2">
            {GROUP_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                  type === t.id
                    ? 'bg-indigo-100 border-2 border-indigo-500'
                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="text-[10px] font-medium text-slate-600">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Add members (optional)
          </label>
          {friends.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No friends added yet. You can add friends later.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {friends.map(friend => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => toggleFriend(friend.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    selectedFriends.includes(friend.id)
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                  }`}
                >
                  <Avatar name={friend.name} url={friend.avatar_url} size="sm" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900">{friend.name}</p>
                    {friend.email && (
                      <p className="text-xs text-slate-500">{friend.email}</p>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedFriends.includes(friend.id)
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-slate-300'
                  }`}>
                    {selectedFriends.includes(friend.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
}
