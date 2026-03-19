import React from 'react';
import { Breadcrumb as AntBreadcrumb, Space, Button } from 'antd';
import { 
  HomeOutlined, RightOutlined, 
  ReloadOutlined, SettingOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Breadcrumb.css';

const Breadcrumb = ({
  items = [],
  showHome = true,
  showActions = true,
  onRefresh,
  onSettings,
  extraActions = [],
  backButton = false,
  backButtonText = 'Volver',
  onBack,
  separator = <RightOutlined style={{ fontSize: '10px', color: '#999' }} />,
  style = {},
  className = "",
  title = null,
  subtitle = null,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Generar items basados en la ruta actual si no se proporcionan
  const generateBreadcrumbItems = () => {
    if (items.length > 0) return items;

    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbItems = [];

    if (showHome) {
      breadcrumbItems.push({
        title: (
          <Space>
            <HomeOutlined />
            <span>Inicio</span>
          </Space>
        ),
        href: '/dashboard',
        onClick: (e) => {
          e.preventDefault();
          navigate('/dashboard');
        },
      });
    }

    let accumulatedPath = '';
    pathnames.forEach((segment, index) => {
      accumulatedPath += `/${segment}`;
      
      // Mapear rutas a nombres amigables
      const routeNames = {
        'dashboard': 'Dashboard',
        'competitions': 'Competencias',
        'competitions': 'Competencias',
        'teams': 'Equipos',
        'matches': 'Partidos',
        'standings': 'Clasificación',
        'calendar': 'Calendario',
        'admin': 'Administración',
        'profile': 'Perfil',
        'settings': 'Configuración',
        'new': 'Nuevo',
        'edit': 'Editar',
        'create': 'Crear',
      };

      // Obtener parámetros de la URL (como IDs)
      const isNumeric = !isNaN(segment) && !isNaN(parseFloat(segment));
      
      let title = routeNames[segment] || 
        (isNumeric ? `ID: ${segment}` : 
         segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '));

      // Para rutas con ID, intentar obtener nombre del recurso
      if (isNumeric && index > 0) {
        const previousSegment = pathnames[index - 1];
        const resourceNames = {
          'competitions': 'Competencia',
          'teams': 'Equipo',
          'matches': 'Partido',
          'users': 'Usuario',
        };
        title = `${resourceNames[previousSegment] || 'Recurso'} #${segment}`;
      }

      const isLast = index === pathnames.length - 1;

      breadcrumbItems.push({
        title: isLast ? (
          <strong style={{ color: '#1890ff' }}>{title}</strong>
        ) : title,
        href: !isLast ? accumulatedPath : undefined,
        onClick: !isLast ? (e) => {
          e.preventDefault();
          navigate(accumulatedPath);
        } : undefined,
      });
    });

    return breadcrumbItems;
  };

  const breadcrumbItems = generateBreadcrumbItems();

  const renderItem = (item, index) => {
    const { title, href, onClick } = item;
    
    const content = href ? (
      <a href={href} onClick={onClick} className="breadcrumb-link">
        {title}
      </a>
    ) : (
      <span className="breadcrumb-current">{title}</span>
    );

    return (
      <AntBreadcrumb.Item key={index}>
        {content}
      </AntBreadcrumb.Item>
    );
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`breadcrumb-container ${className}`} style={style}>
      <Space orientation="vertical" style={{ width: '100%' }}>
        {/* Primera línea: Título y breadcrumb */}
        <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {title && (
              <div style={{ marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                  {title}
                </h1>
                {subtitle && (
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            <AntBreadcrumb separator={separator}>
              {breadcrumbItems.map(renderItem)}
            </AntBreadcrumb>
          </div>

          {showActions && (
            <Space className="breadcrumb-actions">
              {backButton && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                  size="small"
                  style={{ marginRight: 8 }}
                >
                  {backButtonText}
                </Button>
              )}

              {onRefresh && (
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={onRefresh}
                  size="small"
                  title="Refrescar"
                />
              )}

              {onSettings && (
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={onSettings}
                  size="small"
                  title="Configuración"
                />
              )}

              {extraActions.map((action, index) => (
                <Button
                  key={index}
                  type={action.type || 'text'}
                  icon={action.icon}
                  onClick={action.onClick}
                  size="small"
                  danger={action.danger}
                  disabled={action.disabled}
                  title={action.title}
                >
                  {action.text}
                </Button>
              ))}
            </Space>
          )}
        </Space>

        {/* Información adicional */}
        {user && location.pathname !== '/dashboard' && (
          <div className="breadcrumb-info">
            <Space size="middle" style={{ fontSize: '12px', color: '#666' }}>
              <span>Usuario: <strong>{user.username}</strong></span>
              <span>Rol: <strong>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</strong></span>
            </Space>
          </div>
        )}
      </Space>
    </div>
  );
};

// Componente BreadcrumbItem para uso declarativo
export const BreadcrumbItem = ({ children, href, onClick }) => {
  return { title: children, href, onClick };
};

// Componente BreadcrumbSeparator personalizado
export const BreadcrumbSeparator = ({ children = <RightOutlined /> }) => {
  return children;
};

export default Breadcrumb;
