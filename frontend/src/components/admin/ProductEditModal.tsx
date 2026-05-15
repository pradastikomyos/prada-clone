import { useEffect, useState, type FormEvent } from 'react';
import { updateProduct } from '../../services/commerce';
import type { AdminProduct, ProductStatus } from '../../types/commerce';

type ProductCategory = 'CLOTHING' | 'SHOES' | 'BAGS' | 'ACCESSORIES';

const CATEGORY_OPTIONS: ProductCategory[] = ['CLOTHING', 'SHOES', 'BAGS', 'ACCESSORIES'];

const isProductCategory = (value: string): value is ProductCategory =>
  CATEGORY_OPTIONS.includes(value as ProductCategory);

type ProductEditModalProps = {
  product: AdminProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function ProductEditModal({ product, isOpen, onClose, onSaved }: ProductEditModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('CLOTHING');
  const [status, setStatus] = useState<ProductStatus>('draft');
  const [priceIdr, setPriceIdr] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!product) return;

    setName(product.name);
    setDescription(product.description ?? '');
    setCategory(isProductCategory(product.category) ? product.category : 'CLOTHING');
    setStatus(product.status);
    setPriceIdr(product.base_price_idr);
    setErrorMessage('');
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      await updateProduct(product.id, {
        name,
        description,
        category,
        status,
        priceIdr,
      });
      onSaved();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal menyimpan produk.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="product-edit-modal">
      <div className="product-edit-modal__backdrop" onClick={onClose} />
      <div className="product-edit-modal__panel" role="dialog" aria-modal="true" aria-label="Edit Produk">
        <div className="product-edit-modal__header">
          <div>
            <p className="admin-eyebrow">Edit Product</p>
            <h3>{product.name}</h3>
          </div>
          <button type="button" className="product-edit-modal__button product-edit-modal__button--secondary" onClick={onClose}>
            ×
          </button>
        </div>

        <form id="product-edit-modal-form" className="product-edit-modal__body admin-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>

          <label>
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
          </label>

          <div className="admin-form-row">
            <label>
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value as ProductCategory)}>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)}>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </label>
          </div>

          <label>
            Base Price IDR
            <input type="number" min="0" value={priceIdr} onChange={(event) => setPriceIdr(Number(event.target.value))} required />
          </label>

          {errorMessage ? <p className="admin-error">{errorMessage}</p> : null}
        </form>

        <div className="product-edit-modal__footer">
          <button type="button" className="product-edit-modal__button product-edit-modal__button--secondary" onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          <button type="submit" form="product-edit-modal-form" className="product-edit-modal__button product-edit-modal__button--primary" disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
