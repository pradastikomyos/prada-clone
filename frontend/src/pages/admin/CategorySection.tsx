/**
 * CategorySection — admin page for managing product categories.
 * Flat list: create, rename, toggle active, delete.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminDetailTop } from '../../components/admin';
import {
  createProductCategory,
  deleteProductCategory,
  listProductCategories,
  toggleCategoryActive,
  updateProductCategory,
  type ProductCategory,
} from '../../services/productCategories';

type CategorySectionProps = {
  isReady: boolean;
};

export function CategorySection({ isReady }: CategorySectionProps) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: listProductCategories,
    enabled: isReady,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

  const createMutation = useMutation({
    mutationFn: createProductCategory,
    onSuccess: () => {
      setNewName('');
      setCreateError('');
      invalidate();
    },
    onError: (err) => setCreateError(err instanceof Error ? err.message : 'Gagal membuat kategori'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateProductCategory(id, name),
    onSuccess: () => {
      setEditingId(null);
      setEditName('');
      invalidate();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCategoryActive(id, isActive),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProductCategory,
    onSuccess: invalidate,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Nama kategori wajib diisi.');
      return;
    }
    setCreateError('');
    createMutation.mutate(newName.trim());
  };

  const startEdit = (cat: ProductCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleUpdate = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateMutation.mutate({ id, name: editName.trim() });
  };

  const categories = categoriesQuery.data ?? [];

  return (
    <section className="admin-detail-pane">
      <AdminDetailTop />

      <div className="admin-detail-card" style={{ margin: '0 24px' }}>
        <p className="admin-eyebrow">CMS</p>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 500 }}>Kategori Produk</h2>
        <p className="admin-muted" style={{ marginBottom: 0, maxWidth: 520 }}>
          Kelola kategori yang tersedia untuk produk. Kategori nonaktif tidak muncul di storefront.
        </p>
      </div>

      {/* Add category form */}
      <div className="admin-detail-card" style={{ margin: '0 24px' }}>
        <p className="admin-eyebrow">Tambah Kategori</p>
        <form className="admin-form" onSubmit={handleCreate} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
          <label style={{ flex: 1 }}>
            Nama Kategori
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="CLOTHING, SHOES, ..."
            />
          </label>
          <button
            type="submit"
            className="product-edit-modal__button product-edit-modal__button--primary"
            disabled={createMutation.isPending}
            style={{ marginBottom: 0 }}
          >
            {createMutation.isPending ? 'Menyimpan...' : 'Tambah'}
          </button>
        </form>
        {createError ? <p className="admin-error" style={{ marginTop: 8 }}>{createError}</p> : null}
      </div>

      {/* Category list */}
      {categoriesQuery.isLoading && (
        <p className="admin-muted" style={{ padding: '0 24px' }}>Memuat kategori…</p>
      )}

      {categories.length > 0 && (
        <div className="admin-detail-card" style={{ margin: '0 24px' }}>
          <div className="category-list">
            {categories.map((cat) => (
              <div key={cat.id} className={`category-row${cat.is_active ? '' : ' category-row--inactive'}`}>
                {editingId === cat.id ? (
                  <form
                    className="category-row__edit"
                    onSubmit={(e) => handleUpdate(e, cat.id)}
                  >
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="product-edit-modal__button product-edit-modal__button--primary"
                      disabled={updateMutation.isPending}
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      className="product-edit-modal__button product-edit-modal__button--secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Batal
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="category-row__info">
                      <strong>{cat.name}</strong>
                      <span className="admin-muted" style={{ fontSize: 11 }}>{cat.slug}</span>
                      <span className={`admin-status-pill is-${cat.is_active ? 'active' : 'draft'}`}>
                        {cat.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <div className="category-row__actions">
                      <button
                        type="button"
                        className="product-edit-modal__button product-edit-modal__button--secondary"
                        onClick={() => startEdit(cat)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="product-edit-modal__button product-edit-modal__button--secondary"
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate({ id: cat.id, isActive: !cat.is_active })}
                      >
                        {cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        type="button"
                        className="product-edit-modal__button product-edit-modal__button--danger"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Hapus kategori "${cat.name}"?`)) {
                            deleteMutation.mutate(cat.id);
                          }
                        }}
                      >
                        Hapus
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
