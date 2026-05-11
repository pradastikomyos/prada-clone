import { HTMLAttributes, ReactNode } from 'react';

type AdminMetricTone = 'neutral' | 'success' | 'warning' | 'danger';
type AdminMetricTrend = 'up' | 'down' | 'flat';

export type AdminMetricProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  delta?: ReactNode;
  trend?: AdminMetricTrend;
  tone?: AdminMetricTone;
};

const toneClasses: Record<AdminMetricTone, string> = {
  neutral: 'text-neutral-600',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
};

const trendLabels: Record<AdminMetricTrend, string> = {
  up: 'Increase',
  down: 'Decrease',
  flat: 'No change',
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function AdminMetric({
  className,
  delta,
  helper,
  icon,
  label,
  tone = 'neutral',
  trend = 'flat',
  value,
  ...props
}: AdminMetricProps) {
  return (
    <div
      className={cx(
        'rounded-lg border border-neutral-200 bg-white p-4 text-neutral-950 shadow-sm',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-5 text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold leading-8 text-neutral-950">{value}</p>
        </div>
        {icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-600">
            {icon}
          </span>
        ) : null}
      </div>
      {delta || helper ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5">
          {delta ? (
            <span className={cx('font-medium', toneClasses[tone])} aria-label={`${trendLabels[trend]}: ${delta}`}>
              {delta}
            </span>
          ) : null}
          {helper ? <span className="text-neutral-500">{helper}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
