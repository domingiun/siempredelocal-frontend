// frontend/src/components/competitions/CompetitionMatches.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Button,
  Row, Typography, Avatar, Tooltip, Badge, Alert
} from 'antd';
import { Select } from 'antd';
import {
  EyeOutlined, EditOutlined, PlusOutlined,
  TeamOutlined, EnvironmentOutlined,
  FieldTimeOutlined, FireOutlined,
  CalendarOutlined, LockOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import { formatDateTableUTC } from '../../utils/dateFormatter';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;

const CompetitionMatches = ({ competitionId, competitionName }) => {
  const [matches, setMatches] = useState([]);
  const [teamsInfo, setTeamsInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);
  const navigate = useNavigate();
  
  // Asegúrate de que usePermissions devuelva canEditAny
  const { canCreateMatch, canEdit, isAdmin } = usePermissions();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  useEffect(() => {
    fetchMatches();
  }, [competitionId]);

  const fetchTeamsInfo = async (ids) => {
    const unique = [...new Set(ids.filter(Boolean))];
    const newTeams = {};

    for (const id of unique) {
      if (!teamsInfo[id]) {
        try {
          const res = await competitionService.getTeam(id);
          newTeams[id] = res.data;
        } catch (error) {
          console.error(`Error obteniendo equipo ${id}:`, error);
          newTeams[id] = { id, name: `Equipo ${id}` };
        }
      }
    }

    if (Object.keys(newTeams).length) {
      setTeamsInfo(prev => ({ ...prev, ...newTeams }));
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const limit = 100;
      let skip = 0;
      let data = [];

      while (true) {
        const res = await competitionService.getMatchesWithRounds({
          competition_id: competitionId,
          limit,
          skip
        });

        const batch = res.data || [];
        data = data.concat(batch);
        if (batch.length < limit) break;
        skip += limit;
      }

      setMatches(data);

      const teamIds = data.flatMap(m => [m.home_team_id, m.away_team_id]);
      await fetchTeamsInfo(teamIds);

    } catch (error) {
      console.error('Error cargando partidos:', error);
      message.error('Error cargando partidos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'Finalizado': 'green',
      'Programado': 'blue',
      'En curso': 'orange',
      'Aplazado': 'yellow',
      'Cancelado': 'red'
    };
    return statusMap[status] || 'default';
  };

  const getRoundBadge = (match) => {
    if (!match.round_name) return null;
    
    const isCompleted = match.round?.is_completed || false;
    
    return (
      <Tooltip title={`${match.round_name}${isCompleted ? ' ✓ Completada' : ''}`}>
        <Badge
          count={match.round_number || match.round_id}
          style={{ 
            backgroundColor: isCompleted ? '#52c41a' : '#1890ff',
            marginRight: 8
          }}
        />
      </Tooltip>
    );
  };

  // Usar canEdit en lugar de canEditAny si no está disponible
  const canEditMatch = () => isAdmin; 

  const handleNewMatchClick = () => {
    if (!canCreateMatch()) {
      message.error('Solo los administradores pueden crear nuevos partidos');
      return;
    }
    navigate('/matches/new', { state: { competitionId } });
  };

  const handleEditMatchClick = (matchId) => {
    if (!canEditMatch()) {
      message.error('Solo los administradores pueden editar partidos');
      return;
    }
    navigate(`/matches/edit/${matchId}`);
  };

  const handleUpdateResultClick = (matchId) => {
    if (!canEditMatch()) {
      message.error('Solo los administradores pueden actualizar resultados');
      return;
    }
    navigate(`/matches/${matchId}/update`);
  };

  const columns = [
    {
      title: 'Jornada',
      dataIndex: 'round',
      render: (_, match) => getRoundBadge(match),
      width: 80
    },
    {
      title: 'Fecha',
      align: 'center',
      dataIndex: 'match_date',
      render: (date) => {
        if (!date) return '-';
        
        const { date: dateStr, time: timeStr } = formatDateTableUTC(date);
        
        return (
          <div style={{ textAlign: 'center', minWidth: 90 }}>
            <div><b>{dateStr}</b></div>
            <div style={{ fontSize: '0.8em', color: isDark ? '#9fb0c2' : '#666' }}>
              <FieldTimeOutlined /> {timeStr}
            </div>
          </div>
        );
      },
      width: 100,
      sorter: (b, a) => new Date(a.match_date) - new Date(b.match_date)
    },
    {
      title: 'Partido',
      align: 'center',
      render: (_, match) => {
        const homeTeam = teamsInfo[match.home_team_id] || {};
        const awayTeam = teamsInfo[match.away_team_id] || {};
        
        const score = match.status === 'Finalizado' 
          ? `${match.home_score || 0} - ${match.away_score || 0}`
          : '0 - 0';

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
              <Text strong style={{ textAlign: 'right', marginRight: 8 }}>
                {homeTeam.name || 'Local'}
              </Text>
              <Avatar 
                src={homeTeam.logo_url} 
                size={32}
                style={{ marginRight: 8 }}
              >
                {homeTeam.name?.charAt(0) || 'L'}
              </Avatar>
            </div>

            <div style={{ margin: '0 16px', minWidth: 60 }}>
              <Tag 
                color={match.status === 'Finalizado' ? '#52c41a' : '#d9d9d9'}
                style={{
                  fontSize: '1em',
                  fontWeight: 'bold',
                  background: isDark
                    ? (match.status === 'Finalizado' ? '#0b1f16' : '#121a26')
                    : undefined,
                  borderColor: isDark
                    ? (match.status === 'Finalizado' ? '#1f8a4c' : '#2a3647')
                    : undefined,
                  color: isDark
                    ? (match.status === 'Finalizado' ? '#86efac' : '#e6edf3')
                    : undefined
                }}
              >
                {score}
              </Tag>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Avatar 
                src={awayTeam.logo_url} 
                size={32}
                style={{ marginRight: 8 }}
              >
                {awayTeam.name?.charAt(0) || 'V'}
              </Avatar>
              <Text strong>
                {awayTeam.name || 'Visitante'}
              </Text>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Estadio',
      align: 'center',
      render: (_, match) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EnvironmentOutlined style={{ marginRight: 8, color: isDark ? '#9fb0c2' : '#666' }} />
          <Text style={{ fontSize: '0.9em' }}>
            {match.stadium || 'Por definir'}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Estado del Partido',
      align: 'center',
      render: (_, match) => (
        <Tag 
          color={getStatusColor(match.status)}
          style={
            isDark
              ? {
                  background:
                    match.status === 'Finalizado'
                      ? '#0b1f16'
                      : match.status === 'Programado'
                        ? '#111b2a'
                        : match.status === 'En curso'
                          ? '#231a0e'
                          : match.status === 'Cancelado'
                            ? '#2b1315'
                            : '#121a26',
                  borderColor:
                    match.status === 'Finalizado'
                      ? '#1f8a4c'
                      : match.status === 'Programado'
                        ? '#254a92'
                        : match.status === 'En curso'
                          ? '#7a4b10'
                          : match.status === 'Cancelado'
                            ? '#7a1f24'
                            : '#2a3647',
                  color:
                    match.status === 'Finalizado'
                      ? '#86efac'
                      : match.status === 'Programado'
                        ? '#93c5fd'
                        : match.status === 'En curso'
                          ? '#fdba74'
                          : match.status === 'Cancelado'
                            ? '#fca5a5'
                            : '#e6edf3'
                }
              : undefined
          }
        >
          {match.status || 'Programado'}
        </Tag>
      ),
      width: 120
    },
    {
      title: 'Acciones',
      render: (_, match) => (
        <Space>
          {/* Botón Ver siempre visible */}
          <Tooltip title="Ver detalles">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/matches/${match.id}`)}
            />
          </Tooltip>
          
          {/* Botón Editar solo para admin - USAR canEditMatch() */}
          {canEditMatch() && (
            <Tooltip title="Editar">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditMatchClick(match.id)}
              />
            </Tooltip>
          )}
          
          {/* Botón Actualizar Resultado solo para admin - USAR canEditMatch() */}
         {match.status === 'Programado' && canEditMatch() && (
          <Tooltip title="Actualizar resultado">
            <Button
              type="text"
              icon={<FireOutlined />}
              onClick={() => handleUpdateResultClick(match.id)}
            />
          </Tooltip>
        )}
        </Space>
      ),
      width: 150
    }
  ];

  const filteredMatches = selectedRound
    ? matches.filter(m => m.round_number === selectedRound)
    : matches;

  const sortedMatches = [...filteredMatches].sort(
    (a, b) => b.round_number - a.round_number
  );

  const availableRounds = Array.from(
    new Set(matches.map(m => m.round_number).filter(Boolean))
  ).sort((a, b) => a - b);

  return (
    <Card className="competition-tab-card">
      <Row justify="space-between" style={{ marginBottom: 20, alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <CalendarOutlined style={{ marginRight: 8 }} />
            {competitionName} – Partidos
          </Title>
          <Text type="secondary">
            {matches.length} partidos encontrados • 
            {isAdmin ? ' Permisos de administrador' : ' Contacta con un administrador para crear o editar partidos'}
          </Text>
        </div>

        <Space>
          {/* Filtro por jornada */}
          <Space>
            <Text strong>Jornada:</Text>
            <Select
              className="competition-round-select"
              style={{ width: 120 }}
              placeholder="Todas"
              allowClear
              value={selectedRound}
              onChange={value => setSelectedRound(value)}
            >
              {availableRounds.map(round => (
                <Select.Option key={round} value={round}>
                  Jornada {round}
                </Select.Option>
              ))}
            </Select>
          </Space>

          {/* Botón nuevo partido - SOLO PARA ADMIN */}
          {canCreateMatch() ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNewMatchClick}
            >
              Nuevo Partido
            </Button>
          ) : (
            <Tooltip title="Solo administradores pueden crear partidos">
              <Button
                type="default"
                icon={<LockOutlined />}
                disabled
                style={{ 
                  borderColor: '#d9d9d9', 
                  color: '#d9d9d9',
                  cursor: 'not-allowed'
                }}
              >
                Nuevo Partido
              </Button>
            </Tooltip>
          )}
        </Space>
      </Row>

      <Table
        columns={columns}
        dataSource={sortedMatches}
        rowKey="id"
        loading={loading}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} partidos`
        }}
        locale={{
          emptyText: (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: 50, color: isDark ? '#6b7c93' : '#ccc', marginBottom: 16 }} />
              <p>No hay partidos en esta competencia</p>
              
              {/* Mostrar botón o mensaje según permisos */}
              {canCreateMatch() ? (
                <Button 
                  type="primary" 
                  onClick={handleNewMatchClick}
                  style={{ marginTop: 16 }}
                >
                  Crear primer partido
                </Button>
              ) : (
                <Alert
                  title="Sin permisos de creación"
                  description="Para crear partidos, contacta con un administrador del sistema."
                  type="warning"
                  showIcon
                  style={{ marginTop: 16, maxWidth: 400, margin: '0 auto' }}
                />
              )}
            </div>
          )
        }}
        style={{ marginTop: 16 }}
      />
    </Card>
  );
};

export default CompetitionMatches;



