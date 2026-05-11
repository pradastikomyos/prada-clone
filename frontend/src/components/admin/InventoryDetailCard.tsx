import { ProductStatus, AdminProduct } from '../../types/commerce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type InventoryDetailCardProps = {
  product?: AdminProduct;
  onStockChange: (variantId: string, stockQuantity: number) => void;
  onStatusChange: (productId: string, status: ProductStatus) => void;
  onBack: () => void;
  formatCurrency: (value: number) => string;
};

export function InventoryDetailCard({
  product,
  onStockChange,
  onStatusChange,
  onBack,
  formatCurrency,
}: InventoryDetailCardProps) {
  const variant = product?.product_variants?.[0];
  const image = product?.product_images?.[0]?.image_url;

  return (
    <section className="admin-detail-card">
      <div className="admin-detail-heading">
        <button type="button" aria-label="Back to products" onClick={onBack} title="Back">&larr;</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {image ? <img src={image} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} /> : null}
          <div>
            <p className="admin-eyebrow">Inventory Detail</p>
            <h2>{product?.name ?? 'Select a product'}</h2>
          </div>
        </div>
      </div>

      {product ? (
        <div className="admin-detail-grid">
          <div className="admin-metric">
            <span>Price</span>
            <strong>{formatCurrency(variant?.price_idr ?? product.base_price_idr)}</strong>
          </div>
          <div className="admin-metric">
            <span>Stock</span>
            <strong>{variant?.stock_quantity ?? 0}</strong>
          </div>
          <div className="admin-metric">
            <span>Status</span>
            <strong style={{ marginTop: 8 }}>
              <span className={`admin-status-pill is-${product.status}`}>{product.status}</span>
            </strong>
          </div>
        </div>
      ) : null}

      {product && variant ? (
        <div className="admin-inline-controls">
          <label>
            Stock
            <input
              key={variant.id}
              type="number"
              min="0"
              defaultValue={variant.stock_quantity}
              onBlur={(event) => onStockChange(variant.id, Number(event.target.value))}
            />
          </label>
          <label>
            Status
            <Select value={product.status} onValueChange={(value: string) => onStatusChange(product.id, value as ProductStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      ) : null}
    </section>
  );
}
