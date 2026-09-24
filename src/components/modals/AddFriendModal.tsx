import { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { friendsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { Friend } from '../../types';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (friend: Friend) => void;
}

export function AddFriendModal({ isOpen, onClose, onSuccess }: AddFriendModalProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let valid = true;
    setNameError('');
    setEmailError('');

    if (!name.trim()) {
      setNameError('Name is required');
      valid = false;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      const friend = await friendsApi.create({
        name: name.trim(),
        email: email.trim() || undefined,
      });

      showSuccess(`${name.trim()} added as friend`);
      onSuccess?.(friend);
      handleClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add friend');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName('');
    setEmail('');
    setNameError('');
    setEmailError('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Friend" size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-slate-700">
            Name <span className="text-rose-500">*</span>
          </label>
          <Input
            value={name}
            onChange={e => { setName(e.target.value); setNameError(''); }}
            placeholder="Enter friend's name"
            error={nameError}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-slate-700">
            Email <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <Input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailError(''); }}
            placeholder="friend@example.com"
            error={emailError}
          />
          <p className="text-xs text-slate-400 mt-1">
            Add an email to invite them or link shared expenses
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
          >
            Add Friend
          </Button>
        </div>
      </form>
    </Modal>
  );
}
