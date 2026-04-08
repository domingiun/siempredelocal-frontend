// frontend/src/components/wallet/WalletBalance.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, Button, 
  Statistic, Tag, Space, Alert, Spin,
  Progress, Avatar, Divider, Modal,
  Badge, Tooltip, Popover, notification,
  InputNumber, Radio
} from 'antd';
import {
  WalletOutlined, DollarOutlined, FireOutlined,
  CreditCardOutlined, ArrowUpOutlined, ArrowDownOutlined,
  HistoryOutlined, GiftOutlined, TrophyOutlined,
  InfoCircleOutlined, ReloadOutlined, PlusCircleOutlined,
  BankOutlined, SafetyOutlined, StarOutlined,
  SettingOutlined, DownloadOutlined, QuestionCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import betService from '../../services/betService';
import { formatPrize } from '../../utils/betCalculations';
import './WalletBalance.css';

const { Title, Text } = Typography;

const WalletBalance = ({ compact = false, showActions = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    wallet, 
    transactions, 
    loading, 
    refreshing, 
    refreshWallet,
    convertToCash,
    requestPointsToCredits,
    requestWithdrawPoints
  } = useWallet();
  
  const [converting, setConverting] = useState(false);
  const [conversionAmount, setConversionAmount] = useState(10);
  const [creditInfo, setCreditInfo] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemType, setRedeemType] = useState('credits');
  const [pointsToConvert, setPointsToConvert] = useState(5000);
  const [withdrawAmount, setWithdrawAmount] = useState(20000);
  const [redeemSubmitting, setRedeemSubmitting] = useState(false);
  const [stats, setStats] = useState({
    win_rate: 0,
    avg_points: 0,
    total_won: 0,
    total_bets: 0,
    wins: 0
  });

  useEffect(() => {
    if (user) {
      fetchCreditInfo();
      fetchUserStats();
      processRecentActivity();
    }
  }, [user, transactions]);

  const fetchCreditInfo = async () => {
    try {
      const response = await betService.getCreditInfo();
      setCreditInfo(response.data);
    } catch (error) {
      console.error('Error obteniendo info de créditos:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await betService.getUserStatus(user.id);
      if (response.data) {
        const totalBets = response.data.total_bets || 0;
        const wins = response.data.wins || 0;
        const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0;
        setStats({
          win_rate: winRate,
          avg_points: response.data.average_points || response.data.avg_points || 0,
          total_won: response.data.total_prizes_won || response.data.total_won || 0,
          total_bets: totalBets,
          wins
        });
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
  };

  const processRecentActivity = () => {
    if (transactions && transactions.length > 0) {
      const recent = transactions
        .slice(0, 5)
        .map(tx => ({
          id: tx.id,
          type: tx.transaction_type,
          amount: tx.amount,
          credits: tx.credits_affected,
          date: new Date(tx.created_at).toLocaleDateString('es-ES'),
          status: tx.status,
          description: getTransactionDescription(tx)
        }));
      setRecentActivity(recent);
    }
  };

  const getTransactionDescription = (transaction) => {
    const types = {
      'CREDIT_PURCHASE': 'Recarga de créditos',
      'BET_PLACEMENT': 'Pronósticos realizados',
      'PRIZE_WIN': 'Premio ganado',
      'CREDIT_CONVERSION': 'Conversión a Puntos',
      'WITHDRAWAL': 'Retiro de fondos',
      'REFUND': 'Reembolso'
    };
    
    return types[transaction.transaction_type] || transaction.transaction_type;
  };

  const getTransactionColor = (type) => {
    const positiveTypes = ['CREDIT_PURCHASE', 'PRIZE_WIN', 'REFUND'];
    const negativeTypes = ['BET_PLACEMENT', 'CREDIT_CONVERSION', 'WITHDRAWAL'];
    
    if (positiveTypes.includes(type)) return 'green';
    if (negativeTypes.includes(type)) return 'red';
    return 'blue';
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'CREDIT_PURCHASE': return <PlusCircleOutlined />;
      case 'BET_PLACEMENT': return <FireOutlined />;
      case 'PRIZE_WIN': return <TrophyOutlined />;
      case 'CREDIT_CONVERSION': return <DollarOutlined />;
      default: return <HistoryOutlined />;
    }
  };

  const handleConvertToCash = async () => {
    if (conversionAmount > wallet.credits) {
      notification.warning({
        message: 'Créditos insuficientes',
        description: `Solo tienes ${wallet.credits} créditos disponibles`
      });
      return;
    }

    if (conversionAmount < 5) {
      notification.warning({
        message: 'Mínimo 5 créditos',
        description: 'El mínimo para conversión es 5 créditos'
      });
      return;
    }

    setConverting(true);
    try {
      const result = await convertToCash(conversionAmount);
      if (result.success) {
        notification.success({
          title: '¡Conversión exitosa!',
          description: `Convertiste ${conversionAmount} créditos a $${result.data.amount_PTS.toLocaleString()} PTS`
        });
        
        // Resetear cantidad
        setConversionAmount(10);
        
        // Actualizar datos
        refreshWallet();
      }
    } catch (error) {
      console.error('Error en conversión:', error);
    } finally {
      setConverting(false);
    }
  };

  const handlePurchaseCredits = () => {
    navigate('/purchase');
  };

  const handleViewHistory = () => {
    navigate('/transactions');
  };

  const handleWithdraw = () => {
    setRedeemOpen(true);
  };

  const handleRedeemSubmit = async () => {
    const balancePts = Number(wallet.balance_PTS || 0);
    setRedeemSubmitting(true);
    try {
      if (redeemType === 'credits') {
        if (pointsToConvert < 5000) {
          notification.warning({ message: 'Minimo 5,000 PTS para convertir a creditos' });
          return;
        }
        if (pointsToConvert % 5000 !== 0) {
          notification.warning({ message: 'Los puntos deben ser multiplo de 5,000 PTS' });
          return;
        }
        if (pointsToConvert > balancePts) {
          notification.warning({ message: 'Saldo insuficiente' });
          return;
        }
        const result = await requestPointsToCredits(pointsToConvert, 5000);
        if (result?.success) {
          setRedeemOpen(false);
          refreshWallet();
        }
      } else {
        if (withdrawAmount < 20000) {
          notification.warning({ message: 'El retiro minimo es 20,000 PTS' });
          return;
        }
        if (withdrawAmount > 1000000) {
          notification.warning({ message: 'El retiro maximo es 1,000,000 PTS' });
          return;
        }
        if (withdrawAmount > balancePts) {
          notification.warning({ message: 'Saldo insuficiente' });
          return;
        }
        const result = await requestWithdrawPoints(withdrawAmount, 'nequi');
        if (result?.success) {
          setRedeemOpen(false);
          refreshWallet();
        }
      }
    } finally {
      setRedeemSubmitting(false);
    }
  };

  const ConversionCalculator = () => {
    const commission = 0.05; // 5%
    const creditValue = 4500; // 1 crédito = $4,500 PTS después de comisión
    
    const totalPTS = conversionAmount * creditValue;
    const commissionAmount = totalPTS * commission;
    const netAmount = totalPTS - commissionAmount;
    
    return (
      <Card size="small" style={{ marginTop: 16 }}>
        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
          <Text strong>Calculadora de conversión:</Text>
          <Row gutter={8} align="middle">
            <Col>
              <Text>Créditos:</Text>
            </Col>
            <Col flex="auto">
              <input
                type="range"
                min="5"
                max={Math.min(wallet.credits, 100)}
                value={conversionAmount}
                onChange={(e) => setConversionAmount(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </Col>
            <Col>
              <Badge count={conversionAmount} style={{ backgroundColor: '#1890ff' }} />
            </Col>
          </Row>
          
          <Divider style={{ margin: '8px 0' }} />
          
          <Row justify="space-between">
            <Col>
              <Text>Valor créditos:</Text>
            </Col>
            <Col>
              <Text strong>{totalPTS.toLocaleString()} PTS</Text>
            </Col>
          </Row>
          
          <Row justify="space-between">
            <Col>
              <Text>Comisión (5%):</Text>
            </Col>
            <Col>
              <Text type="danger">-{commissionAmount.toLocaleString()} PTS</Text>
            </Col>
          </Row>
          
          <Row justify="space-between">
            <Col>
              <Text strong>Recibirás:</Text>
            </Col>
            <Col>
              <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                {netAmount.toLocaleString()} PTS
              </Text>
            </Col>
          </Row>
          
          <Button
            type="primary"
            block
            onClick={handleConvertToCash}
            loading={converting}
            disabled={wallet.credits < 5 || converting}
            style={{ marginTop: 8 }}
          >
            Convertir {conversionAmount} créditos
          </Button>
        </Space>
      </Card>
    );
  };

  const QuickActions = () => (
    <Card size="small" style={{ marginTop: 16 }} className="wallet-quick-actions">
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <Button 
          type="default"
          className="btn-outline-primary"
          block 
          icon={<PlusCircleOutlined />}
          onClick={handlePurchaseCredits}
        >
          Recargar Creditos
        </Button>
        <Button 
          block 
          className="btn-outline-primary"
          icon={<DollarOutlined />}
          onClick={handleWithdraw}
        >
          Canjea Puntos
        </Button>
        <Button 
          block 
          className="btn-outline-primary"
          icon={<HistoryOutlined />}
          onClick={handleViewHistory}
        >
          Historial
        </Button>
        <Button 
          block 
          className="btn-outline-primary"
          icon={<QuestionCircleOutlined />}
          onClick={() => navigate('/help/wallet')}
        >
          Ayuda
        </Button>
      </Space>
    </Card>
  );

  const CreditInfoPanel = () => (
    <Card size="small" style={{ marginTop: 16 }}>
      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
        <Text strong>
          <InfoCircleOutlined style={{ marginRight: 4 }} />
          Información de créditos
        </Text>
        
        <Row justify="space-between">
          <Col>
            <Text type="secondary">1 crédito =</Text>
          </Col>
          <Col>
            <Text strong>5,000 PTS</Text>
          </Col>
        </Row>
        
        <Row justify="space-between">
          <Col>
            <Text type="secondary">1 apuesta =</Text>
          </Col>
          <Col>
            <Text strong>1 crédito</Text>
          </Col>
        </Row>

        <Divider style={{ margin: '8px 0' }} />
        
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <SafetyOutlined style={{ marginRight: 4 }} />
          Tus créditos están protegidos y auditados
        </Text>
      </Space>
    </Card>
  );

  const UserStatsPanel = () => (
    <Card size="small" style={{ marginTop: 16 }}>
      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
        <Text strong>
          <StarOutlined style={{ marginRight: 4 }} />
          Tus estadísticas
        </Text>
        
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">Pronósticos totales:</Text>
          </Col>
          <Col>
            <Badge 
              count={stats.total_bets} 
              style={{ backgroundColor: stats.total_bets > 0 ? '#52c41a' : '#d9d9d9' }}
            />
          </Col>
        </Row>

        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">Veces que ha ganado:</Text>
          </Col>
          <Col>
            <Badge 
              count={stats.wins} 
              style={{ backgroundColor: stats.wins > 0 ? '#52c41a' : '#d9d9d9' }}
            />
          </Col>
        </Row>
        
        <Row justify="space-between">
          <Col>
            <Text type="secondary">Tasa de acierto:</Text>
          </Col>
          <Col>
            <Text strong>{stats.win_rate}%</Text>
          </Col>
        </Row>
        
        <Progress 
          percent={stats.win_rate} 
          size="small" 
          strokeColor={{
            '0%': '#ff4d4f',
            '50%': '#faad14',
            '100%': '#52c41a'
          }}
        />
        
        <Row justify="space-between">
          <Col>
            <Text type="secondary">Puntos promedio:</Text>
          </Col>
          <Col>
            <Text strong>{stats.avg_points.toFixed(1)}</Text>
          </Col>
        </Row>
        
        <Row justify="space-between">
          <Col>
            <Text type="secondary">Total ganado:</Text>
          </Col>
          <Col>
            <Text strong style={{ color: '#52c41a' }}>
              {stats.total_won.toLocaleString()} PTS
            </Text>
          </Col>
        </Row>
      </Space>
    </Card>
  );

  const RecentActivityPanel = () => (
    <Card size="small" style={{ marginTop: 16 }}>
      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
        <Text strong>
          <HistoryOutlined style={{ marginRight: 4 }} />
          Actividad reciente
        </Text>
        
        {recentActivity.length === 0 ? (
          <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
            No hay actividad reciente
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentActivity.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <Avatar 
                  size="small"
                  style={{ 
                    backgroundColor: getTransactionColor(item.type) === 'green' ? '#52c41a' : 
                                   getTransactionColor(item.type) === 'red' ? '#ff4d4f' : '#1890ff'
                  }}
                  icon={getTransactionIcon(item.type)}
                />
                <div style={{ flex: 1 }}>
                  <Space>
                    <Text style={{ fontSize: '12px' }}>{item.description}</Text>
                    {item.type === 'CREDIT_PURCHASE' && (
                      <Tag color="green" size="small">+{item.credits} Crédito</Tag> 
                    )}
                    {item.type === 'BET_PLACEMENT' && (
                      <Tag color="red" size="small">-1 Crédito</Tag>
                    )}
                    {item.type === 'PRIZE_WIN' && (
                      <Tag color="gold" size="small">+${item.amount?.toLocaleString()}</Tag>
                    )}
                  </Space>
                  <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                    {item.date} • {item.status}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {recentActivity.length > 0 && (
          <Button 
            type="link" 
            size="small" 
            onClick={handleViewHistory}
            style={{ padding: 0, fontSize: '12px' }}
          >
            Ver historial completo
          </Button>
        )}
      </Space>
    </Card>
  );

  // Vista compacta (para Sidebar o Dashboard)
  if (compact) {
    return (
      <Card 
        size="small" 
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          cursor: 'pointer'
        }}
        hoverable
        onClick={() => navigate('/wallet')}
      >
        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <WalletOutlined style={{ fontSize: '18px' }} />
              <Text strong style={{ color: 'white', marginLeft: 8 }}>
                Mi Cuenta
              </Text>
            </Col>
            <Col>
              <Badge 
                count={wallet.credits} 
                style={{ 
                  backgroundColor: wallet.credits > 0 ? '#52c41a' : '#ff4d4f'
                }}
              />
            </Col>
          </Row>
          
          <Row justify="space-between" align="middle">
            <Col>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '12px' }}>
                Créditos
              </Text>
            </Col>
            <Col>
              <Text strong style={{ color: 'white', fontSize: '16px' }}>
                {wallet.credits}
              </Text>
            </Col>
          </Row>
          
          <Row justify="space-between" align="middle">
            <Col>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '12px' }}>
                Puntos
              </Text>
            </Col>
            <Col>
              <Text strong style={{ color: 'white', fontSize: '16px' }}>
                ${wallet.balance_PTS?.toLocaleString() || '0'}
              </Text>
            </Col>
          </Row>
          
          <Progress 
            percent={Math.min((wallet.credits / 20) * 100, 100)} 
            size="small" 
            strokeColor="#52c41a"
            showInfo={false}
          />
        </Space>
      </Card>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Cargando información de mi cajón...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Encabezado */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>
              <WalletOutlined style={{ marginRight: 8 }} />
              Mi Cuenta
            </Title>
            <Text type="secondary">
              Gestiona tus créditos, Puntos y transacciones
            </Text>
          </Col>
          <Col>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshWallet}
              loading={refreshing}
            >
              Actualizar
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Columna principal - Saldos y acciones */}
        <Col xs={24} md={16}>
          <Row gutter={[16, 16]}>
            {/* Saldo de créditos */}
            <Col xs={24} md={12}>
              <Card 
                style={{ 
                  background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
                  color: 'white'
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <FireOutlined />
                      <Text style={{ color: 'white' }}>Créditos Disponibles</Text>
                    </Space>
                  }
                  value={wallet.credits}
                  styles={{ content: {color: 'white', fontSize: '42px', fontWeight: 'bold'} }}
                  suffix={
                    <Text style={{ color: 'white', fontSize: '14px' }}>
                      créditos
                    </Text>
                  }
                />
                
                <Space orientation="vertical" size="small" style={{ marginTop: 16, width: '100%' }}>
                  <Row justify="space-between">
                    <Col>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        Valor en PTS:
                      </Text>
                    </Col>
                    <Col>
                      <Text strong style={{ color: 'white' }}>
                        ${(wallet.credits * 5000).toLocaleString()} PTS
                      </Text>
                    </Col>
                  </Row>
                  
                  <Row justify="space-between">
                    <Col>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        Pronósticos posibles:
                      </Text>
                    </Col>
                    <Col>
                      <Text strong style={{ color: 'white' }}>
                        {wallet.credits}
                      </Text>
                    </Col>
                  </Row>
                </Space>
                
                <Button 
                  type="default"
                  className="btn-outline-primary"
                  block
                  icon={<PlusCircleOutlined />}
                  onClick={handlePurchaseCredits}
                  style={{ marginTop: 16 }}
                >
                  <strong>Recargar más créditos</strong>
                </Button>
              </Card>
            </Col>
            
            {/* Saldo en Puntos */}
            <Col xs={24} md={12}>
              <Card 
                style={{ 
                  background: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)',
                  color: 'white'
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <DollarOutlined />
                      <Text style={{ color: 'white' }}>Puntos Disponible</Text>
                    </Space>
                  }
                  value={wallet.balance_PTS}
                  styles={{ content: {color: 'white', fontSize: '36px', fontWeight: 'bold'} }}                  
                  prefix="$"
                  suffix="PTS"
                />
                
                <Space orientation="vertical" size="small" style={{ marginTop: 16, width: '100%' }}>
                  <Row justify="space-between">
                    <Col>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        Total ganado:
                      </Text>
                    </Col>
                    <Col>
                      <Text strong style={{ color: 'white' }}>
                        ${wallet.total_earned?.toLocaleString() || '0'} PTS
                      </Text>
                    </Col>
                  </Row>
                  
                  <Row justify="space-between">
                    <Col>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        Pronósticos ganados:
                      </Text>
                    </Col>
                    <Col>
                      <Text strong style={{ color: 'white' }}>
                        {wallet.bets_won || 0} / {wallet.bets_placed || 0}
                      </Text>
                    </Col>
                  </Row>
                </Space>
                
                
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <UserStatsPanel />
            </Col>
            <Col xs={24} md={12}>
              <RecentActivityPanel />
            </Col>
          </Row>
        </Col>
        
        {/* Columna lateral - Información y estadísticas */}
        <Col xs={24} md={8}>
          <QuickActions />
          <CreditInfoPanel />
          
          {/* Información adicional */}
          <Card size="small" style={{ marginTop: 16 }}>
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>
                <SafetyOutlined style={{ marginRight: 4 }} />
                Seguridad
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                • Todas las transacciones son auditadas
                • Tus créditos están protegidos
                • Sistema 100% transparente
                • Soporte 24/7 disponible
              </Text>
              <Button 
                type="link" 
                size="small"
                onClick={() => navigate('/help/security')}
                style={{ padding: 0, fontSize: '12px' }}
              >
                Políticas de seguridad →
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Alerta si no hay créditos */}
      {wallet.credits === 0 && showActions && (
        <Alert
          title="¡Sin créditos!"
          description={
            <span>
              Necesitas créditos para apostar. 
              <Button 
                type="link" 
                onClick={handlePurchaseCredits}
                style={{ padding: 0, marginLeft: 4 }}
              >
                Recarga tu primer paquete aquí
              </Button>
            </span>
          }
          type="warning"
          showIcon
          style={{ marginTop: 24 }}
          action={
            <Button size="small" type="primary" onClick={handlePurchaseCredits}>
              Recargar Créditos
            </Button>
          }
        />
      )}

      <Modal
        open={redeemOpen}
        onCancel={() => setRedeemOpen(false)}
        title="Canjea Puntos"
        okText="Aceptar"
        onOk={handleRedeemSubmit}
        confirmLoading={redeemSubmitting}
        okButtonProps={{
          style: { background: '#1890ff', borderColor: '#1890ff', color: '#ffffff' }
        }}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            value={redeemType}
            onChange={(e) => setRedeemType(e.target.value)}
          >
            <Radio value="credits">Cambiar puntos por creditos</Radio>
            <Radio value="withdraw">Solicitar retiro</Radio>
          </Radio.Group>

          {redeemType === 'credits' ? (
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary">Minimo 5,000 PTS. Debe ser multiplo de 5,000.</Text>
              <InputNumber
                min={5000}
                step={5000}
                value={pointsToConvert}
                onChange={(value) => setPointsToConvert(Number(value || 0))}
                style={{ width: '100%' }}
                addonAfter="PTS"
              />
              <Text>
                Creditos a recibir: <strong>{Math.floor((pointsToConvert || 0) / 5000)}</strong>
              </Text>
            </Space>
          ) : (
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary">Minimo 20,000 PTS. Maximo 1,000,000 PTS.</Text>
              <InputNumber
                min={20000}
                max={1000000}
                step={1000}
                value={withdrawAmount}
                onChange={(value) => setWithdrawAmount(Number(value || 0))}
                style={{ width: '100%' }}
                addonAfter="PTS"
              />
            </Space>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default WalletBalance;

