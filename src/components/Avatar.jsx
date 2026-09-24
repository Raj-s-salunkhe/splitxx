import { initials, colorForName } from '../lib/api';

export default function Avatar({ name, url, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };
  const sizeClass = sizes[size] || sizes.md;
  if (url) {
    return <img src={url} alt={name} className={`${sizeClass} rounded-full object-cover ring-2 ring-white ${className}`} />;
  }
  return (
    <div className={`${sizeClass} ${colorForName(name)} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white shrink-0 ${className}`}>
      {initials(name)}
    </div>
  );
}
