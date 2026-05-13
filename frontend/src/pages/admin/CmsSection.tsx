/**
 * CmsSection — admin page for managing site asset slots (hero videos, mosaic images, etc.)
 *
 * Fetches all site_assets, groups by prefix, renders CmsAssetField per slot.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminDetailTop } from '../../components/admin';
import { CmsAssetField } from '../../components/admin/CmsAssetField';
import {
  fetchSiteAssetsAdmin,
  updateSiteAssetUrl,
  type SiteAsset,
  type SiteAssetSlot,
} from '../../services/siteAssets';
import { uploadSiteAsset } from '../../services/uploadSiteAsset';

type CmsSectionProps = {
  isReady: boolean;
};

/** Group label map for slot prefixes */
const GROUP_LABELS: Record<string, string> = {
  home: 'Homepage',
  women: 'Women',
  men: 'Men',
  login: 'Login',
};

/** Extract the top-level prefix from a slot string */
function slotPrefix(slot: string): string {
  return slot.split('.')[0];
}

/** Group an array of SiteAsset rows by their slot prefix */
function groupAssets(assets: SiteAsset[]): Map<string, SiteAsset[]> {
  const map = new Map<string, SiteAsset[]>();
  for (const asset of assets) {
    const prefix = slotPrefix(asset.slot);
    if (!map.has(prefix)) map.set(prefix, []);
    map.get(prefix)!.push(asset);
  }
  return map;
}

export function CmsSection({ isReady }: CmsSectionProps) {
  const queryClient = useQueryClient();

  const assetsQuery = useQuery({
    queryKey: ['site-assets-admin'],
    queryFn: fetchSiteAssetsAdmin,
    enabled: isReady,
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      slot,
      file,
      pastedUrl,
    }: {
      slot: SiteAssetSlot;
      file: File | null;
      pastedUrl: string | null;
    }) => {
      if (file) {
        await uploadSiteAsset(file, slot);
      } else if (pastedUrl) {
        await updateSiteAssetUrl(slot, pastedUrl);
      }
    },
    onSuccess: () => {
      // T18 — invalidate both query keys so storefront and admin panel refresh
      queryClient.invalidateQueries({ queryKey: ['site-assets'] });
      queryClient.invalidateQueries({ queryKey: ['site-assets-admin'] });
    },
  });

  const handleSave =
    (slot: SiteAssetSlot) =>
    async (file: File | null, pastedUrl: string | null): Promise<void> => {
      await saveMutation.mutateAsync({ slot, file, pastedUrl });
    };

  const grouped = groupAssets(assetsQuery.data ?? []);

  return (
    <section className="admin-detail-pane">
      <AdminDetailTop />

      <div className="admin-detail-card" style={{ margin: '0 24px' }}>
        <p className="admin-eyebrow">CMS</p>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 500 }}>Site Assets</h2>
        <p className="admin-muted" style={{ marginBottom: 0, maxWidth: 520 }}>
          Manage hero videos, mosaic images, and editorial assets displayed on the storefront.
        </p>
      </div>

      {assetsQuery.isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px' }}>
          <span className="cms-spinner" />
          <p className="admin-muted" style={{ margin: 0 }}>Loading assets…</p>
        </div>
      )}

      {assetsQuery.isError && (
        <div className="admin-detail-card" style={{ margin: '0 24px', borderColor: '#fecaca', background: '#fef2f2' }}>
          <p style={{ margin: 0, color: '#b91c1c', fontSize: 13 }}>
            Failed to load assets. Please refresh.
          </p>
        </div>
      )}

      {Array.from(grouped.entries()).map(([prefix, assets]) => (
        <div key={prefix} style={{ padding: '0 24px' }}>
          <div className="cms-group-header">
            <span className="cms-group-accent" />
            <h3 className="cms-group-title">
              {GROUP_LABELS[prefix] ?? prefix}
            </h3>
          </div>
          <div className="cms-asset-grid">
            {assets.map((asset) => (
              <CmsAssetField
                key={asset.slot}
                slot={asset.slot}
                label={asset.label ?? asset.slot}
                currentUrl={asset.public_url}
                mimeType={asset.mime_type}
                onSave={handleSave(asset.slot)}
                isSaving={
                  saveMutation.isPending &&
                  saveMutation.variables?.slot === asset.slot
                }
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

