import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchSiteAssets, SITE_ASSET_FALLBACKS, type SiteAssetSlot } from '../services/siteAssets';

/**
 * Fetches all CMS-managed site asset URLs from Supabase.
 *
 * - When Supabase is not configured: returns fallback map immediately, isReady=true.
 * - When Supabase is configured and query is loading: returns fallback map, isReady=false.
 *   Components should wait for isReady before rendering media to avoid double-loading.
 * - When query resolves: returns Storage URLs, isReady=true.
 * - On error: falls back to local paths, isReady=true (don't block forever).
 */
export function useSiteAssets() {
  const query = useQuery({
    queryKey: ['site-assets'],
    queryFn: fetchSiteAssets,
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // If Supabase is configured but query hasn't resolved yet, signal not ready
  // so components don't render with fallback URLs (which causes double-loading).
  const isReady = !isSupabaseConfigured || !query.isLoading;

  const assetMap: Record<SiteAssetSlot, string> =
    query.data ?? { ...SITE_ASSET_FALLBACKS };

  return {
    assetMap,
    isReady,
    isLoading: query.isLoading,
  };
}
