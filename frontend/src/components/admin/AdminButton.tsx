import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';

type AdminButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type AdminButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const variantClasses: Record<AdminButtonVariant, string> = {
  primary: 'border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800',
  secondary: 'border-neutral-200 bg-white text-neutral-950 hover:bg-neutral-50',
  ghost: 'border-transparent bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950',
  danger: 'border-red-700 bg-red-700 text-white hover:bg-red-800',
};

const sizeClasses: Record<AdminButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4',
  lg: 'h-11 px-5',
  icon: 'h-10 w-10 p-0',
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      children,
      className,
      disabled,
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      size = 'md',
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        disabled={disabled || isLoading}
        type={type}
        {...props}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 rounded-full border border-current border-t-transparent"
          />
        ) : (
          leftIcon
        )}
        {size !== 'icon' ? children : <span className="sr-only">{children}</span>}
        {size !== 'icon' ? rightIcon : null}
      </button>
    );
  },
);

AdminButton.displayName = 'AdminButton';
