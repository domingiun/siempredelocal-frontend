// frontend/src/components/wallet/PurchaseCredits.jsx 
import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, Button, 
  Tag, Space, Alert, Statistic,
  Modal, Badge, Divider, Progress, Tooltip,
  notification, Spin, Avatar, Collapse
} from 'antd';
import {
  FireOutlined, DollarOutlined, GiftOutlined,
  CheckCircleOutlined, StarOutlined, CrownOutlined,
  SafetyOutlined, ThunderboltOutlined, TagOutlined,
  CalculatorOutlined, ArrowRightOutlined, InfoCircleOutlined,
  LoadingOutlined, CreditCardOutlined, BankOutlined,
  PercentageOutlined, CheckOutlined, ShoppingOutlined,
  RocketOutlined, TrophyOutlined, WalletOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import betService from '../../services/betService';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const PurchaseCredits = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet, purchaseCredits, refreshWallet } = useWallet();
  
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: 'Nequi', icon: <DollarOutlined />, enabled: true },
  ]);

  useEffect(() => {
    fetchPlansAndInfo();
  }, []);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      // Seleccionar el plan Plus por defecto, o el primero si no existe
      const plusPlan = plans.find(p => p.name.toLowerCase().includes('plus'));
      setSelectedPlan(plusPlan || plans[0]);
    }
  }, [plans]);

  const fetchPlansAndInfo = async () => {
    setLoading(true);
    try {
      // Obtener planes disponibles
      const plansRes = await betService.getBetPlans();
      console.log('📋 Planes obtenidos:', plansRes.data);
      
      const plansData = plansRes.data?.plans || [];
      
      // Enriquecer planes con cálculos adicionales
      const enrichedPlans = plansData.map(plan => ({
        ...plan,
        price_per_credit: plan.final_price / plan.credits,
        discount_percentage: plan.discount_percent || 0,
        savings: 5000 * plan.credits - plan.final_price,
        recommended: plan.name.toLowerCase().includes('gold')
      }));
      
      setPlans(enrichedPlans);
      
      // Obtener información general de créditos
      try {
        const infoRes = await betService.getCreditInfo();
        setCreditInfo(infoRes.data);
      } catch (infoError) {
        console.warn('No se pudo obtener info de créditos:', infoError);
        // Usar valores por defecto
        setCreditInfo({
          credit_price_PTS: 5000,
          prize_contribution_per_credit: 1950,
          profit_per_credit: 3050,
          required_credits_per_bet: 1,
          min_points_to_win: 13,
          max_predictions_per_bet: 10
        });
      }
      
    } catch (error) {
      console.error('Error cargando planes:', error);
      notification.error({
        message: 'Error',
        description: 'No se pudieron cargar los planes de créditos'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes('básico')) return <FireOutlined />;
    if (name.includes('plus')) return <StarOutlined />;
    if (name.includes('gold')) return <CrownOutlined />;
    if (name.includes('premium')) return <RocketOutlined />;
    return <FireOutlined />;
  };

  const getPlanColor = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes('básico')) return '#1890ff'; // Azul
    if (name.includes('plus')) return '#722ed1'; // Púrpura
    if (name.includes('gold')) return '#faad14'; // Dorado
    return '#52c41a'; // Verde
  };

  const getPlanBadge = (plan) => {
    if (plan.discount_percentage > 0) {
      return (
        <Badge 
          count={`${plan.discount_percentage}% OFF`}
          style={{ 
            backgroundColor: '#ff4d4f',
            fontSize: '10px'
          }}
        />
      );
    }
    if (plan.recommended) {
      return (
        <Badge 
          count="RECOMENDADO"
          style={{ 
            backgroundColor: '#52c41a',
            fontSize: '10px'
          }}
        />
      );
    }
    return null;
  };

  const calculateSavings = (plan) => {
    const normalPrice = 5000 * plan.credits;
    return normalPrice - plan.final_price;
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) {
      notification.warning({
        message: 'Selecciona un plan',
        description: 'Por favor selecciona un plan de creditos'
      });
      return;
    }

    setPurchasing(true);

    try {
      const result = await purchaseCredits(selectedPlan.id);

      if (result.success) {
        Modal.success({
          title: 'Solicitud registrada',
          content: (
            <div>
              <p>
                Hemos recibido tu solicitud por <strong>{selectedPlan.credits} credito(s)</strong> por{' '}
                <strong>${selectedPlan.final_price.toLocaleString()}</strong>.
              </p>
              <p style={{ textAlign: 'justify' }}>
                Realiza tu transferencia a <strong>Nequi</strong> y envia el comprobante de recarga al{' '}
                <strong>WhatsApp 321 842 4968</strong> luego de verificado se abonaran los creditos.
              </p>
              <Alert
                title={<strong>Resumen de la Recarga</strong>}
                description={
                  <Space orientation="vertical" size="small">
                    <Row justify="space-between">
                      <Text>Creditos solicitados:</Text>
                      <Text strong>{selectedPlan.credits}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text>Transferencia a Nequi por un total de:</Text>
                      <Text strong>${selectedPlan.final_price.toLocaleString()}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text>Estado:</Text>
                      <Text strong>Pendiente de aprobacion</Text>
                    </Row>
                  </Space>
                }
                type="info"
                style={{ marginTop: 16 }}
              />
            </div>
          ),
          width: 500,
          okText: 'Aceptar',
          okType: 'primary',
          okButtonProps: { style: { background: '#1890ff', borderColor: '#1890ff', color: '#fff' } },
          onOk: () => {
            refreshWallet();
            navigate('/wallet');
          }
        });
      }
    } catch (error) {
      console.error('Error en recarga:', error);
      notification.error({
        message: 'Error en la recarga',
        description: error.response?.data?.detail || 'No se pudo completar la recarga'
      });
    } finally {
      setPurchasing(false);
    }
  };

  const PlanCard = ({ plan }) => {
    const isSelected = selectedPlan?.id === plan.id;
    const savings = calculateSavings(plan);
    
    return (
      <Card
        style={{
          border: `2px solid ${isSelected ? getPlanColor(plan.name) : '#f0f0f0'}`,
          borderRadius: 12,
          cursor: 'pointer',
          transform: isSelected ? 'translateY(-4px)' : 'none',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        hoverable
        onClick={() => handleSelectPlan(plan)}
      >
        {getPlanBadge(plan) && (
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            {getPlanBadge(plan)}
          </div>
        )}
        
        <Space orientation="vertical" size="middle" style={{ width: '100%', flex: 1 }}>
          {/* Encabezado del plan */}
          <div style={{ textAlign: 'center' }}>
            <Avatar
              size={64}
              icon={getPlanIcon(plan.name)}
              style={{ 
                backgroundColor: getPlanColor(plan.name),
                marginBottom: 12
              }}
            />
            <Title level={3} style={{ margin: 0 }}>
              {plan.name}
            </Title>
            {plan.description && (
              <Text type="secondary">{plan.description}</Text>
            )}
          </div>
          
          <Divider style={{ margin: '8px 0' }} />
          
          {/* Créditos y precio */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <Title level={1} style={{ margin: 0, color: getPlanColor(plan.name) }}>
              {plan.credits}
            </Title>
            <Text type="secondary">créditos</Text>
            
            <Title level={2} style={{ margin: '16px 0 8px 0' }}>
              ${plan.final_price?.toLocaleString() || plan.price_PTS?.toLocaleString() || '0'}
            </Title>
            <Text type="secondary">pesos</Text>
          </div>
          
          {/* Ahorro */}
          {savings > 0 && (
            <Alert
              title={`Ahorras $${savings.toLocaleString()}`}
              description={
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  $5,000 por crédito individual
                </Text>
              }
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}
            />
          )}
          
          {/* Precio por crédito */}
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <CalculatorOutlined style={{ marginRight: 4 }} />
              {Math.round(plan.price_per_credit).toLocaleString()} por crédito
            </Text>
          </div>
          
          {/* Botón de selección */}
          <Button
            type={isSelected ? 'primary' : 'default'}
            block
            icon={isSelected ? <CheckOutlined /> : <ShoppingOutlined />}
            style={{
              backgroundColor: isSelected ? getPlanColor(plan.name) : undefined,
              borderColor: isSelected ? getPlanColor(plan.name) : undefined,
              marginTop: 'auto'
            }}
          >
            {isSelected ? 'Seleccionado' : 'Seleccionar'}
          </Button>
        </Space>
      </Card>
    );
  };

  const ComparisonTable = () => {
    if (plans.length <= 1) return null;
    
    return (
      <Card 
        title={
          <Space>
            <PercentageOutlined />
            <Text>Comparación de Planes</Text>
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>
                Característica
              </th>
              {plans.map(plan => (
                <th key={plan.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                  <Text strong style={{ color: getPlanColor(plan.name) }}>
                    {plan.name}
                  </Text>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>Créditos</Text>
              </td>
              {plans.map(plan => (
                <td key={plan.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                  <Title level={4} style={{ margin: 0, color: getPlanColor(plan.name) }}>
                    {plan.credits}
                  </Title>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>Precio Total</Text>
              </td>
              {plans.map(plan => (
                <td key={plan.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                  <Text strong>${plan.final_price?.toLocaleString() || plan.price_PTS?.toLocaleString() || '0'}</Text>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>Precio por Crédito</Text>
              </td>
              {plans.map(plan => (
                <td key={plan.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                  <Text>${Math.round(plan.price_per_credit).toLocaleString()}</Text>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>Descuento</Text>
              </td>
              {plans.map(plan => (
                <td key={plan.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                  {plan.discount_percentage > 0 ? (
                    <Tag color="green">{plan.discount_percentage}% OFF</Tag>
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>Ahorro</Text>
              </td>
              {plans.map(plan => (
                <td key={plan.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                  {calculateSavings(plan) > 0 ? (
                    <Text strong style={{ color: '#52c41a' }}>
                      ${calculateSavings(plan).toLocaleString()}
                    </Text>
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>
    );
  };

  const PaymentMethodsPanel = () => (
    <Card 
      title={
        <Space>
          <CreditCardOutlined />
          <Text>Métodos de Pago</Text>
        </Space>
      }
      style={{ marginTop: 24 }}
    >
      <Row gutter={[16, 16]}>
        {paymentMethods.map(method => (
          <Col xs={12} sm={6} key={method.id}>
            <Card
              size="small"
              hoverable
              style={{
                textAlign: 'center',
                opacity: method.enabled ? 1 : 0.5,
                cursor: method.enabled ? 'pointer' : 'not-allowed'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: 8 }}>
                {method.icon}
              </div>
              <Text>{method.name}</Text>
              {!method.enabled && (
                <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                  Próximamente
                </Text>
              )}
            </Card>
          </Col>
        ))}
      </Row>
      
      <Alert
        title="Pago Seguro"
        description="Todas las transacciones están protegidas con encriptación SSL. No almacenamos datos de tu tarjeta."
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        style={{ marginTop: 16 }}
      />
    </Card>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <Title level={4} style={{ marginTop: 24 }}>
          Cargando planes de créditos...
        </Title>
        <Text type="secondary">
          Obteniendo la mejor información para ti
        </Text>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Alert
          title="No hay planes disponibles"
          description="Actualmente no hay planes de créditos disponibles para recargar. Por favor, inténtalo más tarde."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Button onClick={() => navigate('/wallet')}>
          Volver a mi cajón
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Encabezado */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>
              <FireOutlined style={{ marginRight: 8 }} />
              Recargar Créditos
            </Title>
            <Text type="secondary">
              Selecciona un plan y aumenta tus oportunidades de ganar
            </Text>
          </Col>
          <Col>
            <Button 
              icon={<ArrowRightOutlined />} 
              onClick={() => navigate('/wallet')}
            >
              Volver a Mi Cuenta
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Información de créditos actual */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Title level={4}>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Información Actual
            </Title>
          </Col>
          
          <Col xs={24} sm={8}>
            <Statistic
              title="Créditos Disponibles"
              value={wallet.credits || 0}
              prefix={<FireOutlined />}
              styles={{ content: { color: wallet.credits > 0 ? '#1890ff' : '#ff4d4f' }}}
            />
          </Col>
          
          <Col xs={24} sm={8}>
            <Statistic
              title="Valor por crédito"
              value={5000}
              prefix="$"
              suffix=""
            />
          </Col>
          
          <Col xs={24} sm={8}>
            <Statistic
              title="Pronósticos Posibles"
              value={wallet.credits || 0}
              prefix={<CalculatorOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Selección de planes */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 24, textAlign: 'center' }}>
          <ShoppingOutlined style={{ marginRight: 8 }} />
          Selecciona tu Plan
        </Title>
        
        <Row gutter={[24, 24]}>
          {plans.map(plan => (
            <Col key={plan.id} xs={24} sm={12} lg={8}>
              <PlanCard plan={plan} />
            </Col>
          ))}
        </Row>
      </Card>

      {/* Plan seleccionado y recarga */}
      {selectedPlan && (
        <Card 
          style={{ 
            marginBottom: 24,
            background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
            border: '1px solid #b7eb8f'
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={16}>
              <Space orientation="vertical" size="small">
                <Title level={4}>
                  <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                  Plan Seleccionado: {selectedPlan.name}
                </Title>
                <Text strong>Realiza tu transferencia a Nequi por un Total de :</Text>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text strong>Créditos:</Text>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: getPlanColor(selectedPlan.name) }}>
                      {selectedPlan.credits}
                    </div>
                  </Col>
                  
                  <Col span={12}>
                    <Text strong>Precio:</Text>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      ${selectedPlan.final_price?.toLocaleString() || selectedPlan.price_PTS?.toLocaleString() || '0'}
                    </div>
                  </Col>
                  
                  {calculateSavings(selectedPlan) > 0 && (
                    <Col span={24}>
                      <Alert
                        title={
                          <Space>
                            <GiftOutlined />
                            <Text>
                              ¡Ahorras ${calculateSavings(selectedPlan).toLocaleString()}!
                            </Text>
                          </Space>
                        }
                        type="success"
                        showIcon={false}
                        style={{ background: 'transparent', padding: 0 }}
                      />
                    </Col>
                  )}
                </Row>
              </Space>
            </Col>
            
            <Col xs={24} md={8}>
              <Button
                type="default"
                className="btn-outline-primary"
                size="large"
                block
                icon={<ThunderboltOutlined />}
                onClick={handlePurchase}
                loading={purchasing}
                style={{
                  height: '60px',
                  fontSize: '18px'
                }}
              >
                {purchasing ? 'Procesando...' : ' Recargar Ahora'}
              </Button>
              
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                <SafetyOutlined style={{ marginRight: 4 }} />
                Recarga 100% segura
              </Text>
            </Col>
          </Row>
        </Card>
      )}

      {/* Preguntas frecuentes */}
      <Collapse ghost style={{ marginTop: 24 }}>
         <Panel header="¿Cómo recargar créditos?" key="1">
          <Space orientation="vertical" size="small">
            <Text>1. <strong>Selecciona tu plan:</strong> Básico, Plus o Gold.</Text>
            <Text>2. <strong>Haz clic en "Recargar Ahora"</strong> para proceder.</Text>
            <Text>3. <strong>Contáctanos por WhatsApp</strong> al número <strong>321 842 4968</strong> para recibir las instrucciones de pago.</Text>
            <Text>4. <strong>Recibirás tus créditos</strong> en los próximos minutos tras la aprobación de tu recarga.</Text>
            <Text>5. <strong>Nuestro equipo de soporte</strong> estará disponible para resolver cualquier duda o inquietud.</Text>
          </Space>
        </Panel>

        <Panel header="¿Cómo funcionan los créditos?" key="2">
          <Space orientation="vertical" size="small">
            <Text>• <strong>1 crédito = $5,000</strong></Text>
            <Text>• <strong>1 apuesta = 1 crédito</strong></Text>
            <Text>• <strong>No puedes convertir tus créditos a Puntos</strong></Text>
            <Text>• <strong>Los créditos no expiran</strong></Text>
          </Space>
        </Panel>
        
        <Panel header="¿Por qué recargar paquetes más grandes?" key="3">
          <Space orientation="vertical" size="small">
            <Text>• <strong>Ahorras dinero:</strong> ahorro del 2% al 3%</Text>
            <Text>• <strong>Menos transacciones:</strong> Recarga una vez, apuesta muchas veces</Text>
            <Text>• <strong>Mejor control:</strong> Administra tu presupuesto de pronósticos</Text>
            <Text>• <strong>Oportunidades:</strong> Más créditos = más oportunidades de ganar</Text>
          </Space>
        </Panel>
        
        <Panel header="¿Es seguro recargar créditos?" key="4">
          <Space orientation="vertical" size="small">
            <Text>• <strong>Tus datos están protegidos</strong></Text>
            <Text>• <strong>Sin almacenamiento:</strong> de informacion Personal</Text>
            <Text>• <strong>Transacciones auditadas:</strong> Todas las operaciones son registradas</Text>
            <Text>• <strong>Soporte 24/7:</strong> Ayuda disponible en cualquier momento</Text>
          </Space>
        </Panel>
      </Collapse>

      {/* Información adicional */}
      <Alert
        title="Información Importante"
        description={
          <Space orientation="vertical" size="small">
            <Text>• Los créditos son válidos indefinidamente, no caducan</Text>
            <Text>• Los créditos no serán reembolsados ni devueltos</Text>
            <Text>• Los créditos no pueden ser cambiados por Puntos</Text>
            <Text>• Para soporte: soporte@CRP.com</Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginTop: 24 }}
      />

      {/* Botón de cancelar */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Button 
          onClick={() => navigate('/wallet')}
          size="large"
        >
          Cancelar y Volver
        </Button>
      </div>
    </div>
  );
};

export default PurchaseCredits;



