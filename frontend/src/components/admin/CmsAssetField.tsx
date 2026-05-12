import { useRef, useState } from 'react';
import type { SiteAssetSlot } from '../../services/siteAssets';

type CmsAssetFieldProps = {
  slot: SiteAssetSlot;
  label: string;
  currentUrl: string;
  mimeType: string | null;
  onSave: (file: File | null, pastedUrl: string | null) => Promise<void>;
  isSaving: boolean;
};

/**
 * CmsAssetField — reusable field for managing a single CMS asset slot.
 *
 * Shows:
 * - Label
 * - Current asset preview (video or image)
 * - File picker button
 * - Paste URL input
 * - Save button (disabled when no pending change)
 * - Inline loading / success / error feedback
 */
export function CmsAssetField({
  slot,
  label,
  currentUrl,
  mimeType,
  onSave,
  isSaving,
}: CmsAssetFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingUrl, setPendingUrl] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const hasPending = pendingFile !== null || pendingUrl.trim() !== '';

  const isVideo = (mime: string | null, src: string) => {
    if (mime) return mime.startsWith('video/');
    return /\.(mp4|webm|ogg|mov)$/i.test(src);
  };

  const displayUrl = previewSrc ?? currentUrl;
  const displayIsVideo = isVideo(pendingFile ? pendingFile.type : mimeType, displayUrl);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingUrl('');
    setPreviewSrc(URL.createObjectURL(file));
    setStatus('idle');
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPendingUrl(val);
    setPendingFile(null);
    setPreviewSrc(val.trim() ? val.trim() : null);
    setStatus('idle');
  };

  const handleSave = async () => {
    if (!hasPending) return;
    setStatus('idle');
    setErrorMessage('');
    try {
      if (pendingFile) {
        await onSave(pendingFile, null);
      } else {
        await onSave(null, pendingUrl.trim());
      }
      setStatus('success');
      setPendingFile(null);
      setPendingUrl('');
      setPreviewSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  return (
    <div className="admin-cms-field">
      <p className="admin-cms-label">
        <strong>{label}</strong>
        <span className="admin-muted">{slot}</span>
      </p>

      <div className={`admin-cms-preview ${displayIsVideo ? 'admin-cms-preview--video' : 'admin-cms-preview--image'}`}>
        {displayUrl ? (
          displayIsVideo ? (
            <video
              key={displayUrl}
              src={displayUrl}
              controls
              muted
              playsInline
              style={{ maxWidth: '100%', maxHeight: '200px' }}
            />
          ) : (
            <img
              key={displayUrl}
              src={displayUrl}
              alt={label}
              style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
            />
          )
        ) : (
          <span className="admin-muted">No asset set</span>
        )}
      </div>

      <div className="admin-cms-actions">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          aria-label={`Upload file for ${label}`}
        />
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSaving}
        >
          Upload File
        </button>

        <input
          type="text"
          className="admin-cms-url-input"
          placeholder="Or paste URL…"
          value={pendingUrl}
          onChange={handleUrlChange}
          disabled={isSaving}
          aria-label={`Paste URL for ${label}`}
        />

        <button
          type="button"
          className="admin-cms-save-btn"
          onClick={handleSave}
          disabled={!hasPending || isSaving}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {pendingFile && (
        <p className="admin-cms-status admin-muted">
          Pending: {pendingFile.name} ({(pendingFile.size / 1024).toFixed(1)} KB)
        </p>
      )}

      {status === 'success' && (
        <p className="admin-cms-status" style={{ color: 'var(--color-success, #22c55e)' }}>
          Saved successfully.
        </p>
      )}
      {status === 'error' && (
        <p className="admin-cms-status" style={{ color: 'var(--color-error, #ef4444)' }}>
          Error: {errorMessage}
        </p>
      )}
    </div>
  );
}
