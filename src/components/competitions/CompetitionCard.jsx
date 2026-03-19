// frontend/src/components/competitions/CompetitionCard.jsx
import React from 'react';
import { 
  Card, Tag, Space, Progress, Avatar, Badge, Image, Popconfirm, Tooltip 
} from 'antd';
import { 
  TrophyOutlined, TeamOutlined, CalendarOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined,
  CrownOutlined, ArrowUpOutlined, ArrowDownOutlined,
  LockOutlined, UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './CompetitionCard.css';

const CompetitionCard = ({ competition, showActions = true, onDelete }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getLogoSrc = (logoUrl) => {
    if (!logoUrl) return undefined;
    return logoUrl.startsWith('http') ? logoUrl : `${apiBaseUrl}${logoUrl}`;
  };
  const hasLogo = Boolean(competition.logo_url);


  const normalizeStatus = (status) => {
    if (!status) return status;
    const normalized = String(status).trim().toLowerCase();
    const statusMap = {
      'draft': 'En curso',
      'borrador': 'En curso',
      'active': 'En curso',
      'en curso': 'En curso',
      'en_curso': 'En curso',
      'completed': 'Finalizado',
      'finalizado': 'Finalizado',
      'cancelled': 'Cancelado',
      'cancelado': 'Cancelado',
      'scheduled': 'Programado',
      'programado': 'Programado'
    };
    return statusMap[normalized] || status;
  };

  const getStatusConfig = (status) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'En curso':
        return { color: 'green', icon: '▶️' };
      case 'Programado':
        return { color: 'blue', icon: '📅' };
      case 'Finalizado':
        return { color: 'gray', icon: '🏁' };
      case 'Cancelado':
        return { color: 'red', icon: '❌' };
      default:
        return { color: 'default', icon: '❓' };
    }
  };

  const getCompetitionType = (type) => {
    const types = {
      'league': { label: 'Liga', color: 'blue', icon: '🏆' },
      'cup': { label: 'PTSa', color: 'red', icon: '🏆' },
      'league_cup': { label: 'Liga + PTSa', color: 'purple', icon: '🏆' },
      'groups_playoff': { label: 'Grupos + Playoff', color: 'orange', icon: '📊' },
    };
    return types[type] || { label: type, color: 'default', icon: '🏆' };
  };

  const normalizedStatus = normalizeStatus(competition.status);
  const statusConfig = getStatusConfig(normalizedStatus);
  const typeConfig = getCompetitionType(competition.competition_type);

  // Verificar permisos
  const canEdit = () => {
    if (!user) return false;
    if (isAdmin) return true;
    // Si el usuario es el creador de la competencia
    if (competition.created_by === user.id) return true;
    return false;
  };

  const canDelete = () => {
    if (!user) return false;
    if (isAdmin) return true;
    // Solo admin puede borrar competencias
    return false;
  };

  const calculateProgress = () => {
    if (normalizedStatus === 'Finalizado') return 100;
    if (normalizedStatus === 'Cancelado') return 0;
    if (normalizedStatus === 'Programado') return 10;
    if (normalizedStatus === 'En curso') return 50;
    return 0;
  };

  const progress = calculateProgress();

  const formatDate = (dateString) => {
    if (!dateString) return 'Agotado';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Construir acciones basadas en permisos
  const getActions = () => {
    const actions = [];
    
    // Ver siempre visible para todos
    actions.push(
      <Tooltip title="Ver detalles" key="view">
        <EyeOutlined 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/competitions/${competition.id}`);
          }}
          style={{ color: '#1890ff' }}
        />
      </Tooltip>
    );

    // Editar solo si tiene permisos
    if (canEdit()) {
      actions.push(
        <Tooltip title="Editar competencia" key="edit">
          <EditOutlined 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/competitions/${competition.id}/edit`);
            }}
            style={{ color: '#52c41a' }}
          />
        </Tooltip>
      );
    } else if (showActions) {
      // Mostrar bloqueado si no tiene permisos
      actions.push(
        <Tooltip title="No tienes permisos para editar" key="edit-locked">
          <LockOutlined style={{ color: '#d9d9d9', cursor: 'not-allowed' }} />
        </Tooltip>
      );
    }

    // Eliminar solo admin
    if (canDelete()) {
      actions.push(
        <Tooltip title="Eliminar competencia" key="delete">
          <Popconfirm
            title="¿Eliminar competencia?"
            description="Esta acción no se puede deshacer. ¿Estás seguro?"
            onConfirm={(e) => {
              e?.stopPropagation();
              onDelete && onDelete(competition.id);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okType="danger"
            placement="top"
          >
            <DeleteOutlined 
              onClick={(e) => e.stopPropagation()}
              style={{ color: '#ff4d4f' }}
            />
          </Popconfirm>
        </Tooltip>
      );
    } else if (showActions) {
      actions.push(
        <Tooltip title="Solo administradores pueden eliminar" key="delete-locked">
          <LockOutlined style={{ color: '#d9d9d9', cursor: 'not-allowed' }} />
        </Tooltip>
      );
    }

    return actions;
  };

  // Verificar si es competencia del usuario actual
  const isUserCompetition = competition.created_by === user?.id;

  return (
    <Card
      className="competition-card"
      hoverable
      actions={showActions ? getActions() : []}
      onClick={() => navigate(`/competitions/${competition.id}`)}
    >
      {/* Indicador si es competencia del usuario */}
      {isUserCompetition && (
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <Tag color="gold" icon={<UserOutlined />} style={{ fontSize: '10px' }}>
            Tu competencia
          </Tag>
        </div>
      )}

      {/* Indicador si es admin */}
      {isAdmin && (
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <Tag color="red" style={{ fontSize: '10px', padding: '2px 6px' }}>
            ADMIN
          </Tag>
        </div>
      )}

      <div className="competition-card-header">
        <Space align="start" style={{ width: '100%' }}>
          <Badge 
            count={competition.total_teams}
            overflowCount={99}
            style={{ 
              backgroundColor: typeConfig.color,
              color: '#fff'
            }}
          >
            <Avatar 
              size={48}
              src={getLogoSrc(competition.logo_url)}
              icon={!competition.logo_url ? <TrophyOutlined /> : undefined}
              style={{ 
                backgroundColor: hasLogo ? 'transparent' : statusConfig.color,
                boxShadow: `0 0 0 2px ${statusConfig.color}20`,
                border: isUserCompetition ? '2px solid #faad14' : 'none'
              }}
              className="competition-logo-avatar"
            />
          </Badge>
          
          <div className="competition-card-info" style={{ flex: 1 }}>
            <h3 className="competition-card-title">
              {competition.name}
              {normalizedStatus === 'En curso' && (
                <CrownOutlined style={{ color: '#faad14', marginLeft: 8 }} />
              )}
            </h3>
            
            <Space size={[4, 8]} wrap>
              <Tag color={typeConfig.color}>
                <span style={{ marginRight: 4 }}>{typeConfig.icon}</span>
                {typeConfig.label}
              </Tag>
              
              <Tag color={statusConfig.color}>
                <span style={{ marginRight: 4 }}>{statusConfig.icon}</span>
                {normalizedStatus}
              </Tag>
              
              <Tag color="geekblue" icon={<TeamOutlined />}>
                {competition.total_teams} equipos
              </Tag>
              
              {competition.country && (
                <Tag color="cyan">
                  <img 
                    src={`https://flagcdn.com/w20/${competition.country.toLowerCase()}.png`}
                    alt={competition.country}
                    style={{ width: 16, height: 12, marginRight: 4 }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {competition.country}
                </Tag>
              )}
            </Space>
          </div>
        </Space>
      </div>

      <div className="competition-card-body">
        <div className="competition-card-dates">
          <Space orientation="vertical" size={2} align="center">
            <span style={{ fontSize: '12px', color: '#666' }}>
              <CalendarOutlined /> Temporada
            </span>
            <strong>{competition.season || 'N/A'}</strong>
          </Space>

          <Space orientation="vertical" size={2} align="center">
            <span style={{ fontSize: '12px', color: '#666' }}>
              <CalendarOutlined /> Inicio
            </span>
            <span>{formatDate(competition.start_date)}</span>
          </Space>

          <Space orientation="vertical" size={2} align="center">
            <span style={{ fontSize: '12px', color: '#666' }}>
              <CalendarOutlined /> Fin
            </span>
            <span>{formatDate(competition.end_date) || 'Sin definir'}</span>
          </Space>
        </div>

        {competition.description && (
          <div className="competition-card-description">
            <p style={{ margin: 0, fontSize: '14px' }}>{competition.description}</p>
          </div>
        )}

        <div className="competition-card-progress">
          <div style={{ marginBottom: 8 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px' }}>Progreso</span>
              <span style={{ fontWeight: 'bold' }}>{progress}%</span>
            </Space>
          </div>
          <Progress 
            percent={progress} 
            strokeColor={statusConfig.color}
            showInfo={false}
            size="small"
          />
          <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 4 }}>
            <small style={{ color: '#666', fontSize: '11px' }}>
              {normalizedStatus === 'Finalizado' ? 'Completado' : 
               normalizedStatus === 'Cancelado' ? 'Cancelado' :
               normalizedStatus === 'Programado' ? 'Por comenzar' :
               'En progreso'}
            </small>
            <small style={{ fontSize: '11px' }}>
              {competition.start_date ? formatDate(competition.start_date) : 'Agotado'}
            </small>
          </Space>
        </div>

        {/* Información adicional */}
        <div className="competition-card-footer">
          <Space size={16} wrap style={{ justifyContent: 'center' }}>
            {competition.teams_to_qualify > 0 && (
              <Tooltip title="Equipos que clasifican a playoffs">
                <Space orientation="vertical" size={0} align="center">
                  <Tag color="blue" style={{ margin: 0 }}>
                    <ArrowUpOutlined /> {competition.teams_to_qualify}
                  </Tag>
                  <small style={{ fontSize: '10px' }}>Clasifican</small>
                </Space>
              </Tooltip>
            )}
            
            {competition.promotion_spots > 0 && (
              <Tooltip title="Ascensos">
                <Space orientation="vertical" size={0} align="center">
                  <Tag color="green" style={{ margin: 0 }}>
                    <ArrowUpOutlined /> {competition.promotion_spots}
                  </Tag>
                  <small style={{ fontSize: '10px' }}>Ascensos</small>
                </Space>
              </Tooltip>
            )}
            
            {competition.relegation_spots > 0 && (
              <Tooltip title="Descensos">
                <Space orientation="vertical" size={0} align="center">
                  <Tag color="red" style={{ margin: 0 }}>
                    <ArrowDownOutlined /> {competition.relegation_spots}
                  </Tag>
                  <small style={{ fontSize: '10px' }}>Descensos</small>
                </Space>
              </Tooltip>
            )}
            
            {competition.international_spots > 0 && (
              <Tooltip title="Cupos internacionales">
                <Space orientation="vertical" size={0} align="center">
                  <Tag color="gold" style={{ margin: 0 }}>
                    🌍 {competition.international_spots}
                  </Tag>
                  <small style={{ fontSize: '10px' }}>Internacional</small>
                </Space>
              </Tooltip>
            )}
            
            {competition.groups > 0 && (
              <Tooltip title="Número de grupos">
                <Space orientation="vertical" size={0} align="center">
                  <Tag color="purple" style={{ margin: 0 }}>
                    📊 {competition.groups}
                  </Tag>
                  <small style={{ fontSize: '10px' }}>Grupos</small>
                </Space>
              </Tooltip>
            )}
          </Space>
        </div>

        {/* Información del creador */}
        {competition.created_by_name && (
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '8px', 
            borderTop: '1px dashed #f0f0f0',
            fontSize: '11px', 
            color: '#999',
            textAlign: 'center'
          }}>
            <Space size={4}>
              <UserOutlined />
              <span>Creado por: {competition.created_by_name}</span>
            </Space>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CompetitionCard;
