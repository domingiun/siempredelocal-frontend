// frontend/src/pages/wallet/TransactionHistoryPage.jsx
import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Row, Col, Switch, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import TransactionHistoryList from '../../components/wallet/TransactionHistoryList';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;

const TransactionHistoryPage = () => {
  const navigate = useNavigate();
  const { refreshWallet } = useWallet();
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';

  useEffect(() => {
    refreshWallet();
  }, []);


  return (
    <div className={isDark ? 'tx-page tx-page--dark' : 'tx-page'} style={{ padding: '24px' }}>
      <style>{`
        .tx-page {
          background: radial-gradient(1200px 600px at 10% -10%, #eef4ff 0%, #ffffff 60%);
          min-height: 100vh;
        }
        .tx-page--dark {
          background: radial-gradient(1200px 600px at 10% -10%, #0c141f 0%, #0a0f16 55%, #0a0f14 100%);
          color: #e6edf3;
        }
        .tx-page--dark .ant-card {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .tx-page--dark .ant-card-head {
          border-bottom-color: #1f2b3a;
          background: #0c141f;
        }
        .tx-page--dark .ant-card-head-title,
        .tx-page--dark .ant-card-extra {
          color: #e6edf3;
        }
        .tx-page--dark .ant-typography,
        .tx-page--dark .ant-typography-secondary {
          color: #e6edf3;
        }
        .tx-page--dark .ant-typography-secondary {
          color: #9fb0c2;
        }
        .tx-page--dark .ant-btn {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .tx-page--dark .ant-btn:hover {
          background: #162233;
          border-color: #2a3a4f;
          color: #ffffff;
        }
        .tx-page--dark .ant-input,
        .tx-page--dark .ant-select-selector,
        .tx-page--dark .ant-picker,
        .tx-page--dark .ant-input-affix-wrapper {
          background: #0f1824 !important;
          border-color: #1f2b3a !important;
          color: #e6edf3 !important;
        }
        .tx-page--dark .ant-select-arrow,
        .tx-page--dark .ant-picker-suffix,
        .tx-page--dark .ant-picker-clear {
          color: #9fb0c2 !important;
        }
        body[data-theme="dark"] .ant-select-dropdown {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        body[data-theme="dark"] .ant-select-item {
          color: #e6edf3;
        }
        body[data-theme="dark"] .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
          background: #0f1b2a;
        }
        body[data-theme="dark"] .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background: #162233;
        }
        .tx-page--dark .ant-input::placeholder {
          color: #9fb0c2;
        }
        .tx-page--dark .ant-table {
          background: #0f1824;
          color: #e6edf3;
        }
        .tx-page--dark .ant-table-container {
          background: #0f1824;
        }
        .tx-page--dark .ant-table-thead > tr > th {
          background: #0c141f;
          color: #cbd5e1;
          border-bottom: 1px solid #1f2b3a;
        }
        .tx-page--dark .ant-table-tbody > tr > td {
          border-bottom: 1px solid #1f2b3a;
          color: #e6edf3;
        }
        .tx-page--dark .ant-table-tbody > tr.ant-table-row:hover > td {
          background: #0f1b2a;
        }
        .tx-page--dark .ant-table-summary {
          background: #0c141f;
          color: #e6edf3;
        }
        .tx-page--dark .ant-table-summary td {
          border-top: 1px solid #1f2b3a;
        }
        .tx-page--dark .ant-pagination-item,
        .tx-page--dark .ant-pagination-prev,
        .tx-page--dark .ant-pagination-next {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .tx-page--dark .ant-pagination-item a {
          color: #e6edf3;
        }
        .toggle-dark {
          background: #e5e7eb;
          border-color: #cbd5e1;
        }
        .toggle-dark .ant-switch-inner .ant-switch-inner-unchecked {
          color: #111827;
        }
        .toggle-dark.ant-switch-checked .ant-switch-inner .ant-switch-inner-checked {
          color: #ffffff;
        }
        .tx-page--dark .toggle-dark {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .tx-page--dark .toggle-dark.ant-switch-checked .ant-switch-inner .ant-switch-inner-checked {
          color: #93c5fd;
        }
        .tx-page--dark ul li {
          color: #e6edf3;
        }
      `}</style>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/wallet')}
          >
            Volver
          </Button>
        </Col>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Historial de Transacciones</Title>
          <Text type="secondary">Todas tus transacciones en un solo lugar</Text>
        </Col>
        <Col>
          <Space size="small">
            <Text type="secondary">Vista oscura</Text>
            <Switch
              checked={isDark}
              onChange={(checked) => setMode(checked ? 'dark' : 'light')}
              className="toggle-dark"
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </Space>
        </Col>
      </Row>

      <Card>
        <TransactionHistoryList />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Title level={4}>¿No encuentras una transacción?</Title>
        <Text type="secondary">
          Si crees que falta alguna transacción o tienes algún problema:
        </Text>
        <ul>
          <li>Verifica que estés usando los filtros correctos</li>
          <li>Las transacciones pueden tardar unos minutos en aparecer</li>
          <li>Contacta a soporte si el problema persiste</li>
        </ul>
        <Button type="link" onClick={() => navigate('/help/support')}>
          Contactar soporte
        </Button>
      </Card>
    </div>
  );
};

export default TransactionHistoryPage;

