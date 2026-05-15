import { useEffect, useMemo, useState } from 'react';
import { ProductStatus, AdminProduct } from '../../types/commerce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ProductEditModal } from './ProductEditModal';
import { ProductImageUploader } from './ProductImageUploader';

type InventoryDetailCardProps = {
  product?: AdminProduct;
  onStockChange: (variantId: string, stockQuantity: number) => void;
  onStatusChange: (productId: string, status: ProductStatus) => void;
  onImagesChange: () => void;
  onBack: () => void;
  formatCurrency: (value: number) => string;
};

type ProductImage = NonNullable<AdminProduct['product_images']>[number];
type ProductVariant = NonNullable<AdminProduct['product_variants']>[number];

export function InventoryDetailCard({
  product,
  onStockChange,
  onStatusChange,
  onImagesChange,
  onBack,
  formatCurrency,
}: InventoryDetailCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});

  const variants = useMemo(() => product?.product_variants ?? [], [product]);
  const images = useMemo(
    () => [...(product?.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [product],
  );
  const image = images[0]?.image_url;
  const totalStock = useMemo(
    () => variants.reduce((sum, variant) => sum + Number(variant.stock_quantity ?? 0), 0),
    [variants],
  );

  useEffect(() => {
    if (!product) {
      setIsEditOpen(false);
      setStockDrafts({});
      return;
    }

    setStockDrafts(
      Object.fromEntries(
        (product.product_variants ?? []).map((variant) => [variant.id, String(variant.stock_quantity ?? 0)]),
      ),
    );
  }, [product]);

  const persistVariantStock = (variant: ProductVariant) => {
    const rawValue = stockDrafts[variant.id] ?? String(variant.stock_quantity ?? 0);
    const nextStock = Number(rawValue);
    onStockChange(variant.id, Number.isFinite(nextStock) && nextStock >= 0 ? Math.floor(nextStock) : 0);
  };

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

        {product ? (
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="product-edit-modal__button product-edit-modal__button--secondary"
          >
            Edit Produk
          </button>
        ) : null}
      </div>

      {product ? (
        <div className="admin-detail-grid">
          <div className="admin-metric">
            <span>Price</span>
            <strong>{formatCurrency(product.base_price_idr)}</strong>
          </div>
          <div className="admin-metric">
            <span>Stock</span>
            <strong>{totalStock}</strong>
          </div>
          <div className="admin-metric">
            <span>Status</span>
            <strong style={{ marginTop: 8 }}>
              <span className={`admin-status-pill is-${product.status}`}>{product.status}</span>
            </strong>
          </div>
        </div>
      ) : null}

      {product ? (
        <div className="admin-inline-controls">
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
          <div>
            <p className="admin-muted" style={{ marginTop: 19 }}>
              Edit nama, deskripsi, kategori, dan harga lewat tombol di header.
            </p>
          </div>
        </div>
      ) : null}

      {product ? (
        <ProductImageUploader
          productId={product.id}
          existingImages={images.map((image: ProductImage) => ({
            id: image.id,
            image_url: image.image_url,
            alt: image.alt ?? product.name,
          }))}
          onImagesChange={onImagesChange}
        />
      ) : null}

      {product ? (
        <div className="inventory-variant-list">
          <div>
            <p className="admin-eyebrow">Variants</p>
            <h3>Variant Stock</h3>
          </div>

          {variants.length > 0 ? (
            variants.map((variant) => (
              <div key={variant.id} className="inventory-variant-row">
                <div className="inventory-variant-meta">
                  <strong>{variant.name}</strong>
                  <span>{variant.sku}</span>
                </div>

                <label className="inventory-variant-field">
                  Stock Quantity
                  <input
                    type="number"
                    min="0"
                    value={stockDrafts[variant.id] ?? String(variant.stock_quantity ?? 0)}
                    onChange={(event) =>
                      setStockDrafts((current) => ({ ...current, [variant.id]: event.target.value }))
                    }
                  />
                </label>

                <button
                  type="button"
                  className="product-edit-modal__button product-edit-modal__button--primary"
                  onClick={() => persistVariantStock(variant)}
                >
                  Simpan
                </button>
              </div>
            ))
          ) : (
            <p className="admin-muted">Tidak ada variant yang tersedia.</p>
          )}
        </div>
      ) : null}

      <ProductEditModal
        product={product ?? null}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSaved={onImagesChange}
      />
    </section>
  );
}
