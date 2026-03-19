// frontend/src/pages/wallet/WalletPage.jsx
import React from 'react';
import { Row, Col, Tabs, Card, Typography, Button } from 'antd';
import {
  WalletOutlined, HistoryOutlined, 
  CreditCardOutlined, QuestionCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import WalletBalance from '../../components/wallet/WalletBalance';
import PurchaseCredits from '../../components/wallet/PurchaseCredits';
import TransactionHistoryList from '../../components/wallet/TransactionHistoryList';

const { Title, Text } = Typography;

const WalletPage = () => {
  const navigate = useNavigate();
  // Configuración de items para Tabs (nueva API de Ant Design)
  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <WalletOutlined />
          Resumen
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <WalletBalance />
          </Col>
        </Row>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <CreditCardOutlined />
          Recargar Créditos
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <PurchaseCredits />
          </Col>
        </Row>
      ),
    },
    {
      key: '3',
      label: (
        <span>
          <HistoryOutlined />
          Historial
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card>
              <TransactionHistoryList />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: '4',
      label: (
        <span>
          <SettingOutlined />
          Configuración
        </span>
      ),
      children: (
        <Card>
          <Title level={4}>Configuración de Mi Cajón</Title>
          <Text type="secondary">
            Opciones de configuración de tu cajón (próximamente)
          </Text>
          {/* Aquí irían opciones como:
            - Métodos de pago preferidos
            - Límites de gasto
            - Notificaciones
            - etc.
          */}
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>
              <WalletOutlined style={{ marginRight: 8 }} />
              Mi Cajón
            </Title>
            <Text type="secondary">
              Gestiona todos tus creditos y transacciones desde aquí
            </Text>
          </Col>
          <Col>
            <Button type="primary" href="/help/security" icon={<QuestionCircleOutlined />}>
              Tratamiento de datos y seguridad
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ✅ USANDO LA NUEVA API CON items */}
      <Tabs 
        defaultActiveKey="1" 
        type="card" 
        size="large"
        items={tabItems}
        onTabClick={(key) => {
          if (key === '2') {
            navigate('/purchase');
          }
        }}
      />
    </div>
  );
};

export default WalletPage;
