import { FormEvent } from 'react';
import { ProductFormInput } from '../../types/commerce';
import { makeSku, slugify } from '../../services/commerce';

type ProductFormCardProps = {
  form: ProductFormInput;
  error?: Error | null;
  isPending: boolean;
  onChange: (form: ProductFormInput) => void;
  onSubmit: (event: FormEvent) => void;
};

export function ProductFormCard({ form, error, isPending, onChange, onSubmit }: ProductFormCardProps) {
  return (
    <form className="admin-detail-card admin-form" id="admin-add-product" onSubmit={onSubmit}>
      <div>
        <p className="admin-eyebrow">Product CMS</p>
        <h2>Add Product</h2>
      </div>
      <label>
        Name
        <input
          value={form.name}
          onChange={(event) => {
            const name = event.target.value;
            onChange({
              ...form,
              name,
              slug: form.slug || slugify(name),
              sku: form.sku || makeSku(name),
            });
          }}
          required
        />
      </label>
      <div className="admin-form-row">
        <label>
          SKU
          <input value={form.sku} onChange={(event) => onChange({ ...form, sku: event.target.value.toUpperCase() })} required />
        </label>
        <label>
          Price
          <input
            type="number"
            min="0"
            value={form.priceIdr}
            onChange={(event) => onChange({ ...form, priceIdr: Number(event.target.value) })}
            required
          />
        </label>
      </div>
      <label>
        Image URL
        <input value={form.imageUrl} onChange={(event) => onChange({ ...form, imageUrl: event.target.value })} placeholder="https://..." />
      </label>
      {error ? <p className="admin-error">{error.message}</p> : null}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save product'}
      </button>
    </form>
  );
}
