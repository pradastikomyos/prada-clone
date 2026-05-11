import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react';

export type AdminInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  fullWidth?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  (
    {
      className,
      description,
      disabled,
      error,
      fullWidth = true,
      id,
      label,
      leftIcon,
      rightElement,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <label className={cx('block text-sm', fullWidth && 'w-full')} htmlFor={inputId}>
        {label ? <span className="mb-1.5 block font-medium text-neutral-800">{label}</span> : null}
        <span
          className={cx(
            'flex h-10 items-center gap-2 rounded-md border bg-white px-3 text-neutral-950 shadow-sm',
            error ? 'border-red-500' : 'border-neutral-200',
            disabled ? 'bg-neutral-50 text-neutral-400' : 'focus-within:border-neutral-900',
          )}
        >
          {leftIcon ? <span className="shrink-0 text-neutral-500">{leftIcon}</span> : null}
          <input
            ref={ref}
            aria-describedby={cx(descriptionId, errorId) || undefined}
            aria-invalid={Boolean(error) || undefined}
            className={cx(
              'min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed',
              className,
            )}
            disabled={disabled}
            id={inputId}
            {...props}
          />
          {rightElement ? <span className="shrink-0 text-neutral-500">{rightElement}</span> : null}
        </span>
        {description ? <span className="mt-1.5 block text-xs leading-5 text-neutral-500" id={descriptionId}>{description}</span> : null}
        {error ? <span className="mt-1.5 block text-xs leading-5 text-red-600" id={errorId}>{error}</span> : null}
      </label>
    );
  },
);

AdminInput.displayName = 'AdminInput';
