/**
 * BannerSection — admin page for managing promotional banners per page.
 * Supports create, toggle active, delete. No scheduling — simple on/off.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminDetailTop } from '../../components/admin';
import {
  createBanner,
  deleteBanner,
  listBanners,
  toggleBannerActive,
  type Banner,
  type BannerPage,
} from '../../services/banners';

type BannerSectionProps = {
  isReady: boolean;
};

const PAGE_LABELS: Record<BannerPage, string> = {
  home: 'Homepage',
  women: 'Women',
  men: 'Men',
  login: 'Login',
};

const PAGE_OPTIONS: BannerPage[] = ['home', 'women', 'men', 'login'];

const EMPTY_FORM = {
  page: 'home' as BannerPage,
  label: '',
  image_url: '',
  link_url: '',
  is_active: true,
  sort_order: 0,
};

export function BannerSection({ isReady }: BannerSectionProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');

  const bannersQuery = useQuery({
    queryKey: ['admin-banners'],
    queryFn: listBanners,
    enabled: isReady,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] });

  const createMutation = useMutation({
    mutationFn: createBanner,
    onSuccess: () => {
      setForm({ ...EMPTY_FORM });
      setFormError('');
      invalidate();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : 'Gagal membuat banner'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleBannerActive(id, isActive),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: invalidate,
  });

  // Group banners by page
  const grouped = (bannersQuery.data ?? []).reduce<Record<string, Banner[]>>((acc, banner) => {
    if (!acc[banner.page]) acc[banner.page] = [];
    acc[banner.page].push(banner);
    return acc;
  }, {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.image_url.trim()) {
      setFormError('Label dan Image URL wajib diisi.');
      return;
    }
    setFormError('');
    createMutation.mutate({
      ...form,
      link_url: form.link_url.trim() || null,
    });
  };

  return (
    <section className="admin-detail-pane">
      <AdminDetailTop />

      <div className="admin-detail-card" style={{ margin: '0 24px' }}>
        <p className="admin-eyebrow">CMS</p>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 500 }}>Banner Manager</h2>
        <p className="admin-muted" style={{ marginBottom: 0, maxWidth: 520 }}>
          Kelola banner promosi per halaman. Toggle aktif/nonaktif tanpa menghapus.
        </p>
      </div>

      {/* Add banner form */}
      <div className="admin-detail-card" style={{ margin: '0 24px' }}>
        <p className="admin-eyebrow">Tambah Banner</p>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <label>
              Halaman
              <select
                value={form.page}
                onChange={(e) => setForm((f) => ({ ...f, page: e.target.value as BannerPage }))}
              >
                {PAGE_OPTIONS.map((p) => (
                  <option key={p} value={p}>{PAGE_LABELS[p]}</option>
                ))}
              </select>
            </label>
            <label>
              Label
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Spring Summer 2026"
                required
              />
            </label>
          </div>
          <label>
            Image URL
            <input
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="https://... atau /assets/..."
              required
            />
          </label>
          <label>
            Link URL <span className="admin-muted">(opsional)</span>
            <input
              value={form.link_url}
              onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
              placeholder="/women atau https://..."
            />
          </label>
          <div className="admin-form-row" style={{ alignItems: 'center', gap: 16 }}>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Aktif saat dibuat
            </label>
            <label>
              Sort Order
              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                style={{ width: 80 }}
              />
            </label>
          </div>
          {formError ? <p className="admin-error">{formError}</p> : null}
          <button
            type="submit"
            className="product-edit-modal__button product-edit-modal__button--primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Menyimpan...' : 'Tambah Banner'}
          </button>
        </form>
      </div>

      {/* Banner list grouped by page */}
      {bannersQuery.isLoading && (
        <p className="admin-muted" style={{ padding: '0 24px' }}>Memuat banner…</p>
      )}

      {PAGE_OPTIONS.map((page) => {
        const pageBanners = grouped[page] ?? [];
        if (pageBanners.length === 0) return null;
        return (
          <div key={page} style={{ padding: '0 24px' }}>
            <div className="cms-group-header">
              <span className="cms-group-accent" />
              <h3 className="cms-group-title">{PAGE_LABELS[page]}</h3>
            </div>
            <div className="banner-list">
              {pageBanners.map((banner) => (
                <div key={banner.id} className={`banner-row${banner.is_active ? '' : ' banner-row--inactive'}`}>
                  <div className="banner-row__preview">
                    <img src={banner.image_url} alt={banner.label} />
                  </div>
                  <div className="banner-row__info">
                    <strong>{banner.label}</strong>
                    {banner.link_url ? (
                      <span className="admin-muted">{banner.link_url}</span>
                    ) : null}
                    <span className={`admin-status-pill is-${banner.is_active ? 'active' : 'draft'}`}>
                      {banner.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="banner-row__actions">
                    <button
                      type="button"
                      className="product-edit-modal__button product-edit-modal__button--secondary"
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate({ id: banner.id, isActive: !banner.is_active })}
                    >
                      {banner.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      type="button"
                      className="product-edit-modal__button product-edit-modal__button--danger"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Hapus banner "${banner.label}"?`)) {
                          deleteMutation.mutate(banner.id);
                        }
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
