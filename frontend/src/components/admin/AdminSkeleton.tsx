/**
 * Skeleton loading primitives for the admin CMS.
 * Uses CSS animation (animate-pulse) to convey loading state
 * while reserving exact layout space to prevent content jumping.
 */

type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
};

function Skeleton({ className = '', width, height, borderRadius = 8 }: SkeletonProps) {
  return (
    <span
      className={`admin-skeleton ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

/** Matches the exact layout of an admin-feed-card (product list item). */
export function ProductFeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className="admin-feed-card admin-skeleton-card" key={i} aria-hidden="true">
          <span className="admin-feed-thumb">
            <Skeleton width={48} height={48} borderRadius={8} />
          </span>
          <span className="admin-feed-main">
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={12} className="admin-skeleton-mt" />
            <Skeleton width="40%" height={12} className="admin-skeleton-mt" />
          </span>
          <Skeleton width={44} height={12} />
        </div>
      ))}
    </>
  );
}

/** Matches the order strip button layout. */
export function OrderStripSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className="admin-order-skeleton" key={i} aria-hidden="true">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} className="admin-skeleton-mt" />
        </div>
      ))}
    </>
  );
}

/** Small metric card skeleton for the dashboard. */
export function MetricSkeleton() {
  return (
    <div className="admin-metric admin-skeleton-metric" aria-hidden="true">
      <Skeleton width="50%" height={12} />
      <Skeleton width="60%" height={22} className="admin-skeleton-mt" />
    </div>
  );
}
