import { Refresh01Icon, PackageIcon, Add01Icon } from '@hugeicons/core-free-icons';
import { AdminProduct } from '../../types/commerce';
import { AdminIcon } from './AdminIcon';
import { ProductFeedSkeleton } from './AdminSkeleton';

type AdminProductListPaneProps = {
  products?: AdminProduct[];
  selectedProductId?: string | null;
  activeCount: number;
  pendingPickupCount: number;
  isLoading?: boolean;
  onRefresh: () => void;
  onSelectProduct: (id: string) => void;
  onAddProduct?: () => void;
  formatCurrency: (value: number) => string;
};

export function AdminProductListPane({
  products,
  selectedProductId,
  activeCount,
  pendingPickupCount,
  isLoading,
  onRefresh,
  onSelectProduct,
  onAddProduct,
  formatCurrency,
}: AdminProductListPaneProps) {
  const isEmpty = !isLoading && products && products.length === 0;

  return (
    <section className="admin-list-pane">
      <header className="admin-pane-header">
        <div>
          <h1>Good Morning, Admin</h1>
          <span>{products?.length ?? 0} Products</span>
        </div>
        <button type="button" onClick={onRefresh} aria-label="Refresh products">
          <AdminIcon icon={Refresh01Icon} size={18} />
        </button>
      </header>

      <div className="admin-tabs">
        <button className="is-active" type="button">All products</button>
        <button type="button">Active ({activeCount})</button>
        <button type="button">Pickup ({pendingPickupCount})</button>
      </div>

      <div className="admin-product-feed">
        {isLoading ? (
          <ProductFeedSkeleton count={5} />
        ) : isEmpty ? (
          <div className="admin-empty-state">
            <AdminIcon icon={PackageIcon} size={40} />
            <strong>No products yet</strong>
            <p>Add your first product to start managing inventory.</p>
            {onAddProduct ? (
              <button type="button" className="admin-empty-action" onClick={onAddProduct}>
                <AdminIcon icon={Add01Icon} size={16} /> Add product
              </button>
            ) : null}
          </div>
        ) : (
          products?.map((product) => {
            const variant = product.product_variants?.[0];
            const image = product.product_images?.[0]?.image_url;

            return (
              <button
                className={`admin-feed-card${selectedProductId === product.id ? ' is-selected' : ''}`}
                key={product.id}
                type="button"
                onClick={() => onSelectProduct(product.id)}
              >
                <span className="admin-feed-thumb">
                  {image ? <img src={image} alt="" /> : <AdminIcon icon={PackageIcon} size={24} />}
                </span>
                <span className="admin-feed-main">
                  <strong>{product.name}</strong>
                  <em>{variant?.sku ?? product.sku} - {product.category}</em>
                  <small>{formatCurrency(variant?.price_idr ?? product.base_price_idr)}</small>
                </span>
                <span className={`admin-status-pill is-${product.status}`}>{product.status}</span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
