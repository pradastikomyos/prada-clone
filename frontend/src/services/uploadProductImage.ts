import { requireSupabaseClient } from '../lib/supabase';

/**
 * Upload a product image to Storage and create the matching product_images row.
 */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const client = requireSupabaseClient();

  // TODO: Kiro — pastikan bucket `product-images` ada dan RLS allow admin upload.
  const ext = file.name.split('.').pop() || 'bin';
  const storagePath = `products/${productId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await client.storage
    .from('product-images')
    .upload(storagePath, file, { upsert: true, contentType: file.type || 'application/octet-stream' });

  if (uploadError) throw uploadError;

  const { data: urlData } = client.storage.from('product-images').getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  const { error: insertError } = await client.from('product_images').insert({
    product_id: productId,
    image_url: publicUrl,
    storage_path: storagePath,
    alt: file.name,
    sort_order: 0,
  });

  if (insertError) throw insertError;

  return publicUrl;
}
