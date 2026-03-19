// frontend/src/components/teams/TeamCard.jsx
import React, { useState } from 'react';
import { 
  Card, Tag, Space, Button, Avatar, Progress, 
  Tooltip, Badge, Popconfirm, message, Typography 
} from 'antd';
import { 
  TeamOutlined, TrophyOutlined, StarOutlined,
  EnvironmentOutlined, CalendarOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined, UserOutlined,
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './TeamCard.css';

const { Text } = Typography;

const getRecentForm = (team) =>
    team?.recent_form ??
    team?.form ??
    team?.standing?.recent_form ??
    [];

const TeamCard = ({ 
  team, 
  onEdit, 
  onDelete, 
  showActions = true,
  showStats = true,
  compact = false,
  position = null,
  onClick 
}) => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const resolveLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleClick = () => {
    if (onClick) {
      onClick(team);
    } else {
      navigate(`/teams/${team.id}`);
    }
  };
  console.log("PADRE → team enviado a TeamCard:", team);

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(team);
    } else {
      navigate(`/teams/${team.id}/edit`);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (onDelete) {
      try {
        setLoading(true);
        await onDelete(team.id);
        message.success('Equipo eliminado correctamente');
      } catch (error) {
        message.error('Error al eliminar equipo');
      } finally {
        setLoading(false);
      }
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 70) return '#52c41a';
    if (percentage >= 50) return '#faad14';
    return '#ff4d4f';
  };

  const getPositionBadge = () => {
    if (!position) return null;
    
    let badgeProps = {};
    
    switch(position) {
      case 1:
        badgeProps = {
          count: <TrophyOutlined style={{ color: '#faad14' }} />,
          style: { backgroundColor: 'transparent', boxShadow: 'none' }
        };
        break;
      case 2:
        badgeProps = {
          count: 2,
          style: { backgroundColor: '#1890ff' }
        };
        break;
      case 3:
        badgeProps = {
          count: 3,
          style: { backgroundColor: '#722ed1' }
        };
        break;
      default:
        badgeProps = {
          count: position,
          style: { backgroundColor: '#8c8c8c' }
        };
    }
    
    return (
      <Badge {...badgeProps} />
    );
  };

  const renderStats = () => {
    if (!showStats || !team) return null;
  
    const performanceRate = team.matches_played > 0 
      ? (team.points / (team.matches_played * 3)) * 100 
      : 0;
      console.log('TEAM CARD team:', team);
      console.log('TEAM CARD recentForm:', getRecentForm(team));

    return (
      <div className="team-stats">
        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
          {/* Estadísticas básicas */}
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space orientation="vertical" size={0}>
              <Text type="secondary" className="stat-label">Partidos</Text>
              <Text strong>{team.matches_played || 0}</Text>
            </Space>
            <Space orientation="vertical" size={0} align="end">
              <Text type="secondary" className="stat-label">Puntos</Text>
              <Text strong style={{ color: '#1890ff' }}>
                {team.points || 0}
              </Text>
            </Space>
          </Space>

          {/* Rendimiento */}
          <div style={{ marginTop: 8 }}>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <Text type="secondary" className="stat-label">Rendimiento</Text>
              <Text strong style={{ color: getPerformanceColor(performanceRate) }}>
                {performanceRate.toFixed(1)}%
              </Text>
            </Space>
            <Progress 
              percent={performanceRate} 
              size="small" 
              showInfo={false}
              strokeColor={getPerformanceColor(performanceRate)}
              style={{ marginTop: 4 }}
            />
          </div>

          {/* Goles */}
          <div style={{ marginTop: 8 }}>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <Space orientation="vertical" size={0}>
                <Text type="secondary" className="stat-label">GF</Text>
                <Text strong style={{ color: '#52c41a' }}>
                  {team.goals_for || 0}
                </Text>
              </Space>
              <Space orientation="vertical" size={0}>
                <Text type="secondary" className="stat-label">GC</Text>
                <Text strong style={{ color: '#ff4d4f' }}>
                  {team.goals_against || 0}
                </Text>
              </Space>
              <Space orientation="vertical" size={0}>
                <Text type="secondary" className="stat-label">DG</Text>
                <Text strong style={{ 
                  color: team.goal_difference > 0 ? '#52c41a' : 
                         team.goal_difference < 0 ? '#ff4d4f' : '#8c8c8c' 
                }}>
                  {team.goal_difference > 0 ? '+' : ''}{team.goal_difference || 0}
                </Text>
              </Space>
            </Space>
          </div>

          {/* Forma reciente */}
          {!compact && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" className="stat-label">Forma Reciente</Text>
              <Space size={4} style={{ marginTop: 4 }}>
               {getRecentForm(team).map((result, index) => (
                
                <div
                  key={index}
                  className={`form-badge form-${result.toLowerCase()}`}
                >
                  {result}
                </div>
              ))}
              </Space>
            </div>
          )}
        </Space>
      </div>
    );
  };

  const renderActions = () => {
    if (!showActions) return null;

    return (
      <div className="team-actions">
        <Space>
          <Tooltip title="Ver detalles">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={handleClick}
            />
          </Tooltip>
          
          <Tooltip title="Editar">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={handleEdit}
            />
          </Tooltip>
          
          <Popconfirm
            title="¿Eliminar equipo?"
            description="Esta acción no se puede deshacer."
            onConfirm={handleDelete}
            okText="Eliminar"
            cancelText="Cancelar"
            okType="danger"
          >
            <Tooltip title="Eliminar">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                loading={loading}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      </div>
    );
  };

  const renderCompactView = () => (
    <Card 
      hoverable
      className="team-card compact"
      onClick={handleClick}
    >
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space>
          {getPositionBadge()}
          {team.logo_url ? (
            <Avatar src={resolveLogoUrl(team.logo_url)} size="small" />
          ) : (
            <Avatar 
              size="small" 
              style={{ backgroundColor: '#1890ff' }}
            >
              {team.name?.charAt(0)?.toUpperCase()}
            </Avatar>
          )}
          <div>
            <Text strong style={{ fontSize: '14px' }}>{team.name}</Text>
            {team.short_name && (
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                {team.short_name}
              </div>
            )}
          </div>
        </Space>

        <Space orientation="vertical" align="end" size={0}>
          <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
            {team.points || 0}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            pts
          </Text>
        </Space>
      </Space>
    </Card>
  );

  const renderFullView = () => (
    <Card 
      hoverable
      className="team-card"
      onClick={handleClick}
      actions={showActions ? [
        <EyeOutlined key="view" onClick={handleClick} />,
        <EditOutlined key="edit" onClick={handleEdit} />,
        <DeleteOutlined key="delete" onClick={(e) => e.stopPropagation()} />
      ] : []}
    >
      {/* Header con posición y logo */}
      <div className="team-header">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            {getPositionBadge()}
            {team.logo_url ? (
              <Avatar src={resolveLogoUrl(team.logo_url)} size="large" />
            ) : (
              <Avatar 
                size="large" 
                style={{ 
                  backgroundColor: '#1890ff',
                  fontSize: '24px'
                }}
              >
                {team.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            )}
            <div>
              <Text strong style={{ fontSize: '18px' }}>{team.name}</Text>
              {team.short_name && (
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  {team.short_name}
                </div>
              )}
            </div>
          </Space>
          
          <Tag color="blue" style={{ fontSize: '16px', padding: '4px 12px' }}>
            {team.points || 0} pts
          </Tag>
        </Space>
        
        {/* Ubicación */}
        {(team.city || team.country) && (
          <Space style={{ marginTop: 8 }}>
            <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary">
              {team.city}{team.city && team.country ? ', ' : ''}{team.country}
            </Text>
          </Space>
        )}
        
        {/* Estadio */}
        {team.stadium && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <CalendarOutlined /> {team.stadium}
            </Text>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {renderStats()}

      {/* Estado */}
      <div style={{ marginTop: 16 }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Tag color={team.is_active ? 'green' : 'red'}>
            {team.is_active ? 'Activo' : 'Inactivo'}
          </Tag>
          
          {team.website && (
            <a 
              href={team.website} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Sitio web
              </Text>
            </a>
          )}
        </Space>
      </div>
    </Card>
  );

  return compact ? renderCompactView() : renderFullView();
};

export default TeamCard;
