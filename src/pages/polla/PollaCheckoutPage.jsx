// frontend/src/pages/polla/PollaCheckoutPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Spin, message, Space } from 'antd';
import {
  TrophyOutlined, ArrowLeftOutlined, CheckCircleOutlined,
  CopyOutlined, WhatsAppOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import pollaService from '../../services/pollaService';

const NEQUI_NUMBER   = '3218424968';
const WHATSAPP_NUM   = '573218424968';
const NEQUI_QR_IMAGE = '/nequi-qr.png';

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

export default function PollaCheckoutPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const pollaId        = Number(searchParams.get('id'));
  const { user }       = useAuth();

  const [polla,       setPolla]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [purchasing,  setPurchasing]  = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const paymentRef = useRef(null);

  useEffect(() => {
    if (!pollaId) { navigate('/mundial/dashboard'); return; }
    pollaService.getPolla(pollaId)
      .then(setPolla)
      .catch(() => navigate('/mundial/dashboard'))
      .finally(() => setLoading(false));
  }, [pollaId]);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const res = await pollaService.purchasePollaEntry(pollaId);
      setPaymentInfo(res);
      setTimeout(() => paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      message.error(typeof detail === 'string' ? detail : 'Error al registrar la solicitud');
    } finally {
      setPurchasing(false);
    }
  };

  const buildWhatsapp = () => {
    if (!paymentInfo) return '#';
    const txt = encodeURIComponent(
      `Hola, soy *${user?.username || 'usuario'}*. Solicité recarga para inscripción en la Polla Mundial.\n\n` +
      `Créditos: *${paymentInfo.credits}*\n` +
      `Valor: *${fmtCOP(paymentInfo.amount_cop)}*\n` +
      `Nequi: *${NEQUI_NUMBER}*\n` +
      (paymentInfo.transaction_id ? `Solicitud: *${paymentInfo.transaction_id}*\n\n` : '\n') +
      'Adjunto el comprobante de pago.'
    );
    return `https://wa.me/${WHATSAPP_NUM}?text=${txt}`;
  };

  const handleCopy = async () => {
    if (!paymentInfo) return;
    await navigator.clipboard.writeText(
      `Recarga Polla Mundial\nCréditos: ${paymentInfo.credits}\nValor: ${fmtCOP(paymentInfo.amount_cop)}\nNequi: ${NEQUI_NUMBER}\nReferencia: #${paymentInfo.transaction_id}`
    );
    message.success('Datos copiados');
  };

  if (loading) return (
    <div style={{ padding: 80, textAlign: 'center' }}><Spin size="large" /></div>
  );

  const entryCredits = polla?.entry_credits || 8;
  const amountCop    = entryCredits * 5_000;

  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '24px 16px' }}>

      {/* Back */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/mundial')}
        style={{ marginBottom: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
      >
        Volver a la polla
      </Button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #d97706, #fbbf24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>
          <TrophyOutlined style={{ color: '#fff' }} />
        </div>
        <h1 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.45rem', margin: '0 0 8px' }}>
          Inscripción — {polla?.name || 'Polla Mundial 2026'}
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
          Recarga los créditos necesarios y el admin aprobará tu pago
        </p>
      </div>

      {!paymentInfo ? (
        /* ── Plan card ── */
        <div style={{
          background: 'linear-gradient(135deg, rgba(217,119,6,0.10), rgba(251,191,36,0.05))',
          border: '1px solid rgba(251,191,36,0.28)',
          borderRadius: 22, padding: '32px 28px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Plan único · acceso completo
          </div>
          <h2 style={{ color: '#f1f5f9', fontSize: '1.8rem', fontWeight: 900, margin: '0 0 4px' }}>
            Plan POLLA ⚽
          </h2>
          <p style={{ color: '#94a3b8', margin: '0 0 28px', fontSize: '0.88rem' }}>
            {polla?.name || 'Mundial 2026'} — una sola inscripción para todo el torneo
          </p>

          {/* Credits badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'baseline', gap: 8,
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
            borderRadius: 50, padding: '8px 24px', marginBottom: 28,
          }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>{entryCredits}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>créditos</span>
          </div>

          {/* Feature list */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '18px 20px',
            marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 11,
          }}>
            {[
              ['Acceso completo al torneo',      '✓'],
              ['104 partidos para predecir',     '✓'],
              ['Ranking y puntos en tiempo real','✓'],
              ['Bonificaciones por fase',        '✓'],
              ['Premio mínimo garantizado',      '$1.000.000 COP'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{label}</span>
                <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ color: '#475569', fontSize: '0.72rem', marginBottom: 4 }}>valor único a pagar por Nequi</div>
            <div style={{ color: '#f1f5f9', fontSize: '2.4rem', fontWeight: 900, lineHeight: 1 }}>
              {fmtCOP(amountCop)}
            </div>
          </div>

          <Button
            size="large"
            block
            loading={purchasing}
            onClick={handlePurchase}
            style={{
              background: 'linear-gradient(135deg, #d97706, #f59e0b)',
              border: 'none', color: '#fff', fontWeight: 800,
              fontSize: '1rem', height: 54, borderRadius: 14,
              boxShadow: '0 4px 20px rgba(217,119,6,0.4)',
            }}
          >
            {purchasing ? 'Registrando solicitud…' : `Seleccionar — ${fmtCOP(amountCop)}`}
          </Button>

          <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: 14, marginBottom: 0 }}>
            Pago manual por Nequi · el admin aprueba en minutos
          </p>
        </div>

      ) : (
        /* ── Payment instructions ── */
        <div ref={paymentRef}>
          {/* Success banner */}
          <div style={{
            background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 14, padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 22, flexShrink: 0 }} />
            <div>
              <div style={{ color: '#22c55e', fontWeight: 700 }}>¡Solicitud registrada!</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                Referencia #{paymentInfo.transaction_id} · El admin aprobará al confirmar el pago
              </div>
            </div>
          </div>

          {/* QR + details */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 24, marginBottom: 20,
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img src={NEQUI_QR_IMAGE} alt="QR Nequi" style={{ width: 164, height: 164, borderRadius: 14 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                ['Nequi / cuenta de ahorros', NEQUI_NUMBER,                      '#f1f5f9'],
                ['Créditos',                  `${paymentInfo.credits} créditos`, '#fbbf24'],
                ['Valor a transferir',        fmtCOP(paymentInfo.amount_cop),    '#22c55e'],
                ['Referencia',                `#${paymentInfo.transaction_id}`,  '#60a5fa'],
              ].map(([label, val, color]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{label}</span>
                  <span style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            <Button
              size="large" block
              icon={<WhatsAppOutlined />}
              href={buildWhatsapp()}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#fff', fontWeight: 700, height: 50 }}
            >
              Enviar comprobante por WhatsApp
            </Button>

            <Button
              block icon={<CopyOutlined />}
              onClick={handleCopy}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
            >
              Copiar datos de pago
            </Button>

            {/* Return to join */}
            <div style={{
              background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)',
              borderRadius: 14, padding: '18px 20px', textAlign: 'center', marginTop: 6,
            }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: 4 }}>
                ¿Ya te aprobaron la recarga?
              </div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 14 }}>
                Cuando el admin apruebe tu pago, haz clic aquí para completar la inscripción
              </div>
              <Button
                icon={<TrophyOutlined />}
                onClick={() => navigate('/mundial?join=true')}
                style={{ background: '#d97706', borderColor: '#b45309', color: '#fff', fontWeight: 700 }}
              >
                Volver a inscribirme →
              </Button>
            </div>
          </Space>
        </div>
      )}
    </div>
  );
}
