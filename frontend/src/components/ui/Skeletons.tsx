export function SkeletonBlock({ className }: { className?: string }) {
  return <span className={className ? `skeleton-block ${className}` : 'skeleton-block'} aria-hidden="true" />;
}

export function HeroMediaSkeleton() {
  return (
    <div className="hero-skeleton" aria-hidden="true">
      <div className="hero-skeleton-media" />
      <div className="hero-skeleton-content">
        <SkeletonBlock className="skeleton-line is-title" />
        <div className="hero-skeleton-cta">
          <SkeletonBlock className="skeleton-pill" />
          <SkeletonBlock className="skeleton-pill" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <section className="prada-product-grid skeleton-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="prada-product-card skeleton-card" key={`product-skeleton-${index}`}>
          <div className="prada-product-image skeleton-media" />
          <div className="prada-product-info">
            <SkeletonBlock className="skeleton-line" />
            <SkeletonBlock className="skeleton-line is-short" />
          </div>
        </div>
      ))}
    </section>
  );
}

export function ListingPageSkeleton() {
  return (
    <main className="listing-main skeleton-page" aria-hidden="true">
      <div className="listing-toolbar">
        <SkeletonBlock className="skeleton-line is-small" />
        <div className="listing-actions">
          <SkeletonBlock className="skeleton-pill" />
          <span aria-hidden="true">&middot;</span>
          <SkeletonBlock className="skeleton-pill" />
        </div>
      </div>
      <section className="listing-hero">
        <div className="listing-hero-media skeleton-media" />
        <SkeletonBlock className="listing-pause skeleton-circle" />
      </section>
      <section className="listing-intro">
        <SkeletonBlock className="skeleton-line is-title" />
        <SkeletonBlock className="skeleton-line" />
        <SkeletonBlock className="skeleton-line" />
      </section>
      <ProductGridSkeleton count={9} />
    </main>
  );
}

export function AdminTableSkeleton() {
  return (
    <section className="admin-skeleton" aria-hidden="true">
      <div className="admin-skeleton-header">
        <SkeletonBlock className="skeleton-line is-title" />
        <div className="admin-skeleton-actions">
          <SkeletonBlock className="skeleton-pill" />
          <SkeletonBlock className="skeleton-pill" />
        </div>
      </div>
      <div className="admin-skeleton-table">
        <div className="admin-skeleton-row is-header">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock className="skeleton-line is-small" key={`admin-head-${index}`} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div className="admin-skeleton-row" key={`admin-row-${rowIndex}`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock className="skeleton-line" key={`admin-cell-${rowIndex}-${index}`} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function PdpSkeleton() {
  // Rectangles have borderRadius: 0 so they read as "blocks" instead of pills,
  // which matches the angular feel of the real PDP layout.
  const boxStyle = { borderRadius: 0 } as const;

  return (
    <main className="zara-pdp-main" aria-hidden="true">
      <div className="zara-pdp-left">
        <div className="zara-image-gallery">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="zara-image-item" key={`pdp-skeleton-image-${index}`}>
              <span
                className="skeleton-block"
                style={{ width: '100%', height: '100%', ...boxStyle }}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="zara-pdp-right">
        <div className="zara-product-info" style={{ width: '394px' }}>
          {/* Title placeholder — mirrors the oversized .zara-product-title */}
          <span
            className="skeleton-block"
            style={{ width: '90%', height: 72, marginBottom: 20, ...boxStyle }}
            aria-hidden="true"
          />
          {/* Price line */}
          <SkeletonBlock className="skeleton-line is-short" />

          <hr className="zara-divider" style={{ marginTop: 24 }} />

          {/* ADD button placeholder */}
          <span
            className="skeleton-block"
            style={{
              display: 'block',
              width: '100%',
              height: 52,
              margin: '24px 0 48px',
              ...boxStyle,
            }}
            aria-hidden="true"
          />

          {/* Description lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 48 }}>
            <SkeletonBlock className="skeleton-line" />
            <SkeletonBlock className="skeleton-line" />
            <SkeletonBlock className="skeleton-line is-short" />
          </div>

          {/* 4 expandable rows */}
          <div className="zara-expandable-section">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`pdp-skeleton-row-${index}`}
                style={{ padding: '24px 0', borderBottom: '1px solid #eee' }}
              >
                <SkeletonBlock className="skeleton-line is-small" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export function WomenCategorySectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`women-skeleton-row-${rowIndex}`}>
          <section className="shop-divider">
            {/* Heading placeholder; block element centred via auto margins */}
            <span
              className="skeleton-block skeleton-line is-small"
              style={{ margin: '0 auto' }}
              aria-hidden="true"
            />
          </section>
          <section className="product-grid product-grid-3">
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <div
                className="product-card"
                key={`women-skeleton-card-${rowIndex}-${cardIndex}`}
              >
                <div className="product-image">
                  <span
                    className="skeleton-block"
                    style={{ width: '100%', height: '100%', borderRadius: 0 }}
                    aria-hidden="true"
                  />
                </div>
                <div className="product-info">
                  <SkeletonBlock className="skeleton-line" />
                  <SkeletonBlock className="skeleton-line is-short" />
                </div>
              </div>
            ))}
          </section>
        </div>
      ))}
    </div>
  );
}
