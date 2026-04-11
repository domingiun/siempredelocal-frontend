// frontend/src/pages/wallet/PurchaseCreditsPage.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Alert, Spin, Modal, Tag } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import betService from '../../services/betService';
import './PurchaseCreditsPage.css';

const { Title, Text } = Typography;

const PurchaseCreditsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { purchaseCredits } = useWallet();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchPlans();
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

  const handlePurchase = async (plan) => {
    setSelectedPlan(plan);
    setPurchasing(true);
    
    try {
      const result = await purchaseCredits(plan.id);
      if (result.success) {
        const waMessage = encodeURIComponent(
          `Hola, soy *${user?.username || 'usuario'}* y acabo de solicitar una recarga de *${plan.credits} créditos* por $${plan.final_price.toLocaleString()} COP en SiempreDeLocal. Adjunto el comprobante de pago para su verificación.`
        );
        const waUrl = `https://wa.me/573218424968?text=${waMessage}`;

        Modal.success({
          title: '¡Solicitud de recarga enviada!',
          width: 480,
          content: (
            <div style={{ lineHeight: 1.7 }}>
              <p>Tu solicitud de <strong>{plan.credits} créditos</strong> por <strong>${plan.final_price.toLocaleString()} COP</strong> fue registrada correctamente.</p>
              <p style={{ marginBottom: 4 }}>Para completar la recarga debes:</p>
              <ol style={{ paddingLeft: 20, marginBottom: 12 }}>
                <li>Realizar el pago por <strong>Nequi</strong> al número registrado.</li>
                <li>Enviar el comprobante de pago por <strong>WhatsApp</strong> al número de soporte.</li>
                <li>Una vez verificado, los créditos se acreditarán a tu cuenta.</li>
              </ol>
              <p style={{ fontSize: 12, color: '#888' }}>
                La transacción aparecerá como <strong>"Pendiente"</strong> en tu historial hasta ser autorizada por el administrador.
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8,
                  padding: '10px 20px',
                  backgroundColor: '#25D366',
                  color: '#fff',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                📲 Enviar comprobante por WhatsApp
              </a>
            </div>
          ),
          okText: 'Ver mi wallet',
          okButtonProps: {
            style: {
              backgroundColor: '#0b1e5b',
              borderColor: '#0b1e5b',
              color: '#ffffff',
              fontWeight: 700
            }
          },
          onOk: () => navigate('/wallet'),
        });
      }
    } catch (error) {
      console.error('Error en recarga:', error);
    } finally {
      setPurchasing(false);
    }
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
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/wallet')}
        className="btn-outline-primary"
        style={{ marginBottom: 16 }}
      >
        Volver a Mi Cuenta
      </Button>

      <Card className="purchase-credits-card">
        <Title level={2}>Recargar Créditos</Title>
        <Text type="secondary">
          Selecciona un plan para recargar créditos y comenzar a pronosticar
        </Text>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          {plans.map(plan => (
            <Col xs={24} md={8} key={plan.id}>
              <Card
                hoverable
                className="plan-card"
                style={{
                  border: selectedPlan?.id === plan.id ? '2px solid #1677ff' : '1px solid #e6e8ec',
                  boxShadow: selectedPlan?.id === plan.id 
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
                  <Text type="secondary">Plan de créditos</Text>
                </div>

                <div
                  className="plan-credits"
                  style={{
                    margin: '0 18px 16px',
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #f5f9ff 0%, #f0f7ff 100%)',
                    border: '1px solid #d6e4ff',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8 }}>
                    <Title level={2} style={{ margin: 0, color: '#1677ff' }}>
                      {plan.credits}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>créditos</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ${plan.final_price.toLocaleString()}
                  </Text>
                </div>

                <div style={{ flex: 1 }}>
                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <Col><Text type="secondary">Recarga normal:</Text></Col>
                    <Col><Text>${(plan.credits * 5000).toLocaleString()}</Text></Col>
                  </Row>
                  
                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <Col><Text strong>Recarga final:</Text></Col>
                    <Col><Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                      ${plan.final_price.toLocaleString()}
                    </Text></Col>
                  </Row>
                  
                  {plan.discount_percent > 0 && (
                    <Row justify="space-between" style={{ marginBottom: 16 }}>
                      <Col><Text type="success">Beneficio:</Text></Col>
                      <Col>
                        <Text type="success">
                          {plan.discount_percent}% (${((plan.credits * 5000) - plan.final_price).toLocaleString()})
                        </Text>
                      </Col>
                    </Row>
                  )}

                  <Row justify="space-between" style={{ marginBottom: 16 }}>
                    <Col><Text type="secondary">Puntos por crédito:</Text></Col>
                    <Col>
                      <Text strong>
                        ${(plan.final_price / plan.credits).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </Text>
                    </Col>
                  </Row>
                </div>

                <Button
                  type="default"
                  className="btn-outline-primary"
                  size="large"
                  block
                  loading={purchasing && selectedPlan?.id === plan.id}
                  onClick={() => handlePurchase(plan)}
                  icon={selectedPlan?.id === plan.id ? <CheckCircleOutlined /> : null}
                  style={{ margin: '0 18px 16px' }}
                >
                  <strong>{selectedPlan?.id === plan.id ? 'Comprando...' : 'Seleccionar Plan Recarga'}</strong>
                </Button>

                {plan.discount_percent > 0 && (
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <Text type="success">¡MÁS BENEFICIOS!</Text>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>

        <Card className="purchase-info-card" style={{ marginTop: 18 }}>
          <Title level={4}>Información importante</Title>
          <ul>
            <li><strong>Selecciona el plan</strong> que prefieras: <strong>Básico, Plus o Gold</strong>.</li>
            <li>Haz click en <strong> "Recargar Ahora" </strong>para proceder.</li>
            <li><strong>Contáctanos por WhatsApp</strong> al número <strong>321 842 4968</strong> para recibir las instrucciones de tu recarga.</li>
            <li><strong>Recibirás tus créditos</strong> en los próximos minutos tras la aprobación de la recarga.</li>
            <li><strong>Nuestro equipo de soporte</strong> estará disponible para resolver cualquier duda o inquietud.</li>
          </ul>
        </Card>
      </Card>
    </div>
  );
};

export default PurchaseCreditsPage;

