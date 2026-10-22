import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-auro-primary text-auro-surface hover:bg-auro-primary/90',
  secondary:
    'bg-auro-surface text-auro-text border border-auro-text-muted/30 hover:bg-auro-surface-muted',
  ghost: 'text-auro-text-muted hover:bg-auro-surface-muted hover:text-auro-text',
};

export function Button({
  variant = 'secondary',
  isLoading = false,
  icon,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auro-primary focus-visible:ring-offset-2 focus-visible:ring-offset-auro-surface',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
