import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchSiteAssets, SITE_ASSET_FALLBACKS, type SiteAssetSlot } from '../services/siteAssets';

/**
 * Fetches all CMS-managed site asset URLs from Supabase.
 * Returns the fallback map immediately when Supabase is not configured.
 * Stale time is 5 minutes — assets don't change often.
 */
export function useSiteAssets() {
  const query = useQuery({
    queryKey: ['site-assets'],
    queryFn: fetchSiteAssets,
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60_000,
    // On error, fall back to local paths silently
    retry: 1,
  });

  // If Supabase not configured or query hasn't resolved yet, use fallbacks
  const assetMap: Record<SiteAssetSlot, string> =
    query.data ?? { ...SITE_ASSET_FALLBACKS };

  return {
    assetMap,
    isLoading: query.isLoading,
  };
}
