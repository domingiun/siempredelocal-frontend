// frontend/src/pages/wallet/PurchaseCreditsPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Row, Space, Spin, Tag, Typography } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  TrophyOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import betService from '../../services/betService';
import pollaService from '../../services/pollaService';
import './PurchaseCreditsPage.css';

const { Title, Text } = Typography;

const NEQUI_NUMBER = '3218424968';
const SUPPORT_WHATSAPP = '573218424968';
const NEQUI_QR_IMAGE = '/nequi-qr.png';
const PLAN_AMOUNTS = {
  1: 5000,
  5: 24500,
  10: 48500,
};

const formatCop = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

const getPlanAmount = (plan) => PLAN_AMOUNTS[Number(plan?.credits)] || Number(plan?.final_price || 0);

const buildPaymentText = (plan, user, transactionId) => {
  const amount = getPlanAmount(plan);
  return [
    'SiempreDeLocal - Recarga de creditos',
    `Plan: ${plan?.name || ''}`,
    `Creditos: ${plan?.credits || 0}`,
    `Valor: ${formatCop(amount)} COP`,
    `Nequi / cuenta de ahorros: ${NEQUI_NUMBER}`,
    user?.username ? `Usuario: ${user.username}` : null,
    transactionId ? `Solicitud: ${transactionId}` : null,
  ].filter(Boolean).join('\n');
};

const PurchaseCreditsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return');
  const { user } = useAuth();
  const { purchaseCredits } = useWallet();
  const [plans, setPlans] = useState([]);
  const [activePolla, setActivePolla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const paymentPanelRef = useRef(null);

  useEffect(() => {
    fetchPlans();
    fetchActivePolla();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await betService.getBetPlans();
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error obteniendo planes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePolla = async () => {
    try {
      const list = await pollaService.listPollas();
      const open = list.find(p => p.status === 'open' || p.status === 'in_progress');
      if (open) setActivePolla(open);
    } catch (_) {}
  };

  const handlePurchase = async (plan) => {
    setSelectedPlan(plan);
    setPurchasing(true);

    try {
      const result = await purchaseCredits(plan.id);
      if (result.success) {
        setPaymentRequest({
          plan,
          amount: getPlanAmount(plan),
          transactionId: result.data?.transaction_id,
        });
        setTimeout(() => {
          paymentPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    } catch (error) {
      console.error('Error en recarga:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleCopyPaymentData = async () => {
    if (!paymentRequest) return;
    await navigator.clipboard.writeText(
      buildPaymentText(paymentRequest.plan, user, paymentRequest.transactionId)
    );
  };

  const getWhatsappUrl = () => {
    if (!paymentRequest) return '#';
    const plan = paymentRequest.plan;
    const amount = getPlanAmount(plan);
    const waMessage = encodeURIComponent(
      `Hola, soy *${user?.username || 'usuario'}*. Solicite una recarga en SiempreDeLocal.\n\n` +
      `Plan: *${plan.name}*\n` +
      `Creditos: *${plan.credits}*\n` +
      `Valor transferido: *${formatCop(amount)} COP*\n` +
      `Nequi / cuenta: *${NEQUI_NUMBER}*\n` +
      (paymentRequest.transactionId ? `Solicitud: *${paymentRequest.transactionId}*\n\n` : '\n') +
      'Adjunto el comprobante de pago para aprobacion.'
    );
    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${waMessage}`;
  };

  if (loading) {
    return (
      <div className="purchase-credits-page" style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <p>Cargando planes...</p>
      </div>
    );
  }

  return (
    <div className="purchase-credits-page" style={{ padding: '24px' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(returnTo || '/wallet')}
          className="btn-outline-primary"
        >
          {returnTo ? 'Volver' : 'Volver a Mi Cuenta'}
        </Button>
      </Space>

      {returnTo && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
          message="Recarga pendiente de aprobación"
          description={
            <span>
              Tu recarga queda pendiente hasta que el administrador apruebe el pago.
              Una vez aprobada, haz clic en{' '}
              <strong
                style={{ color: '#1677ff', cursor: 'pointer' }}
                onClick={() => navigate(returnTo)}
              >
                Volver a inscribirme
              </strong>{' '}
              para completar tu inscripción.
            </span>
          }
        />
      )}

      <Card className="purchase-credits-card">
        <Title level={2}>Recargar Creditos</Title>
        <Text type="secondary">
          Selecciona un plan, realiza la transferencia por Nequi y envia el comprobante por WhatsApp.
        </Text>

        {/* Plan Polla — si hay una polla activa */}
        {activePolla && (
          <div
            onClick={() => navigate(`/mundial/checkout?id=${activePolla.id}`)}
            style={{
              marginTop: 24,
              background: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(251,191,36,0.07))',
              border: '1.5px solid rgba(251,191,36,0.4)',
              borderRadius: 14,
              padding: '20px 24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(217,119,6,0.3)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: 'linear-gradient(135deg, #d97706, #fbbf24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                <TrophyOutlined style={{ color: '#fff' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.05rem' }}>
                    Plan POLLA ⚽
                  </span>
                  <Tag color="gold" style={{ fontSize: '0.7rem', margin: 0 }}>Inscripción</Tag>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 2 }}>
                  {activePolla.name} · acceso completo al torneo · 104 partidos
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '1.3rem', lineHeight: 1 }}>
                {formatCop((activePolla.entry_credits || 8) * 5000)}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 2 }}>
                {activePolla.entry_credits || 8} créditos
              </div>
              <Button
                size="small"
                style={{
                  marginTop: 8, background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.78rem',
                }}
                onClick={e => { e.stopPropagation(); navigate(`/mundial/checkout?id=${activePolla.id}`); }}
              >
                Ver plan →
              </Button>
            </div>
          </div>
        )}

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          {plans.map((plan) => {
            const amount = getPlanAmount(plan);
            const selected = selectedPlan?.id === plan.id;
            return (
              <Col xs={24} md={8} key={plan.id}>
                <Card
                  hoverable
                  className="plan-card"
                  style={{
                    border: selected ? '2px solid #1677ff' : '1px solid #e6e8ec',
                    boxShadow: selected
                      ? '0 12px 28px rgba(22, 119, 255, 0.16)'
                      : '0 8px 20px rgba(15, 23, 42, 0.08)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 14,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '18px 18px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Title level={4} style={{ margin: 0 }}>{plan.name}</Title>
                      {plan.discount_percent > 0 && (
                        <Tag color="green">-{plan.discount_percent}%</Tag>
                      )}
                    </div>
                    <Text type="secondary">Plan de creditos</Text>
                  </div>

                  <div className="plan-credits">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8 }}>
                      <Title level={2} style={{ margin: 0, color: '#1677ff' }}>
                        {plan.credits}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 14 }}>creditos</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatCop(amount)}
                    </Text>
                  </div>

                  <div style={{ flex: 1 }}>
                    <Row justify="space-between" style={{ marginBottom: 8 }}>
                      <Col><Text type="secondary">Recarga normal:</Text></Col>
                      <Col><Text>{formatCop(plan.credits * 5000)}</Text></Col>
                    </Row>

                    <Row justify="space-between" style={{ marginBottom: 8 }}>
                      <Col><Text strong>Recarga final:</Text></Col>
                      <Col>
                        <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                          {formatCop(amount)}
                        </Text>
                      </Col>
                    </Row>

                    {plan.discount_percent > 0 && (
                      <Row justify="space-between" style={{ marginBottom: 16 }}>
                        <Col><Text type="success">Beneficio:</Text></Col>
                        <Col>
                          <Text type="success">
                            {plan.discount_percent}% ({formatCop((plan.credits * 5000) - amount)})
                          </Text>
                        </Col>
                      </Row>
                    )}

                    <Row justify="space-between" style={{ marginBottom: 16 }}>
                      <Col><Text type="secondary">Valor por credito:</Text></Col>
                      <Col><Text strong>{formatCop(amount / plan.credits)}</Text></Col>
                    </Row>
                  </div>

                  <Button
                    type="default"
                    className="btn-outline-primary"
                    size="large"
                    block
                    loading={purchasing && selected}
                    onClick={() => handlePurchase(plan)}
                    icon={selected ? <CheckCircleOutlined /> : null}
                    style={{ margin: '0 18px 16px' }}
                  >
                    <strong>{purchasing && selected ? 'Generando QR...' : 'Seleccionar plan'}</strong>
                  </Button>

                  {plan.discount_percent > 0 && (
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <Text type="success">Mas beneficios</Text>
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>

        {paymentRequest && (
          <Card ref={paymentPanelRef} className="payment-qr-card" style={{ marginTop: 24 }}>
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={9}>
                <div className="payment-qr-box">
                  <img
                    alt="QR Nequi de SiempreDeLocal"
                    src={NEQUI_QR_IMAGE}
                  />
                </div>
              </Col>

              <Col xs={24} md={15}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Tag color="success" icon={<CheckCircleOutlined />}>Solicitud registrada</Tag>
                    <Title level={3} style={{ margin: '10px 0 4px' }}>
                      Haz la transferencia a este QR de Nequi
                    </Title>
                    <Text type="secondary">
                      Escanea el QR oficial de Nequi y confirma que el valor coincida con el plan seleccionado.
                    </Text>
                  </div>

                  <div className="payment-detail-grid">
                    <div>
                      <Text type="secondary">Nequi / cuenta de ahorros</Text>
                      <strong>{NEQUI_NUMBER}</strong>
                    </div>
                    <div>
                      <Text type="secondary">Plan</Text>
                      <strong>{paymentRequest.plan.name}</strong>
                    </div>
                    <div>
                      <Text type="secondary">Creditos</Text>
                      <strong>{paymentRequest.plan.credits}</strong>
                    </div>
                    <div>
                      <Text type="secondary">Valor a transferir</Text>
                      <strong>{formatCop(paymentRequest.amount)} COP</strong>
                    </div>
                  </div>

                  <Alert
                    type="info"
                    showIcon
                    message="Despues de pagar, envia el comprobante por WhatsApp."
                    description="Tu recarga queda pendiente hasta que el administrador verifique el pago y apruebe los creditos. Si prefieres, tambien puedes transferir manualmente al numero de Nequi."
                  />

                  <Space wrap>
                    <Button icon={<CopyOutlined />} onClick={handleCopyPaymentData}>
                      Copiar datos
                    </Button>
                    <Button
                      type="primary"
                      icon={<WhatsAppOutlined />}
                      href={getWhatsappUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ backgroundColor: '#25D366', borderColor: '#25D366', fontWeight: 700 }}
                    >
                      Enviar comprobante por WhatsApp
                    </Button>
                    <Button onClick={() => navigate('/wallet')}>
                      Ver mi wallet
                    </Button>
                    {returnTo && (
                      <Button
                        type="default"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(returnTo)}
                        style={{ borderColor: '#fbbf24', color: '#fbbf24' }}
                      >
                        Volver a inscribirme
                      </Button>
                    )}
                  </Space>
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        <Card className="purchase-info-card" style={{ marginTop: 18 }}>
          <Title level={4}>Informacion importante</Title>
          <ul>
            <li><strong>Selecciona el plan</strong> que prefieras: <strong>Basico, Plus o Gold</strong>.</li>
            <li>Al seleccionar el plan se registra una solicitud pendiente y veras el QR oficial de Nequi.</li>
            <li>Haz la transferencia por <strong>Nequi</strong> al numero <strong>321 842 4968</strong>.</li>
            <li><strong>Envia el comprobante por WhatsApp</strong> para aprobar la recarga.</li>
            <li><strong>Recibiras tus creditos</strong> tras la aprobacion del administrador.</li>
          </ul>
        </Card>
      </Card>
    </div>
  );
};

export default PurchaseCreditsPage;
