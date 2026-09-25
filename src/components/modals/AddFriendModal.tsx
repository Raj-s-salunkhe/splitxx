import { useState } from 'react';
import { Search, Send, Copy, Check } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { friendRequestsApi, searchApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../ui';
import type { User } from '../../types';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export function AddFriendModal({ isOpen, onClose, onSuccess }: AddFriendModalProps) {
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not-found'>('idle');
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [searchError, setSearchError] = useState('');
  const [requesting, setRequesting] = useState<string | null>(null);
  const [invited, setInvited] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setSearchError('Please enter an email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setSearchError('Please enter a valid email address');
      return;
    }

    setSearchError('');
    setSearchStatus('searching');
    try {
      const user = await searchApi.byEmail(trimmedEmail);
      setSearchedUser(user);
      setSearchStatus('found');
      setInvited(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search for this user';
      if (message.includes('404')) {
        setSearchedUser(null);
        setSearchStatus('not-found');
      } else {
        setSearchError(message);
        setSearchStatus('idle');
      }
    }
  }

  async function handleSendRequest(user: User) {
    setRequesting(user.id);
    try {
      await friendRequestsApi.create({ addressee_id: user.id });
      showSuccess(`Friend request sent to ${user.full_name || user.email}`);
      onSuccess?.({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      });
      setSearchedUser(null);
      setSearchStatus('idle');
      setEmail('');
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to send friend request');
    } finally {
      setRequesting(null);
    }
  }

  function handleCopyInvite() {
    const inviteMessage = `Join me on SplitX to split expenses together: ${window.location.origin}`;
    const done = () => {
      setInvited(true);
      setTimeout(() => setInvited(false), 3000);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(inviteMessage).then(done).catch(() => showError('Could not copy the invite link'));
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = inviteMessage;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        done();
      } catch {
        showError('Could not copy the invite link');
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  function handleClose() {
    setEmail('');
    setSearchStatus('idle');
    setSearchedUser(null);
    setSearchError('');
    setRequesting(null);
    setInvited(false);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Friend" size="sm">
      <form onSubmit={handleSearch} className="space-y-5">
        <p className="text-sm text-slate-500">
          Enter the email address of a SplitX account to find them and send a friend request.
        </p>

        <div className="space-y-1">
          <Input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setSearchError(''); }}
            placeholder="friend@example.com"
            error={searchError}
            hint="We'll look up the SplitX account for this email"
          />
        </div>

        <Button type="submit" className="w-full" loading={searchStatus === 'searching'} icon={Search}>
          {searchStatus === 'searching' ? 'Searching...' : 'Find User'}
        </Button>

        {searchStatus === 'found' && searchedUser && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={searchedUser.full_name || searchedUser.email} url={searchedUser.avatar_url} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {searchedUser.full_name || searchedUser.email}
                </p>
                <p className="text-xs text-slate-500 truncate">{searchedUser.email}</p>
              </div>
            </div>
            <Button type="button" className="w-full" loading={requesting === searchedUser.id} icon={Send} onClick={() => handleSendRequest(searchedUser)}>
              {requesting === searchedUser.id ? 'Sending...' : 'Send Friend Request'}
            </Button>
          </div>
        )}

        {searchStatus === 'not-found' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">No SplitX account found</p>
                <p className="text-xs text-amber-700/80 mt-0.5">
                  {email.trim()} is not connected to a SplitX account yet.
                </p>
              </div>
            </div>
            <Button type="button" variant="secondary" className="w-full" icon={invited ? Check : Copy} onClick={handleCopyInvite}>
              {invited ? 'Invite Link Copied' : 'Invite to SplitX'}
            </Button>
            <p className="text-[11px] text-amber-700/70">
              We'll copy an invitation link you can share with them directly.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="flex-1"
            disabled={searchStatus === 'searching' || Boolean(requesting)}
          >
            Cancel
          </Button>
          <Button type="submit" loading={searchStatus === 'searching'} className="flex-1" icon={Search}>
            {searchStatus === 'searching' ? 'Searching...' : 'Find User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
