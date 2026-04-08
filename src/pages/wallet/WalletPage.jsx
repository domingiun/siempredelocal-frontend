// frontend/src/pages/wallet/WalletPage.jsx
import React, { useState } from 'react';
import { Row, Col, Card, Typography } from 'antd';
import {
  WalletOutlined, HistoryOutlined,
  CreditCardOutlined, SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import WalletBalance from '../../components/wallet/WalletBalance';
import TransactionHistoryList from '../../components/wallet/TransactionHistoryList';
import { useTheme } from '../../context/ThemeContext';
import './WalletPage.css';

const { Title, Text } = Typography;

const TABS = [
  { key: 'resumen',   label: 'Resumen',          icon: <WalletOutlined /> },
  { key: 'recargar',  label: 'Recargar Créditos', icon: <CreditCardOutlined /> },
  { key: 'historial', label: 'Historial',          icon: <HistoryOutlined /> },
  { key: 'config',    label: 'Configuración',      icon: <SettingOutlined /> },
];

const WalletPage = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const { mode } = useTheme();
  const navigate = useNavigate();
  const isDark = mode === 'dark';

  const colors = {
    bg:      isDark ? '#0b0f16' : '#f5f7fa',
    card:    isDark ? '#0c141f' : '#ffffff',
    border:  isDark ? '#1f2b3a' : '#e8edf3',
    text:    isDark ? '#e6edf3' : '#1a2332',
    sub:     isDark ? '#94a3b8' : '#64748b',
    tabBg:   isDark ? '#0f1824' : '#f0f4f8',
    tabBorder: isDark ? '#1f2b3a' : '#dde3ea',
    tabActiveBg: isDark ? '#1677ff22' : '#1677ff15',
    tabActiveText: '#1677ff',
    tabActiveBar: '#1677ff',
  };

  const tabContent = {
    resumen: (
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <WalletBalance />
        </Col>
      </Row>
    ),
    recargar: null, // navega a /purchase
    historial: (
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12 }}
                styles={{ body: { padding: 0 } }}>
            <TransactionHistoryList />
          </Card>
        </Col>
      </Row>
    ),
    config: (
      <div style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        <SettingOutlined style={{ fontSize: 40, color: colors.sub, marginBottom: 12 }} />
        <Title level={4} style={{ color: colors.text, margin: 0 }}>Configuración de cuenta</Title>
        <Text style={{ color: colors.sub }}>Opciones de configuración disponibles próximamente</Text>
      </div>
    ),
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <WalletOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text }}>
            Mi Cuenta
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: colors.sub }}>
          Gestiona tus créditos y transacciones
        </p>
      </div>

      {/* Pill Tabs */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
        background: isDark ? 'rgba(11,15,22,0.85)' : 'rgba(245,247,250,0.85)',
        borderBottom: `1px solid ${colors.border}`,
        marginBottom: 24,
        paddingBottom: 12,
        paddingTop: 4,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                if (tab.key === 'recargar') { navigate('/purchase'); return; }
                setActiveTab(tab.key);
              }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 18px',
                  borderRadius: 999,
                  border: `1px solid ${isActive ? colors.tabActiveBar : colors.tabBorder}`,
                  background: isActive ? colors.tabActiveBg : 'transparent',
                  color: isActive ? colors.tabActiveText : colors.sub,
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all .15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {tabContent[activeTab]}
    </div>
  );
};

export default WalletPage;
