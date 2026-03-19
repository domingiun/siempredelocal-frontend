//frontend/src/components/common/Notification.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Badge, Dropdown, Avatar, Button, Tag, Space, 
  Typography, Divider, Empty, notification as antdNotification 
} from 'antd';
import {
  BellOutlined, CheckOutlined, DeleteOutlined,
  EyeOutlined, SettingOutlined, MessageOutlined,
  TeamOutlined, TrophyOutlined, CalendarOutlined,
  ExclamationCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';

const { Text } = Typography;

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Notificaciones de ejemplo (en producción vendrían del backend)
  const mockNotifications = [
    {
      id: 1,
      type: 'match',
      title: 'Nuevo partido programado',
      message: 'Millonarios vs Nacional programado para el 15 de enero',
      data: { matchId: 1, competitionId: 1 },
      timestamp: '2024-01-10T10:30:00',
      read: false,
      icon: <CalendarOutlined />,
      color: '#1890ff',
    },
    {
      id: 2,
      type: 'score',
      title: 'Resultado actualizado',
      message: 'América 2 - 1 Santa Fe (Finalizado)',
      data: { matchId: 2, competitionId: 1 },
      timestamp: '2024-01-10T09:15:00',
      read: false,
      icon: <TrophyOutlined />,
      color: '#52c41a',
    },
    {
      id: 3,
      type: 'team',
      title: 'Nuevo equipo registrado',
      message: 'Deportivo Cali se ha unido a Liga Betplay 2024',
      data: { teamId: 15 },
      timestamp: '2024-01-09T16:45:00',
      read: true,
      icon: <TeamOutlined />,
      color: '#722ed1',
    },
    {
      id: 4,
      type: 'system',
      title: 'Mantenimiento programado',
      message: 'El sistema estará en mantenimiento el 12 de enero de 2:00 AM a 4:00 AM',
      data: {},
      timestamp: '2024-01-09T14:20:00',
      read: true,
      icon: <SettingOutlined />,
      color: '#fa8c16',
    },
    {
      id: 5,
      type: 'alert',
      title: 'Partido cancelado',
      message: 'Junior vs Once Caldas ha sido cancelado',
      data: { matchId: 3, competitionId: 1 },
      timestamp: '2024-01-08T11:10:00',
      read: true,
      icon: <ExclamationCircleOutlined />,
      color: '#f5222d',
    },
  ];

  useEffect(() => {
    // Cargar notificaciones
    loadNotifications();
    
    // Simular notificaciones en tiempo real
    const interval = setInterval(() => {
      simulateNewNotification();
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    setLoading(true);
    // En producción, aquí harías una llamada a la API
    setTimeout(() => {
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
      setLoading(false);
    }, 500);
  };

  const simulateNewNotification = () => {
    // Solo para demo - simular notificaciones nuevas
    const types = ['match', 'score', 'team', 'system'];
    const messages = [
      'Nuevo partido programado para mañana',
      'Resultado actualizado en tiempo real',
      'Equipo actualizó su información',
      'Recordatorio: Cerrar jornada actual',
    ];
    
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    const newNotification = {
      id: Date.now(),
      type: randomType,
      title: 'Actualización del sistema',
      message: randomMessage,
      data: {},
      timestamp: new Date().toISOString(),
      read: false,
      icon: <InfoCircleOutlined />,
      color: '#1890ff',
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Mostrar notificación toast
    antdNotification.info({
      message: newNotification.title,
      description: newNotification.message,
      placement: 'topRight',
      duration: 4,
    });
  };

  const handleMarkAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
    antdNotification.success({
      message: 'Todas las notificaciones marcadas como leídas',
      placement: 'topRight',
    });
  };

  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    setUnreadCount(prev => {
      const deletedNotif = notifications.find(n => n.id === id);
      return deletedNotif && !deletedNotif.read ? prev - 1 : prev;
    });
  };

  const handleNotificationClick = (notification) => {
    // Marcar como leída
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navegar según el tipo de notificación
    switch (notification.type) {
      case 'match':
        if (notification.data.matchId) {
          navigate(`/matches/${notification.data.matchId}`);
        } else if (notification.data.competitionId) {
          navigate(`/competitions/${notification.data.competitionId}`);
        }
        break;
      case 'score':
        if (notification.data.matchId) {
          navigate(`/matches/${notification.data.matchId}`);
        }
        break;
      case 'team':
        if (notification.data.teamId) {
          navigate(`/teams/${notification.data.teamId}`);
        }
        break;
      default:
        // No hacer nada para notificaciones del sistema
        break;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return past.toLocaleDateString();
  };

  const notificationMenu = {
    items: [
      {
        key: 'header',
        label: (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0'
          }}>
            <Text strong>Notificaciones</Text>
            <Space>
              <Badge count={unreadCount} size="small" />
              <Button 
                type="link" 
                size="small"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                Marcar todas
              </Button>
            </Space>
          </div>
        ),
        disabled: true,
      },
      {
        type: 'divider',
      },
      ...notifications.slice(0, 5).map(notification => ({
        key: `notification-${notification.id}`,
        label: (
          <div
            style={{
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              opacity: notification.read ? 0.7 : 1,
              background: notification.read ? 'transparent' : '#e6f7ff',
              borderRadius: '4px',
              margin: '4px 0',
              padding: '12px',
            }}
            onClick={() => handleNotificationClick(notification)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = notification.read ? '#f5f5f5' : '#d9f7be';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = notification.read ? 'transparent' : '#e6f7ff';
            }}
          >
            <Space align="start" style={{ width: '100%' }}>
              <Avatar 
                size="small" 
                icon={notification.icon}
                style={{ 
                  backgroundColor: notification.color,
                  color: '#fff'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <Text strong style={{ fontSize: '14px' }}>
                    {notification.title}
                  </Text>
                  <Space size="small">
                    {!notification.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#ff4d4f',
                      }} />
                    )}
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {getTimeAgo(notification.timestamp)}
                    </Text>
                  </Space>
                </div>
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: '12px',
                    display: 'block',
                    marginTop: '4px'
                  }}
                >
                  {notification.message}
                </Text>
                <div style={{ marginTop: '8px' }}>
                  <Space size="small">
                    <Tag 
                      size="small" 
                      color={notification.color}
                      style={{ fontSize: '10px' }}
                    >
                      {notification.type}
                    </Tag>
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(notification);
                      }}
                      style={{ fontSize: '11px' }}
                    >
                      Ver
                    </Button>
                    {!notification.read && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        style={{ fontSize: '11px' }}
                      >
                        Marcar
                      </Button>
                    )}
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      style={{ fontSize: '11px' }}
                    >
                      Eliminar
                    </Button>
                  </Space>
                </div>
              </div>
            </Space>
          </div>
        ),
      })),
      notifications.length > 5 && {
        type: 'divider',
      },
      notifications.length > 5 && {
        key: 'view-all',
        label: (
          <div style={{ textAlign: 'center', padding: '8px' }}>
            <Button 
              type="link" 
              onClick={() => navigate('/notifications')}
            >
              Ver todas las notificaciones ({notifications.length})
            </Button>
          </div>
        ),
      },
      {
        key: 'empty',
        label: notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No hay notificaciones"
            style={{ margin: '20px 0' }}
          />
        ) : null,
        disabled: notifications.length > 0,
      },
      {
        key: 'footer',
        label: (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '8px 0',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Button 
              type="text" 
              size="small"
              icon={<SettingOutlined />}
              onClick={() => navigate('/settings/notifications')}
            >
              Configurar
            </Button>
            <Button 
              type="text" 
              size="small"
              onClick={() => {
                // En producción, aquí sincronizarías con el backend
                loadNotifications();
              }}
            >
              Actualizar
            </Button>
          </div>
        ),
        disabled: false,
      },
    ].filter(Boolean),
  };

  return (
    <Dropdown
      menu={notificationMenu}
      trigger={['click']}
      placement="bottomRight"
      overlayStyle={{
        width: '400px',
        maxHeight: '500px',
        overflow: 'auto',
      }}
    >
      <Badge count={unreadCount} size="small" offset={[-5, 5]}>
        <Button
          type="text"
          shape="circle"
          icon={<BellOutlined style={{ fontSize: '18px' }} />}
          style={{
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Badge>
    </Dropdown>
  );
};

// Componente de página de notificaciones completo
export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar todas las notificaciones
    loadAllNotifications();
  }, []);

  const loadAllNotifications = () => {
    // En producción, esto vendría de una API
    const allNotifications = [
      // ...todas las notificaciones
    ];
    setNotifications(allNotifications);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Notificaciones</h2>
          <p style={{ margin: 0, color: '#666' }}>
            Gestiona tus notificaciones del sistema
          </p>
        </div>
        <Space>
          <Button
            type="primary"
            onClick={() => {
              // Marcar todas como leídas
            }}
          >
            Marcar todas como leídas
          </Button>
          <Button
            danger
            onClick={() => {
              // Eliminar todas
            }}
          >
            Eliminar todas
          </Button>
        </Space>
      </div>

      {/* Filtros */}
      <Card style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: '150px' }}
          >
            <Option value="all">Todas</Option>
            <Option value="unread">No leídas</Option>
            <Option value="read">Leídas</Option>
          </Select>
          
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: '150px' }}
          >
            <Option value="all">Todos los tipos</Option>
            <Option value="match">Partidos</Option>
            <Option value="score">Resultados</Option>
            <Option value="team">Equipos</Option>
            <Option value="system">Sistema</Option>
          </Select>
          
          <Button
            onClick={loadAllNotifications}
          >
            Actualizar
          </Button>
        </Space>
      </Card>

      {/* Lista de notificaciones */}
      <Card>
        {filteredNotifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No hay notificaciones para mostrar"
            style={{ margin: '20px 0' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} size="small">
                <div style={{ display: 'flex', gap: 12 }}>
                  <Avatar
                    icon={notification.icon}
                    style={{ backgroundColor: notification.color }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Text strong>{notification.title}</Text>
                        {!notification.read && (
                          <Tag color="red" style={{ marginLeft: '8px' }}>
                            Nuevo
                          </Tag>
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(notification.timestamp).toLocaleString()}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                      {notification.message}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Space size="small">
                        <Tag size="small">{notification.type}</Tag>
                        <Button
                          type="link"
                          onClick={() => {
                            // Ver detalles
                          }}
                        >
                          Ver
                        </Button>
                        <Button
                          type="link"
                          onClick={() => {
                            // Marcar como le??da/no le??da
                          }}
                        >
                          {notification.read ? 'Marcar como no le??da' : 'Marcar como le??da'}
                        </Button>
                        <Button
                          type="link"
                          danger
                          onClick={() => {
                            // Eliminar
                          }}
                        >
                          Eliminar
                        </Button>
                      </Space>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </Card>
    </div>
  );
};

export default Notification;

