import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../store/uiStore';
import { PdpSkeleton } from '../components/ui/Skeletons';
import { menNewArrivals, womenNewArrivals, womenProducts } from '../data/products';
import { isSupabaseConfigured } from '../lib/supabase';
import { getProductBySlug } from '../services/commerce';
import { addItemToCart, LOGIN_REQUIRED } from '../services/cart';
import { useCartSummary } from '../hooks/useCartSummary';
import type { ListingProduct } from '../types/catalog';

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type ResolvedProduct = {
  id: string | null;
  name: string;
  description: string;
  priceIdr: number | null;
  priceLabel: string | null;
  sku: string | null;
  image: string;
  alt: string;
};

function buildStaticIndex(): ResolvedProduct[] {
  const listingFallbacks: ResolvedProduct[] = [...womenNewArrivals, ...menNewArrivals].map(
    (item: ListingProduct) => ({
      id: null,
      name: item.name,
      description:
        'A modern wardrobe essential. Crafted with precision to offer both comfort and refined elegance.',
      priceIdr: null,
      priceLabel: null,
      sku: null,
      image: item.image,
      alt: item.alt ?? item.name,
    }),
  );

  const categoryFallbacks: ResolvedProduct[] = womenProducts.flatMap((section) =>
    section.products.map(([name, price, image]) => ({
      id: null,
      name: name as string,
      description:
        'A modern wardrobe essential. Crafted with precision to offer both comfort and refined elegance.',
      priceIdr: null,
      priceLabel: price as string,
      sku: null,
      image: image as string,
      alt: name as string,
    })),
  );

  return [...listingFallbacks, ...categoryFallbacks];
}

export function ProductPage() {
  const { setSearchOpen, setCartDrawerOpen } = useUIStore();
  const queryClient = useQueryClient();
  const cartSummary = useCartSummary();
  const navigate = useNavigate();
  const [addError, setAddError] = useState<string | null>(null);

  // Support both /product/:slug (new) and ?slug= / ?name= (legacy redirects)
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const legacySlug = searchParams.get('slug');
  const legacyName = searchParams.get('name') ?? searchParams.get('id');

  const fallbackSlug = paramSlug ?? legacySlug ?? (legacyName ? slugify(legacyName) : null);

  const productQuery = useQuery({
    queryKey: ['product-detail', fallbackSlug],
    queryFn: () => getProductBySlug(fallbackSlug as string),
    enabled: isSupabaseConfigured && Boolean(fallbackSlug),
  });

  const staticIndex = useMemo(() => buildStaticIndex(), []);

  const resolved: ResolvedProduct = useMemo(() => {
    if (productQuery.data) {
      const source = productQuery.data;
      return {
        id: source.id,
        name: source.name,
        description:
          source.description ??
          'A modern wardrobe essential. Crafted with precision to offer both comfort and refined elegance.',
        priceIdr: source.base_price_idr,
        priceLabel: IDR.format(source.base_price_idr),
        sku: source.sku,
        image: source.product_images?.[0]?.image_url ?? staticIndex[0]?.image ?? '',
        alt: source.product_images?.[0]?.alt ?? source.name,
      };
    }

    if (legacyName) {
      const match = staticIndex.find((item) => item.name === legacyName);
      if (match) return match;
    }
    if (fallbackSlug) {
      const match = staticIndex.find((item) => slugify(item.name) === fallbackSlug);
      if (match) return match;
    }

    return staticIndex[0];
  }, [fallbackSlug, legacyName, productQuery.data, staticIndex]);

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!resolved.id) throw new Error('NO_PRODUCT_ID');
      await addItemToCart({ productId: resolved.id, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', cartSummary.userId] });
      queryClient.invalidateQueries({ queryKey: ['cart-summary', cartSummary.userId] });
      setCartDrawerOpen(true);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === LOGIN_REQUIRED) {
        const redirect = window.location.pathname + window.location.search;
        navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }
      setAddError(error instanceof Error ? error.message : 'Failed to add to bag.');
    },
  });

  const canAdd = Boolean(resolved.id) && isSupabaseConfigured;
  const addDisabled = !canAdd || addMutation.isPending;
  const addLabel = addMutation.isPending ? 'ADDING…' : 'ADD';
  const addHint = canAdd
    ? undefined
    : 'Add to bag is only available when Supabase is configured and the product comes from the catalog.';

  const showSkeleton =
    isSupabaseConfigured && productQuery.isLoading && !productQuery.data;

  return (
    <div className="zara-pdp">
      <header className="zara-header">
        <div className="zara-header-left">
          <button className="zara-back-btn" onClick={() => navigate(-1)}>
            &#8592;
          </button>
        </div>
        <div className="zara-header-right">
          <button className="zara-utility-link" onClick={() => setSearchOpen(true)}>CARI</button>
          <div className="zara-utility-group">
            <Link className="zara-utility-link" to="/login">LOG IN</Link>
            <button className="zara-utility-link">BANTUAN</button>
            <button
              type="button"
              className="zara-utility-link"
              onClick={() => setCartDrawerOpen(true)}
            >
              KERANJANG ({cartSummary.itemCount})
            </button>
          </div>
        </div>
      </header>

      {showSkeleton ? (
        <PdpSkeleton />
      ) : (
        <main className="zara-pdp-main">
        <div className="zara-pdp-left">
          <div className="zara-image-gallery">
            <div className="zara-image-item">
              <img src={resolved.image} alt={resolved.alt} />
            </div>
            <div className="zara-image-item">
              <img src={resolved.image} alt={`${resolved.alt} detail 1`} style={{ filter: 'brightness(0.95)' }} />
            </div>
            <div className="zara-image-item">
              <img src={resolved.image} alt={`${resolved.alt} detail 2`} style={{ filter: 'contrast(1.05)' }} />
            </div>
          </div>
        </div>

        <div className="zara-pdp-right">
          <div className="zara-product-info" style={{ width: '394px' }}>
            <h1 className="zara-product-title">{resolved.name.toUpperCase()}</h1>
            {resolved.priceLabel ? <p className="zara-product-price">{resolved.priceLabel}</p> : null}

            <hr className="zara-divider" />

            {resolved.sku ? <p className="zara-product-meta">SKU {resolved.sku}</p> : null}

            <button
              type="button"
              className="zara-add-btn"
              disabled={addDisabled}
              aria-describedby={addHint ? 'pdp-add-hint' : undefined}
              title={addHint}
              onClick={() => {
                setAddError(null);
                addMutation.mutate();
              }}
            >
              {addLabel}
            </button>
            {addHint ? (
              <p id="pdp-add-hint" className="zara-product-meta" style={{ marginTop: '8px' }}>
                {addHint}
              </p>
            ) : null}
            {addError ? (
              <p className="zara-product-meta" style={{ marginTop: '8px', color: '#a00' }}>
                {addError}
              </p>
            ) : null}

            <div className="zara-product-description">
              <p>{resolved.description}</p>
            </div>

            <div className="zara-expandable-section">
              <button>COMPLETE YOUR LOOK</button>
              <button>PRODUCT MEASUREMENTS</button>
              <button>COMPOSITION, CARE &amp; ORIGIN</button>
              <button>CHECK IN-STORE AVAILABILITY</button>
            </div>
          </div>
        </div>
      </main>
      )}
    </div>
  );
}
