// frontend/src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Typography, Badge, Tooltip, Avatar } from 'antd';
import { 
  DashboardOutlined,
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  PlusOutlined,
  FireOutlined,
  StarOutlined,
  HistoryOutlined,
  LineChartOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  ContainerOutlined,
  AppstoreOutlined,
  ScheduleOutlined,
  UnorderedListOutlined,
  PlusCircleOutlined,
  ControlOutlined,   
  EditOutlined,
  PlayCircleOutlined,
  FlagOutlined,
  WalletOutlined,           // ¡NUEVO!
  DollarOutlined,           // ¡NUEVO!
  CreditCardOutlined,       // ¡NUEVO!
  ThunderboltOutlined,      // ¡NUEVO!
  TrophyFilled             // ¡NUEVO!
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext'; // ¡NUEVO!
import './Sidebar.css';
import logo from '../../assets/logo.png';

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = ({ collapsed, onCollapse, isMobile }) => {
  const [activeKey, setActiveKey] = useState('/dashboard');
  const [activeSubKey, setActiveSubKey] = useState('');
  const [favoriteCompetitions, setFavoriteCompetitions] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { wallet } = useWallet(); // ¡NUEVO! Acceso a mi cajon

  // Actualizar activo según ruta actual
  useEffect(() => {
    const path = location.pathname;
    setActiveKey(path);
    
    // Extraer subruta si existe
    const pathParts = path.split('/');
    if (pathParts.length > 2) {
      setActiveSubKey(`/${pathParts[1]}/${pathParts[2]}`);
    } else {
      setActiveSubKey('');
    }
  }, [location.pathname]);

  // Datos de ejemplo para competencias favoritas
  useEffect(() => {
    setFavoriteCompetitions([
      { id: 1, name: 'Liga Betplay', icon: <TrophyOutlined />, count: 20 },
      { id: 2, name: 'PTSa Colombia', icon: <FireOutlined />, count: 32 },
      { id: 3, name: 'Superliga', icon: <StarOutlined />, count: 8 },
    ]);

    setRecentActions([
      { id: 1, action: 'Creó partido', details: 'Nacional vs Millonarios', time: 'Hace 5m' },
      { id: 2, action: 'Actualizó equipo', details: 'Deportivo Cali', time: 'Hace 1h' },
      { id: 3, action: 'Generó calendario', details: 'Liga Betplay', time: 'Hace 2h' },
    ]);
  }, []);

  // Elementos del menú principal 
  const getMainMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      // ===========================================
      // MENÚ DE COMPETENCIAS (EXISTENTE)
      // ===========================================
      {
        key: 'competitions-submenu',
        icon: <TrophyOutlined />,
        label: 'Competencias',
        children: [
          {
            key: '/competitions',
            icon: <AppstoreOutlined />,
            label: 'Todas las Competencias',
          },
          ...(user?.role === 'admin' ? [
            {
              key: '/competitions/new',
              icon: <PlusOutlined />,
              label: 'Nueva Competencia',
            },
          ] : []),
          // Gestión de Jornadas - solo admin
          ...(user?.role === 'admin' ? [
            {
              key: '/rounds/management',
              icon: <ScheduleOutlined />,
              label: 'Gestión de Jornadas',
            },
            {
              key: '/rounds/new',
              icon: <FlagOutlined />,
              label: 'Nueva Jornada',
            },
          ] : []),
        ],
      },
      // ===========================================
      // MENÚ DE APUESTAS
      // ===========================================
      {
        key: 'bets-submenu',
        icon: <FireOutlined />,
        label: 'Pronósticos',
        children: [
          {
            key: '/bets',
            icon: <FireOutlined />,
            label: 'Hacer Pronósticos',
            badge: wallet?.credits > 0 ? (
              <Badge 
                count={wallet.credits} 
                size="small" 
                style={{ 
                  backgroundColor: wallet.credits > 0 ? '#52c41a' : '#ff4d4f',
                  marginLeft: 8
                }}
              />
            ) : null
          },
          {
            key: '/active-bets',
            icon: <HistoryOutlined />,
            label: 'Mis Pronósticos',
          },
          {
            key: '/bets/ranking',
            icon: <TrophyOutlined />,
            label: 'Ranking',
          },
          {
            key: '/wallet',
            icon: <WalletOutlined />,
            label: 'Mi Cajón',
            badge: wallet?.balance_PTS > 0 ? (
              <Badge 
                count={`$${(wallet.balance_PTS / 1000).toFixed(0)}k`} 
                size="small" 
                style={{ 
                  backgroundColor: '#1890ff',
                  marginLeft: 8
                }}
              />
            ) : null
          },
          {
            key: '/transactions',
            icon: <CreditCardOutlined />,
            label: 'Mi Historial',
          },
        ],
      },
      {
        key: 'matches-submenu',
        icon: <CalendarOutlined />,
        label: 'Partidos',
        children: [
          {
            key: '/matches/calendar',
            icon: <CalendarOutlined />,
            label: 'Calendario',
          },
          {
            key: '/matches',
            icon: <AppstoreOutlined />,
            label: 'Todos los Partidos',
          },
          {
            key: '/matches/today',
            icon: <FireOutlined />,
            label: 'Partidos de Hoy',
          },
          // Solo para admin
          ...(user?.role === 'admin' ? [
            {
              key: '/matches/new',
              icon: <PlusOutlined />,
              label: 'Nuevo Partido',
            },
            {
              key: '/matches/management',
              icon: <ScheduleOutlined />,
              label: 'Gestión Avanzada',
            },
          ] : []),
        ],
      },
      {
        key: 'teams-submenu',
        icon: <TeamOutlined />,
        label: 'Equipos',
        children: [
          {
            key: '/teams',
            icon: <TeamOutlined />,
            label: 'Todos los Equipos',
          },
          ...(user?.role === 'admin' ? [
            {
              key: '/teams/new',
              icon: <PlusOutlined />,
              label: 'Nuevo Equipo',
            },
          ] : []),
        ],
      },
      ...(user?.role === 'admin' ? [
        {
          key: 'reports-submenu',
          icon: <LineChartOutlined />,
          label: 'Reportes',
          children: [
            {
              key: '/reports/performance',
              icon: <LineChartOutlined />,
              label: 'Rendimiento',
            },
            {
              key: '/reports/financial',
              icon: <ContainerOutlined />,
              label: 'Financiero',
            },
            {
              key: '/reports/attendance',
              icon: <UserOutlined />,
              label: 'Asistencia',
            },
          ],
        },
      ] : []),
    ];

    // Solo agregar menú de admin si el usuario es admin
    if (user?.role === 'admin') {
      baseItems.push({
        key: 'admin-submenu',
        icon: <SettingOutlined />,
        label: 'Administración',
        children: [
          {
            key: '/admin/users',
            icon: <UserOutlined />,
            label: 'Usuarios',
          },
          {
            key: '/admin/system',
            icon: <SettingOutlined />,
            label: 'Configuración',
          },
          {
            key: '/admin/bets',
            icon: <ControlOutlined />,
            label: 'Admin Recargas',
          },
          {
            key: '/admin/create-betdate',
            icon: <PlusCircleOutlined />,
            label: 'Nueva Fecha',
          },
        ],
      });
    }

    return baseItems;
  };

  // Función para procesar items con badges
  const processMenuItems = (items) => {
    return items.map(item => {
      const processedItem = { ...item };
      
      // Si tiene children, procesarlos recursivamente
      if (processedItem.children) {
        processedItem.children = processMenuItems(processedItem.children);
      }
      
      // Si tiene badge, crear label personalizado
      if (processedItem.badge) {
        processedItem.label = (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{processedItem.label}</span>
            {processedItem.badge}
          </div>
        );
      }
      
      return processedItem;
    });
  };

  // Elementos del menú inferior
  const getBottomMenuItems = () => {
    const items = [
      {
        key: '/help',
        icon: <QuestionCircleOutlined />,
        label: 'Ayuda',
        onClick: () => navigate('/help'),
      },
    ];
    
    if (user?.role === 'admin') {
      items.push({
        key: '/docs',
        icon: <FileTextOutlined />,
        label: 'Documentación',
        onClick: () => navigate('/docs'),
      });
    }

    // Agregar opción de recargar créditos si el usuario tiene pocos
    if (wallet?.credits < 3) {
      items.unshift({
        key: '/purchase',
        icon: <DollarOutlined />,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Recargar Créditos</span>
            <Badge 
              count="¡OFERTA!" 
              size="small" 
              style={{ 
                backgroundColor: '#ff4d4f',
                marginLeft: 8
              }}
            />
          </div>
        ),
        onClick: () => navigate('/purchase'),
      });
    }

    items.push({
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: logout,
    });

    return items;
  };

  const handleMenuClick = ({ key }) => {
    if (key.startsWith('/')) {
      navigate(key);
      if (isMobile) onCollapse(true);
    }
  };

  const handleBottomMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
    } else if (key.startsWith('/')) {
      navigate(key);
      if (isMobile) onCollapse(true);
    }
  };

  // Widget de créditos cuando está expandido
  const CreditsWidget = () => (
    <div 
      className="credits-widget"
      onClick={() => navigate('/wallet')}
      style={{
        background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
        borderRadius: 8,
        padding: '12px 16px',
        margin: '16px',
        cursor: 'pointer',
        color: 'white',
        transition: 'all 0.3s ease',
      }}
    >
      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ color: 'white', fontSize: '14px' }}>
            <FireOutlined /> Créditos Disponibles
          </Text>
          <Badge 
            count={wallet?.credits || 0} 
            style={{ 
              backgroundColor: wallet?.credits > 0 ? '#52c41a' : '#ff4d4f'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '12px' }}>
            <DollarOutlined /> Puntos
          </Text>
          <Text strong style={{ color: 'white', fontSize: '12px' }}>
            ${(wallet?.balance_PTS || 0).toLocaleString()}
          </Text>
        </div>
      </Space>
    </div>
  );

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="app-sidebar"
      width={280}
      collapsedWidth={isMobile ? 0 : 80}
      theme="dark"
    >
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
        {collapsed ? (
          <Tooltip title="SiempreDeLocal" placement="right">
            <div className="logo-collapsed">
              <img src={logo} alt="Siempre de Local" style={{ width: 96, height: 96, objectFit: 'contain' }} />
            </div>
          </Tooltip>
        ) : (
          <Space className="logo-expanded" align="center" style={{ width: '100%', justifyContent: 'center' }}>
            <div className="logo-icon">
              <img src={logo} alt="Siempre de Local" style={{ width: 96, height: 96, objectFit: 'contain' }} />
            </div>
          </Space>
        )}
      </div>

      {/* Botón colapsar */}
      <div className="sidebar-collapse-btn">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => onCollapse(!collapsed)}
          className="collapse-btn"
        />
      </div>

      {/* Widget de créditos (solo cuando está expandido) */}
      {!collapsed && <CreditsWidget />}

      {/* Menú principal */}
      <div className="sidebar-menu-container">
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey, activeSubKey]}
          defaultOpenKeys={[]}
          items={processMenuItems(getMainMenuItems())}
          onClick={handleMenuClick}
          className="main-menu"
        />
      </div>

      {/* Menú inferior */}
      <div className="sidebar-bottom">
        <Menu
          theme="dark"
          mode="inline"
          items={getBottomMenuItems()}
          className="bottom-menu"
          onClick={handleBottomMenuClick}
        />

        {/* Información de usuario */}
        {!collapsed && (
          <div className="user-info-bottom">
            <Space>
              <Avatar 
                size="small" 
                style={{ 
                  backgroundColor: user?.role === 'admin' ? '#f5222d' : '#1890ff',
                  cursor: 'pointer'
                }}
                icon={<UserOutlined />}
                onClick={() => navigate('/profile')}
              />
              <div>
                <Text style={{ color: 'white', fontSize: '12px', display: 'block' }}>
                  {user?.username || 'Usuario'}
                </Text>
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  {user?.role === 'admin' ? 'Administrador' : 'Apostador'}
                </Text>
              </div>
            </Space>
          </div>
        )}

        {/* Botones rápidos cuando está colapsado */}
        {collapsed && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            {/* Dashboard */}
            <Tooltip title="Dashboard" placement="right">
              <Button
                type="primary"
                icon={<HomeOutlined />}
                onClick={() => navigate('/dashboard')}
                className="quick-btn"
                style={{ marginBottom: 8 }}
              />
            </Tooltip>
            
            {/* Pronósticos rápidas */}
            <Tooltip title="Pronósticos" placement="right">
              <Button
                type="dashed"
                icon={<FireOutlined />}
                onClick={() => navigate('/bets')}
                className="quick-btn"
                style={{ 
                  marginBottom: 8,
                  borderColor: '#ff4d4f',
                  color: '#ff4d4f'
                }}
              />
            </Tooltip>
            
            {/* Mi Cajón */}
            <Tooltip title="Mi Cajón" placement="right">
              <Button
                type="dashed"
                icon={<WalletOutlined />}
                onClick={() => navigate('/wallet')}
                className="quick-btn"
                style={{ 
                  marginBottom: 8,
                  borderColor: '#52c41a',
                  color: '#52c41a'
                }}
              />
            </Tooltip>
            
            {/* Recargar créditos si tiene pocos */}
            {wallet?.credits < 3 && (
              <Tooltip title="Recargar Créditos" placement="right">
                <Button
                  type="dashed"
                  danger
                  icon={<DollarOutlined />}
                  onClick={() => navigate('/purchase')}
                  className="quick-btn"
                  style={{ marginBottom: 8 }}
                />
              </Tooltip>
            )}
            
            {/* Botones admin */}
            {user?.role === 'admin' && (
              <>
                <Tooltip title="Admin Pronósticos" placement="right">
                  <Button
                    type="dashed"
                    icon={<ControlOutlined />}
                    onClick={() => navigate('/admin/bets')}
                    className="quick-btn"
                    style={{ 
                      marginBottom: 8,
                      borderColor: '#faad14',
                      color: '#faad14'
                    }}
                  />
                </Tooltip>
                <Tooltip title="Nueva Fecha" placement="right">
                  <Button
                    type="dashed"
                    icon={<PlusCircleOutlined />}
                    onClick={() => navigate('/admin/create-betdate')}
                    className="quick-btn"
                  />
                </Tooltip>
              </>
            )}
          </div>
        )}
      </div>
    </Sider>
  );
};

export default Sidebar;

