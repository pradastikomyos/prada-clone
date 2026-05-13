import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ShopHeader } from '../components/layout/ShopHeader';
import { WomenCategorySectionSkeleton } from '../components/ui/Skeletons';
import { menProducts } from '../data/products';
import { isSupabaseConfigured } from '../lib/supabase';
import { listProductsByCategory } from '../services/commerce';
import type { PublicProduct } from '../types/commerce';

type MenSection = {
  title: string;
  category: string;
  products: Array<{
    key: string;
    name: string;
    priceLabel: string;
    image: string;
    slug?: string;
  }>;
};

const SECTION_BLUEPRINT: Array<{ title: string; category: string; staticFallbackIndex: number }> = [
  { title: 'OUTERWEAR', category: 'MEN_OUTERWEAR', staticFallbackIndex: 0 },
  { title: 'SHIRTS AND TOPS', category: 'MEN_TOPS', staticFallbackIndex: 1 },
  { title: 'TROUSERS', category: 'MEN_TROUSERS', staticFallbackIndex: 2 },
  { title: 'BAGS AND ACCESSORIES', category: 'MEN_ACCESSORIES', staticFallbackIndex: 3 },
];

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function toSection(
  blueprint: (typeof SECTION_BLUEPRINT)[number],
  supabaseData: PublicProduct[] | undefined,
): MenSection {
  if (supabaseData && supabaseData.length > 0) {
    return {
      title: blueprint.title,
      category: blueprint.category,
      products: supabaseData.map((product) => ({
        key: product.id,
        name: product.name,
        priceLabel: IDR.format(product.base_price_idr),
        image: product.product_images?.[0]?.image_url ?? '',
        slug: product.slug,
      })),
    };
  }

  const fallback = menProducts[blueprint.staticFallbackIndex];
  if (!fallback) {
    return { title: blueprint.title, category: blueprint.category, products: [] };
  }

  return {
    title: fallback.title,
    category: blueprint.category,
    products: fallback.products.map(([name, price, image]) => ({
      key: name as string,
      name: name as string,
      priceLabel: price as string,
      image: image as string,
    })),
  };
}

export function MenPage() {
  useEffect(() => { document.title = 'Spark Stage - Men'; }, []);
  const queries = useQueries({
    queries: SECTION_BLUEPRINT.map((section) => ({
      queryKey: ['men-category', section.category],
      queryFn: () => listProductsByCategory(section.category, 24),
      enabled: isSupabaseConfigured,
      staleTime: 60_000,
    })),
  });

  const sections: MenSection[] = useMemo(
    () => SECTION_BLUEPRINT.map((blueprint, index) => toSection(blueprint, queries[index].data)),
    [queries],
  );

  const showSkeleton =
    isSupabaseConfigured && queries.every((query) => query.isLoading && !query.data);

  return (
    <>
      <ShopHeader />
      <main className="shop-main">
        <section className="shop-hero">
          <h1>MEN</h1>
          <p>Ready-to-wear collection</p>
        </section>
        {showSkeleton ? (
          <WomenCategorySectionSkeleton rows={SECTION_BLUEPRINT.length} />
        ) : (
          sections.map((section) => (
          <div key={section.category}>
            <section className="shop-divider"><h2>{section.title}</h2></section>
            <section className="product-grid product-grid-3">
              {section.products.map((product) =>
                product.slug ? (
                  <Link
                    to={`/product/${encodeURIComponent(product.slug)}`}
                    className="product-card"
                    key={product.key}
                  >
                    <div className="product-image">
                      <img src={product.image} alt={product.name} loading="lazy" />
                    </div>
                    <div className="product-info">
                      <p className="product-name">{product.name}</p>
                      <p className="product-price">{product.priceLabel}</p>
                    </div>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="product-card is-placeholder"
                    aria-disabled="true"
                    data-ui="placeholder"
                    key={product.key}
                  >
                    <div className="product-image">
                      <img src={product.image} alt={product.name} loading="lazy" />
                    </div>
                    <div className="product-info">
                      <p className="product-name">{product.name}</p>
                      <p className="product-price">{product.priceLabel}</p>
                    </div>
                  </button>
                ),
              )}
            </section>
          </div>
          ))
        )}
      </main>
    </>
  );
}
