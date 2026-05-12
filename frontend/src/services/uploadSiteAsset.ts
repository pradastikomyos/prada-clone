import { requireSupabaseClient } from '../lib/supabase';
import type { SiteAssetSlot } from './siteAssets';

/**
 * Uploads a file to the site-assets Storage bucket and updates the
 * corresponding site_assets row's public_url.
 *
 * Flow:
 *   1. Upload file to storage at path derived from slot (e.g. home/hero/filename)
 *   2. Get public URL from storage
 *   3. Update site_assets row: public_url, mime_type, storage_path
 *   4. Return the new public URL
 */
export async function uploadSiteAsset(file: File, slot: SiteAssetSlot): Promise<string> {
  const client = requireSupabaseClient();

  // Derive storage path from slot: replace dots with slashes, append filename
  const ext = file.name.split('.').pop() ?? 'bin';
  const storagePath = `${slot.replace(/\./g, '/')}/${Date.now()}.${ext}`;

  const { error: uploadError } = await client.storage
    .from('site-assets')
    .upload(storagePath, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: urlData } = client.storage
    .from('site-assets')
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  const { error: updateError } = await client
    .from('site_assets')
    .update({
      public_url: publicUrl,
      storage_path: storagePath,
      mime_type: file.type || null,
    })
    .eq('slot', slot);

  if (updateError) throw updateError;

  return publicUrl;
}
