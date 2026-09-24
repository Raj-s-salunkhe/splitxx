import { initials, colorForName } from '../../utils';

interface AvatarProps {
  name: string | null | undefined;
  url?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ name, url, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  if (url) {
    return (
      <img
        src={url}
        alt={name || 'Avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${colorForName(name)} rounded-full flex items-center justify-center text-white font-medium ${className}`}
    >
      {initials(name)}
    </div>
  );
}
