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
    <div className="cms-asset-card">
      <div className="cms-asset-header">
        <strong className="cms-asset-label">{label}</strong>
        <code className="cms-asset-slot">{slot}</code>
      </div>

      <div className="cms-asset-preview">
        {displayUrl ? (
          displayIsVideo ? (
            <video
              key={displayUrl}
              src={displayUrl}
              controls
              muted
              playsInline
              className="cms-asset-media"
            />
          ) : (
            <img
              key={displayUrl}
              src={displayUrl}
              alt={label}
              className="cms-asset-media"
            />
          )
        ) : (
          <div className="cms-asset-empty">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>No asset set</span>
          </div>
        )}
      </div>

      <div className="cms-asset-controls">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          aria-label={`Upload file for ${label}`}
        />

        <div className="cms-asset-btn-row">
          <button
            type="button"
            className="cms-btn cms-btn--secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload File
          </button>
          <button
            type="button"
            className={`cms-btn ${hasPending && !isSaving ? 'cms-btn--primary' : 'cms-btn--disabled'}`}
            onClick={handleSave}
            disabled={!hasPending || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <input
          type="text"
          className="cms-url-input"
          placeholder="Or paste URL…"
          value={pendingUrl}
          onChange={handleUrlChange}
          disabled={isSaving}
          aria-label={`Paste URL for ${label}`}
        />
      </div>

      {pendingFile && (
        <p className="admin-muted" style={{ margin: 0, fontSize: 12 }}>
          Pending: {pendingFile.name} ({(pendingFile.size / 1024).toFixed(1)} KB)
        </p>
      )}

      {status === 'success' && (
        <p className="admin-success" style={{ margin: 0 }}>
          ✓ Saved successfully.
        </p>
      )}
      {status === 'error' && (
        <p className="admin-error" style={{ margin: 0 }}>
          Error: {errorMessage}
        </p>
      )}
    </div>
  );
}
