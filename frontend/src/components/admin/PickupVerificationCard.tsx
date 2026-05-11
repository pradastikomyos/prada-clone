import { FormEvent, useState } from 'react';
import { QrCodeScanIcon, InformationCircleIcon, Camera02Icon } from '@hugeicons/core-free-icons';
import { AdminIcon } from './AdminIcon';

type PickupVerificationCardProps = {
  pickupCode: string;
  error?: Error | null;
  isPending: boolean;
  isVerified: boolean;
  onPickupCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function PickupVerificationCard({
  pickupCode,
  error,
  isPending,
  isVerified,
  onPickupCodeChange,
  onSubmit,
}: PickupVerificationCardProps) {
  const [isScannerActive, setIsScannerActive] = useState(false);

  return (
    <div className="admin-bopis-container">
      {/* Header Section */}
      <header className="admin-bopis-header">
        <div>
          <h2 className="admin-bopis-title">Scan Pickup Produk</h2>
          <p className="admin-muted">Pindai kode QR pickup untuk menyelesaikan pengambilan produk in-store.</p>
        </div>
        <div className="admin-bopis-badge">
          <span className="admin-status-dot" style={{ backgroundColor: '#16A34A' }} />
          Siap Memindai
        </div>
      </header>

      {/* Main Scanner Area */}
      <section className="admin-bopis-scanner-box">
        <div className="admin-bopis-scanner-icon">
          <AdminIcon icon={QrCodeScanIcon} size={32} />
        </div>
        <h3>Scan Pickup Produk</h3>
        <p className="admin-muted">Klik tombol di bawah untuk mengaktifkan kamera dan pindai kode QR pickup pada pesanan produk, atau masukkan kode secara manual.</p>
        
        {isScannerActive ? (
          <div className="admin-bopis-camera-placeholder">
            <p>Meminta akses kamera...</p>
            <button type="button" onClick={() => setIsScannerActive(false)} className="admin-bopis-cancel">Batalkan</button>
          </div>
        ) : (
          <button type="button" className="admin-bopis-activate-btn" onClick={() => setIsScannerActive(true)}>
            <AdminIcon icon={Camera02Icon} size={18} />
            Aktifkan Pemindai
          </button>
        )}

        <div className="admin-bopis-divider">
          <span>ATAU INPUT MANUAL</span>
        </div>

        <form onSubmit={onSubmit} className="admin-bopis-manual-form">
          <div className="admin-bopis-input-group">
            <input 
              value={pickupCode} 
              onChange={(event) => onPickupCodeChange(event.target.value.toUpperCase())} 
              placeholder="Contoh: PRX-9C1-984" 
            />
            <button type="submit" disabled={isPending || !pickupCode}>
              {isPending ? 'Memverifikasi...' : 'Verifikasi'}
            </button>
          </div>
          {error ? <p className="admin-error" style={{ marginTop: '12px', textAlign: 'center' }}>{error.message}</p> : null}
          {isVerified ? <p className="admin-success" style={{ marginTop: '12px', textAlign: 'center' }}>Verifikasi berhasil! Produk dapat diserahkan.</p> : null}
        </form>
      </section>

      {/* Instructions Box */}
      <section className="admin-bopis-instructions">
        <div className="admin-bopis-instructions-header">
          <AdminIcon icon={InformationCircleIcon} size={20} />
          <strong>Cara Menggunakan</strong>
        </div>
        <ul>
          <li>Klik <strong>"Aktifkan Pemindai"</strong> untuk membuka kamera perangkat Anda.</li>
          <li>Arahkan kamera ke kode QR pickup yang ditunjukkan oleh pelanggan.</li>
          <li>Tunggu sistem memproses data pesanan secara otomatis.</li>
          <li>Pesan <strong>hijau</strong> menandakan pickup valid dan berhasil diverifikasi. Pesan <strong>merah</strong> menandakan kode tidak valid.</li>
          <li>Jika pelanggan tidak memiliki QR, gunakan kolom input manual untuk memasukkan ID pesanan.</li>
        </ul>
      </section>
    </div>
  );
}
