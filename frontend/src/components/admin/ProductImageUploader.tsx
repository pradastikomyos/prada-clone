import { useEffect, useRef, useState } from 'react';
import { uploadProductImage } from '../../services/uploadProductImage';

type ProductImageUploaderProps = {
  productId: string | null;
  existingImages: Array<{ id: string; image_url: string; alt: string }>;
  onImagesChange: () => void;
};

export function ProductImageUploader({ productId, existingImages, onImagesChange }: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsUploading(false);
  }, [productId]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !productId) {
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await uploadProductImage(file, productId);
      setSuccessMessage('Gambar berhasil diunggah.');
      onImagesChange();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal mengunggah gambar.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <section className="product-img-uploader">
      <div className="product-img-uploader__header">
        <div>
          <p className="admin-eyebrow">Product Images</p>
          <h3>Upload Gambar</h3>
          <p className="admin-muted">Tambahkan beberapa gambar untuk kartu produk dan halaman detail.</p>
        </div>
      </div>

      {productId ? (
        <>
          <div className="product-img-uploader__grid">
            {existingImages.length > 0 ? (
              existingImages.map((image) => (
                <figure key={image.id} className="product-img-uploader__thumb">
                  <img src={image.image_url} alt={image.alt} />
                </figure>
              ))
            ) : (
              <div className="product-img-uploader__empty">Belum ada gambar</div>
            )}
          </div>

          <div className="product-img-uploader__actions">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
              aria-label="Upload product image"
            />
            <button
              type="button"
              className="product-img-uploader__button product-img-uploader__button--primary"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Gambar'}
            </button>
            <span className="product-img-uploader__message">PNG, JPG, WEBP</span>
          </div>

          {successMessage ? <p className="product-img-uploader__success">{successMessage}</p> : null}
          {errorMessage ? <p className="product-img-uploader__error">{errorMessage}</p> : null}
        </>
      ) : (
        <p className="product-img-uploader__message">Simpan produk dulu sebelum upload gambar</p>
      )}
    </section>
  );
}
