import { cn } from '../../utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400',
            'transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900',
            'transition-all duration-200 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200',
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
