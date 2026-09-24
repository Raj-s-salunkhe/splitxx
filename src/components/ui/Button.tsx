import { cn } from '../../utils';
import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  icon: Icon,
  iconPosition = 'left',
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 focus-visible:ring-indigo-500 shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200/80',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500 shadow-sm shadow-rose-200',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus-visible:ring-slate-400 shadow-sm shadow-slate-200/50',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  };

  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={cn(iconSize, 'animate-spin')} />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className={iconSize} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className={iconSize} />}
        </>
      )}
    </button>
  );
}
