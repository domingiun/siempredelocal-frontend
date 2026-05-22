import { useEffect, useRef, useState } from 'react';

export { }; // mantiene compatibilidad de módulo
export default function PromoModal({ onClose }) {
  const iframeRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data === 'promo-skip') close();
    };
    window.addEventListener('message', handleMessage);
    setTimeout(() => setVisible(true), 50);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity .3s',
      }}
    >
      <div style={{
        width: 360, height: 640,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        transform: visible ? 'scale(1)' : 'scale(0.92)',
        transition: 'transform .3s',
      }}>
        <iframe
          ref={iframeRef}
          src="/promo_polla_mundial.html"
          width="360"
          height="640"
          scrolling="no"
          style={{ border: 'none', display: 'block', overflow: 'hidden' }}
          title="Polla Mundial 2026"
        />
      </div>
    </div>
  );
}

export { STORAGE_KEY };
