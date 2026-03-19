import React, { useState } from 'react';
import { 
  Layout, Input, Avatar, Dropdown, Space, Badge, 
  Button, Drawer, Menu, Divider, Typography 
} from 'antd';
import { 
  BellOutlined, 
  SearchOutlined, 
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  DashboardOutlined,
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  HomeOutlined,
  QuestionCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const { Header } = Layout;
const { Search } = Input;
const { Text } = Typography;

const Navbar = ({ onMenuClick, collapsed }) => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mi Perfil',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configuración',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: logout,
    },
  ];

  const notificationItems = [
    {
      key: '1',
      label: (
        <div className="notification-item">
          <div className="notification-content">
            <strong>Nuevo partido programado</strong>
            <div>Nacional vs. Millonarios - 15:00</div>
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Hace 5 minutos
          </Text>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div className="notification-item">
          <div className="notification-content">
            <strong>Competencia actualizada</strong>
            <div>Liga Betplay ahora tiene 20 equipos</div>
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Hace 1 hora
          </Text>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <div className="notification-item">
          <div className="notification-content">
            <strong>Nuevo equipo registrado</strong>
            <div>Deportivo Cali se ha unido al sistema</div>
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Hace 2 horas
          </Text>
        </div>
      ),
    },
  ];

  const mobileMenuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => {
        navigate('/dashboard');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'competitions',
      icon: <TrophyOutlined />,
      label: 'Competencias',
      onClick: () => {
        navigate('/competitions');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'bets',
      icon: <FireOutlined />,
      label: 'Pronósticos',
      onClick: () => {
        navigate('/bets');
        setMobileMenuVisible(false);
      },
    },
    ...(user?.role === 'admin' ? [
      {
        key: 'admin-bets',
        icon: <ControlOutlined />,
        label: 'Admin Recargas',
        onClick: () => {
          navigate('/admin/bets');
          setMobileMenuVisible(false);
        },
      },
      {
        key: 'admin-create-betdate',
        icon: <PlusCircleOutlined />,
        label: 'Nueva Fecha',
        onClick: () => {
          navigate('/admin/create-betdate');
          setMobileMenuVisible(false);
        },
      },
    ] : []),
    {
      key: 'matches',
      icon: <CalendarOutlined />,
      label: 'Partidos',
      onClick: () => {
        navigate('/matches');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'teams',
      icon: <TeamOutlined />,
      label: 'Equipos',
      onClick: () => {
        navigate('/teams');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'standings',
      icon: <BarChartOutlined />,
      label: 'Clasificación',
      onClick: () => {
        navigate('/standings');
        setMobileMenuVisible(false);
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: 'Ayuda',
      onClick: () => {
        navigate('/help');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'docs',
      icon: <FileTextOutlined />,
      label: 'Documentación',
      onClick: () => {
        navigate('/docs');
        setMobileMenuVisible(false);
      },
    },
  ];

  const handleSearch = (value) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    }
  };

  return (
    <>
      <Header className="navbar-header">
        <div className="navbar-left">
          {/* Botón de menú móvil */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuVisible(true)}
            className="mobile-menu-btn"
          />

          {/* Botón de menú lateral (solo escritorio) */}
          <Button
            type="text"
            icon={collapsed ? <MenuOutlined /> : <MenuOutlined />}
            onClick={onMenuClick}
            className="desktop-menu-btn"
          />

          {/* Logo y título */}
          <Space 
            className="navbar-brand" 
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <div className="navbar-logo">
              <TrophyOutlined />
            </div>
            {!collapsed && (
              <div className="navbar-title">
                <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                  SiempreDeLocal
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Gestión Deportiva
                </Text>
              </div>
            )}
          </Space>
        </div>

        <div className="navbar-center">
          {/* Barra de búsqueda (solo escritorio) */}
          <div className="desktop-search">
            <Search
              placeholder="Buscar competencias, equipos, partidos..."
              onSearch={handleSearch}
              style={{ width: 400 }}
              allowClear
              enterButton={<SearchOutlined />}
            />
          </div>

          {/* Botón de búsqueda móvil */}
          <Button
            type="text"
            icon={<SearchOutlined />}
            onClick={() => setSearchVisible(true)}
            className="mobile-search-btn"
          />
        </div>

        <div className="navbar-right">
          <Space size="large">
            {/* Notificaciones - CORREGIDO: sin overlayClassName */}
            <Dropdown
              menu={{ items: notificationItems }}
              trigger={['click']}
              placement="bottomRight"
              popupRender={(menu) => (
                <div className="notifications-dropdown">
                  {menu}
                </div>
              )}
            >
              <Badge count={5} size="small" className="notification-badge">
                <Button 
                  type="text" 
                  icon={<BellOutlined />} 
                  className="notification-btn"
                />
              </Badge>
            </Dropdown>

            {/* Perfil de usuario */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Space className="user-profile" style={{ cursor: 'pointer' }}>
                <Avatar 
                  size="default" 
                  style={{ backgroundColor: '#1890ff' }}
                  icon={<UserOutlined />}
                />
                {!collapsed && (
                  <div className="user-info">
                    <Text strong style={{ display: 'block' }}>
                      {user?.username || 'Usuario'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </Text>
                  </div>
                )}
              </Space>
            </Dropdown>
          </Space>
        </div>
      </Header>

      {/* Drawer para menú móvil - */}
      <Drawer
        title={
          <Space>
            <div className="navbar-logo">
              <TrophyOutlined />
            </div>
            <Text strong>SiempreDeLocal</Text>
          </Space>
        }
        placement="left"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        size="large"
        styles={{
          body: { padding: 0 }
        }}
      >
        <div className="mobile-user-info">
          <Avatar 
            size={64} 
            style={{ backgroundColor: '#1890ff', marginBottom: '12px' }}
            icon={<UserOutlined />}
          />
          <Text strong style={{ display: 'block', fontSize: '16px' }}>
            {user?.username || 'Usuario'}
          </Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
          </Text>
          <Divider style={{ margin: '16px 0' }} />
        </div>
        
        <Menu
          mode="inline"
          items={mobileMenuItems}
          style={{ border: 'none' }}
        />

        <div style={{ padding: '16px' }}>
          <Button 
            type="primary" 
            block 
            icon={<HomeOutlined />}
            onClick={() => {
              navigate('/dashboard');
              setMobileMenuVisible(false);
            }}
            style={{ marginBottom: '8px' }}
          >
            Ir al Dashboard
          </Button>
          <Button 
            block 
            icon={<LogoutOutlined />}
            onClick={logout}
          >
            Cerrar Sesión
          </Button>
        </div>
      </Drawer>

      {/* Modal de búsqueda móvil - CORREGIDO */}
      <Drawer
        title="Buscar"
        placement="top"
        onClose={() => setSearchVisible(false)}
        open={searchVisible}
        size={200}
        styles={{
          body: { padding: '24px' }
        }}
      >
        <Search
          placeholder="Buscar competencias, equipos, partidos..."
          onSearch={(value) => {
            handleSearch(value);
            setSearchVisible(false);
          }}
          allowClear
          enterButton="Buscar"
          size="large"
          autoFocus
        />
      </Drawer>
    </>
  );
};

export default Navbar;
