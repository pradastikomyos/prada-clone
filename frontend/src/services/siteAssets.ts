/**
 * siteAssets.ts
 *
 * Fetches CMS-managed asset URLs from the `site_assets` table.
 * Falls back to local `/assets/reference/...` paths when Supabase is not
 * configured or the query fails — so the app always renders something.
 */

import { requireSupabaseClient } from '../lib/supabase';


export type SiteAssetSlot =
  | 'home.hero.video'
  | 'home.spring-summer.women.mosaic'
  | 'home.spring-summer.men.mosaic'
  | 'women.new-arrivals.hero.video'
  | 'men.new-arrivals.hero.video'
  | 'login.editorial';

export type SiteAsset = {
  slot: SiteAssetSlot;
  public_url: string;
  mime_type: string | null;
  label: string | null;
};

/** Local fallback map — used when Supabase is not configured or query fails. */
export const SITE_ASSET_FALLBACKS: Record<SiteAssetSlot, string> = {
  'home.hero.video':                 '/assets/reference/prada/home/hero/days-of-summer-loop.mp4',
  'home.spring-summer.women.mosaic': '/assets/reference/prada/home/mosaic/spring-summer-women-landscape.avif',
  'home.spring-summer.men.mosaic':   '/assets/reference/prada/home/mosaic/spring-summer-men-landscape.avif',
  'women.new-arrivals.hero.video':   '/assets/reference/prada/women-new-arrivals/hero/new-arrivals-loop.webm',
  'men.new-arrivals.hero.video':     '/assets/reference/prada/men-new-arrivals/hero/new-arrivals-loop.webm',
  'login.editorial':                 '/assets/reference/zara/login/editorial.jpg',
};

/**
 * Fetches all site asset slots from Supabase.
 * Returns a map of slot → public_url for easy lookup.
 */
export async function fetchSiteAssets(): Promise<Record<SiteAssetSlot, string>> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('site_assets')
    .select('slot, public_url, mime_type, label');

  if (error) throw error;

  const map = { ...SITE_ASSET_FALLBACKS };
  for (const row of data ?? []) {
    if (row.slot in map) {
      map[row.slot as SiteAssetSlot] = row.public_url;
    }
  }
  return map;
}

/**
 * Fetches all site asset rows for the admin CMS panel.
 * Returns full row data (slot, public_url, mime_type, label).
 */
export async function fetchSiteAssetsAdmin(): Promise<SiteAsset[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('site_assets')
    .select('slot, public_url, mime_type, label')
    .order('slot');
  if (error) throw error;
  return (data ?? []) as SiteAsset[];
}

/**
 * Updates the public_url of a site asset slot directly (paste URL flow).
 */
export async function updateSiteAssetUrl(slot: SiteAssetSlot, publicUrl: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client
    .from('site_assets')
    .update({ public_url: publicUrl })
    .eq('slot', slot);
  if (error) throw error;
}
