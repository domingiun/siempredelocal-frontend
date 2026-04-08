// frontend/src/components/layout/Header.jsx
import React from 'react';
import { 
  Layout, Dropdown, Avatar, Space, Typography, 
  Badge, Button, Tooltip 
} from 'antd';
import { 
  UserOutlined, BellOutlined, LogoutOutlined,
  SettingOutlined, QuestionCircleOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
  HomeOutlined, FireOutlined, WalletOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const AppHeader = ({ collapsed, setCollapsed }) => { 
  const { user, logout } = useAuth();
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getAvatarSrc = (avatarUrl) => {
    if (!avatarUrl) return undefined;
    return avatarUrl.startsWith('http') ? avatarUrl : `${apiBaseUrl}${avatarUrl}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mi Perfil',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'wallet',
      icon: <WalletOutlined />,
      label: 'Mi Cajón',
      onClick: () => navigate('/wallet'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configuración',
      onClick: () => navigate('/admin/system'),
      disabled: user?.role !== 'admin',
    },
    {
      type: 'divider',
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: 'Ayuda',
      onClick: () => navigate('/help'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader
      className="app-header"
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        height: 64,
        lineHeight: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 99,
      }}
    >
      <style>{`
        body[data-theme="dark"] .app-header {
          background: #0c141f !important;
          color: #e6edf3;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
          border-bottom: 1px solid #1f2b3a;
        }
        body[data-theme="dark"] .app-header .ant-btn {
          color: #e6edf3;
        }
        body[data-theme="dark"] .app-header .ant-btn:hover {
          background: #162233;
        }
        body[data-theme="dark"] .app-header .ant-typography {
          color: #e6edf3;
        }
        body[data-theme="dark"] .app-header .ant-typography-secondary {
          color: #9fb0c2;
        }
        body[data-theme="dark"] .app-header .ant-avatar {
          box-shadow: 0 0 0 2px #1f2b3a;
        }
        body[data-theme="dark"] .app-header .ant-badge .ant-badge-count {
          box-shadow: 0 0 0 1px #1f2b3a;
        }
      `}</style>
      {/* Lado izquierdo: Botón para colapsar sidebar */}
      <Space className="app-header__left">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            fontSize: '16px',
            width: 64,
            height: 64,
            marginLeft: -16,
          }}
        />
        
        {/* Logo/Brand para móviles */}
        <div className="app-header__brand">
          <Tooltip title="Ir al Dashboard">
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => navigate('/dashboard')}
              style={{ marginRight: 8 }}
            />
          </Tooltip>
          
          {/* Indicador de créditos en el header */}
          {wallet && (
            <Tooltip title="Tus créditos disponibles">
              <span
                className="credits-badge-wrapper"
                onClick={() => navigate('/wallet')}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    navigate('/wallet');
                  }
                }}
              >
                <Badge 
                  className="credits-badge credits-badge--full"
                  count={`${wallet.credits || 0} - Créditos Disponibles`}
                  overflowCount={99}
                  style={{ 
                    backgroundColor: wallet.credits > 0 ? '#52c41a' : '#ff4d4f',
                    cursor: 'pointer'
                  }}
                />
                <Badge 
                  className="credits-badge credits-badge--compact"
                  count={`${wallet.credits || 0} credito(s)`}
                  overflowCount={99}
                  style={{ 
                    backgroundColor: wallet.credits > 0 ? '#52c41a' : '#ff4d4f',
                    cursor: 'pointer'
                  }}
                />
              </span>
            </Tooltip>
          )}
        </div>
      </Space>
      
      {/* Lado derecho: Usuario y notificaciones */}
      <Space size="large" className="app-header__actions">
        {/* Notificaciones */}
        <span className="header-hide-mobile">
          <Tooltip title="Notificaciones">
            <Badge count={0} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined />}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
          </Tooltip>
        </span>
        
        {/* Pronósticos rápidas */}
        <Tooltip title="Ir a Hacer Pronósticos">
          <Button
            type="text"
            icon={<FireOutlined />}
            onClick={() => navigate('/bets')}
            style={{ color: '#ff4d4f' }}
          >
            <span className="header-bets-text">
              <Text strong style={{ color: '#ff4d4f' }}>Hacer Pronósticos</Text>
            </span>
          </Button>
        </Tooltip>
        
        {/* Información de mi cajon */}
        {wallet && wallet.balance_PTS > 0 && (
          <Tooltip title="Balance disponible">
            <Badge 
              className="header-hide-mobile"
              count={`$${(wallet.balance_PTS / 1000).toFixed(0)}k`}
              style={{ 
                backgroundColor: '#1890ff',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/wallet')}
            />
          </Tooltip>
        )}
        
        {/* Usuario */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
          <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
            <Avatar 
              size="default" 
              src={getAvatarSrc(user?.avatar_url)}
              icon={!user?.avatar_url ? <UserOutlined /> : undefined}
              style={{ 
                backgroundColor: user?.role === 'admin' ? '#f5222d' : '#1890ff'
              }}
            />
            <div className="user-meta">
              <Text strong style={{ fontSize: '14px' }}>
                {user?.username || 'Usuario'}
              </Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {user?.role === 'admin' ? 'Administrador' : 'Pronosticador'}
              </Text>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default AppHeader;



