import { cn } from '../../utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50',
        hover && 'hover:border-slate-200 hover:shadow-md hover:shadow-slate-200/60 transition-all duration-200 cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 md:px-5 py-3 border-b border-slate-100', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-4 md:px-5 py-3 md:py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 md:px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl', className)}>
      {children}
    </div>
  );
}
