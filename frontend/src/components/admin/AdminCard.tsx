import { HTMLAttributes, ReactNode } from 'react';

type AdminCardElement = 'article' | 'div' | 'section';
type AdminCardPadding = 'none' | 'sm' | 'md' | 'lg';

export type AdminCardProps = HTMLAttributes<HTMLElement> & {
  as?: AdminCardElement;
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  padding?: AdminCardPadding;
};

const paddingClasses: Record<AdminCardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function AdminCard({
  actions,
  as: Component = 'section',
  children,
  className,
  description,
  eyebrow,
  padding = 'md',
  title,
  ...props
}: AdminCardProps) {
  const hasHeader = Boolean(eyebrow || title || description || actions);

  return (
    <Component
      className={cx(
        'rounded-lg border border-neutral-200 bg-white text-neutral-950 shadow-sm',
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {hasHeader ? (
        <div className={cx('flex items-start justify-between gap-4', Boolean(children) && 'mb-4')}>
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{eyebrow}</p>
            ) : null}
            {title ? <h2 className="text-base font-semibold leading-6 text-neutral-950">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-5 text-neutral-600">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </Component>
  );
}
