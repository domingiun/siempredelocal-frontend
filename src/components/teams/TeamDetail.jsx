// frontend/src/components/teams/TeamDetail.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Space, Typography, Row, Col, 
  Tag, Avatar, Statistic, Descriptions, Tabs, 
  Table, message, Divider, Modal 
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  TeamOutlined, EnvironmentOutlined, TrophyOutlined,
  CalendarOutlined, GlobalOutlined, LinkOutlined,
  BarChartOutlined, HistoryOutlined, CrownOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import TeamCard from './TeamCard';
import { formatDateTimeShort, formatForInputUTC } from '../../utils/dateFormatter';

const { Title, Text } = Typography;

const TeamDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teamsInfo, setTeamsInfo] = useState({});
  const [stats, setStats] = useState({
    overall: {},
    recent: [],
    form: ''
  });

  useEffect(() => {
    if (id) {
      fetchTeamDetails();
    }
  }, [id]);

  const fetchTeamDetails = async () => {
    setLoading(true);
    try {
      // Obtener información del equipo
      const teamResponse = await competitionService.getTeam(id);
      console.log('TEAM DETAIL → team recibido:', teamResponse.data);
      setTeam(teamResponse.data);
      
      // Obtener competencias del equipo
      fetchTeamCompetitions();
      
      // Obtener partidos recientes
      fetchRecentMatches();
      
    } catch (error) {
      message.error('Error al cargar los datos del equipo');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };
  

  const fetchTeamCompetitions = async () => {
    try {
      const response = await competitionService.getCompetitions();
      const allCompetitions = response.data || [];
      
      // Filtrar competencias donde está el equipo
      // Nota: Necesitarías un endpoint específico para esto
      const teamCompetitions = allCompetitions.slice(0, 3); // Temporal
      setCompetitions(teamCompetitions);
    } catch (error) {
      console.error('Error al cargar competencias del equipo:', error);
    }
  };

  const fetchTeamsInfo = async (matchList) => {
    try {
      // Verificar que team exista y tenga id
      if (!team || !team.id) {
        console.warn('Team no disponible para excluir de la búsqueda');
        return;
      }
      
      // Extraer IDs únicos de equipos de todos los partidos
      const teamIds = [...new Set([
        ...matchList.map(m => m.home_team_id),
        ...matchList.map(m => m.away_team_id)
      ])].filter(id => id && id !== team.id); // Excluir el equipo actual
          
      console.log('🔄 Obteniendo información de equipos:', teamIds);
      
      // Si no hay otros equipos, retornar
      if (teamIds.length === 0) {
        console.log('No hay otros equipos en los partidos');
        return;
      }
      
      // Obtener información de cada equipo
      const teamsData = {};
      for (const teamId of teamIds) {
        try {
          const response = await competitionService.getTeam(teamId);
          if (response.data) {
            teamsData[teamId] = response.data;
          }
        } catch (error) {
          console.warn(`No se pudo obtener equipo ${teamId}:`, error);
        }
      }
      
      setTeamsInfo(teamsData);
      console.log('✅ Información de equipos obtenida:', Object.keys(teamsData).length);
      
    } catch (error) {
      console.error('Error obteniendo información de equipos:', error);
    }
  };

  // Modifica fetchRecentMatches para usar la nueva función
    const fetchRecentMatches = async () => {
      try {
        const limit = 100;
        let skip = 0;
        let data = [];

        while (true) {
          const response = await competitionService.getMatches({ 
            limit,
            skip,
            team_id: id 
          });
          const batch = response.data || [];
          data = data.concat(batch);
          if (batch.length < limit) break;
          skip += limit;
        }

        const matchList = data.slice().sort((a, b) => {
          const aTime = new Date(a.match_date || 0).getTime();
          const bTime = new Date(b.match_date || 0).getTime();
          return bTime - aTime;
        });
        setMatches(matchList);
        
        // Obtener informaci�n de equipos de esos partidos
        if (matchList.length > 0) {
          await fetchTeamsInfo(matchList);
        }
        
      } catch (error) {
        console.error('Error al cargar partidos recientes:', error);
      }
    };

  const handleEdit = () => {
    navigate(`/teams/${id}/edit`);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '¿Eliminar equipo?',
      content: 'Esta acción no se puede deshacer. El equipo será marcado como inactivo.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await competitionService.deleteTeam(id);
          message.success('Equipo eliminado exitosamente');
          navigate('/teams');
        } catch (error) {
          message.error('Error al eliminar el equipo');
        }
      },
    });
  };

  const calculateStats = () => {
    if (!team) return {};
    
    const totalMatches = team.matches_played || 0;
    const winRate = totalMatches > 0 ? (team.matches_won / totalMatches * 100) : 0;
    const drawRate = totalMatches > 0 ? (team.matches_drawn / totalMatches * 100) : 0;
    const lossRate = totalMatches > 0 ? (team.matches_lost / totalMatches * 100) : 0;
    const performanceRate = totalMatches > 0 ? (team.points / (totalMatches * 3) * 100) : 0;
    
    return {
      winRate: winRate.toFixed(1),
      drawRate: drawRate.toFixed(1),
      lossRate: lossRate.toFixed(1),
      avgGoalsFor: totalMatches > 0 ? (team.goals_for / totalMatches).toFixed(2) : 0,
      avgGoalsAgainst: totalMatches > 0 ? (team.goals_against / totalMatches).toFixed(2) : 0,
      pointsPerMatch: totalMatches > 0 ? (team.points / totalMatches).toFixed(2) : 0,
      performanceRate: performanceRate.toFixed(1),
    };
  };

  const normalizeWebsite = (value) => {
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return `https://${value}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={3}>Cargando equipo...</Title>
      </div>
    );
  }

  if (!team) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Title level={3}>Equipo no encontrado</Title>
          <Button onClick={() => navigate('/teams')}>Volver a equipos</Button>
        </Card>
      </div>
    );
  }

  const calculatedStats = calculateStats();
  const websiteUrl = normalizeWebsite(team.website);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Space orientation="vertical" style={{ width: '100%', marginBottom: '24px' }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/teams')}
          style={{ padding: 0 }}
        >
          Volver a equipos
        </Button>
        
        <Row gutter={[24, 24]} align="middle">
          <Col flex="auto">
            <Space>
              {team.logo_url ? (
                <Avatar src={team.logo_url} size={64} />
              ) : (
                <Avatar size={64} style={{ backgroundColor: '#1890ff' }}>
                  {team.name?.charAt(0)}
                </Avatar>
              )}
              <div>
                <Title level={2} style={{ margin: 0 }}>{team.name}</Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  {team.short_name}
                </Text>
              </div>
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
                style={{
                  backgroundColor: '#0958d9',
                  borderColor: '#0958d9',
                  color: '#ffffff',
                  fontWeight: 600
                }}
              >
                Editar
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </Space>
          </Col>
        </Row>
      </Space>

      <Row gutter={[24, 24]}>
        {/* Información principal */}
        <Col xs={24} lg={16}>
          <Card>
            <Tabs
              defaultActiveKey="info"
              items={[
                {
                  key: 'info',
                  label: (
                    <span>
                      <TeamOutlined />
                      Información
                    </span>
                  ),
                  children: (
                    <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                      <Descriptions.Item label="Nombre">
                        <Text strong>{team.name}</Text>
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Nombre Corto">
                        {team.short_name || 'No especificado'}
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="País">
                        <Space>
                          <GlobalOutlined />
                          {team.country || 'No especificado'}
                        </Space>
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Ciudad">
                        <Space>
                          <EnvironmentOutlined />
                          {team.city || 'No especificado'}
                        </Space>
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Estadio" span={2}>
                        <Space>
                          <CalendarOutlined />
                          {team.stadium || 'No especificado'}
                        </Space>
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Sitio Web">
                        {team.website ? (
                          <a 
                            href={websiteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Space>
                              <LinkOutlined />
                              {team.website}
                            </Space>
                          </a>
                        ) : 'No especificado'}
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Estado">
                        <Tag color={team.is_active ? 'green' : 'red'}>
                          {team.is_active ? 'Activo' : 'Inactivo'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  )
                },
                {
                  key: 'stats',
                  label: (
                    <span>
                      <TrophyOutlined />
                      Estadísticas
                    </span>
                  ),
                  children: (
                    <>
                      <Row gutter={[16, 16]}>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Partidos Jugados"
                            value={team.matches_played || 0}
                            prefix={<TeamOutlined />}
                          />
                        </Col>
                        
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Puntos"
                            value={team.points || 0}
                            prefix={<TrophyOutlined />}
                          />
                        </Col>
                        
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Goles a Favor"
                            value={team.goals_for || 0}
                            styles={{ value:{color: '#52c41a' }}}
                          />
                        </Col>
                        
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Goles en Contra"
                            value={team.goals_against || 0}
                            styles={{ value:{ color: '#ff4d4f' }}}
                          />
                        </Col>
                        
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Diferencia"
                            value={team.goal_difference || 0}
                            styles={{ value:{  color: team.goal_difference > 0 ? '#52c41a' : 
                                     team.goal_difference < 0 ? '#ff4d4f' : '#8c8c8c' }
                            }}
                            prefix={team.goal_difference > 0 ? '+' : ''}
                          />
                        </Col>
                        
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Victorias"
                            value={team.matches_won || 0}
                          />
                        </Col>
                        
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Empates"
                            value={team.matches_drawn || 0}
                          />
                        </Col>
                        
                        <Col xs={12} sm={6}>
                          <Statistic
                            title="Derrotas"
                            value={team.matches_lost || 0}
                          />
                        </Col>
                      </Row>

                      <Divider />

                      <Title level={4}>Promedios</Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={12} sm={6}>
                          <Card size="small">
                            <Statistic
                              title="% Victorias"
                              value={calculatedStats.winRate}
                              suffix="%"
                              styles={{ value:{ color: '#52c41a'} }}
                            />
                          </Card>
                        </Col>
                        
                        <Col xs={12} sm={6}>
                          <Card size="small">
                            <Statistic
                              title="Promedio GF"
                              value={calculatedStats.avgGoalsFor}
                              styles={{ value:{color: '#52c41a'} }}
                            />
                          </Card>
                        </Col>
                        
                        <Col xs={12} sm={6}>
                        <Card size="small">
                          <Statistic
                            title="Promedio GC"
                            value={calculatedStats.avgGoalsAgainst}
                            styles={{
                              value: { color: '#ff4d4f' }
                            }}
                          />
                        </Card>
                      </Col>

                        
                        <Col xs={12} sm={6}>
                          <Card size="small">
                            <Statistic
                              title="Puntos/Partido"
                              value={calculatedStats.pointsPerMatch}
                            />
                          </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Card size="small">
                            <Statistic
                              title="Rendimiento del Equipo"
                              value={calculatedStats.performanceRate}
                              suffix="%"
                              styles={{ value:{ color: '#1890ff' } }}
                            />
                          </Card>
                        </Col>
                      </Row>
                    </>
                  )
                },
                {
                  key: 'matches',
                  label: (
                    <span>
                      <HistoryOutlined />
                      Partidos Recientes
                    </span>
                  ),
                  children: (
                    matches.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {matches.map(match => {
                          // Obtener nombres de diferentes formas posibles
                          const homeTeamName = match.home_team?.name || 
                                              match.home_team_name || 
                                              `Equipo ${match.home_team_id}`;
                          
                          const awayTeamName = match.away_team?.name || 
                                              match.away_team_name || 
                                              `Equipo ${match.away_team_id}`;
                          
                          // Obtener logos si existen
                          const homeTeamLogo =
                            match.home_team?.logo_url ||
                            match.home_team_logo ||
                            teamsInfo[match.home_team_id]?.logo_url ||
                            null;
                          const awayTeamLogo =
                            match.away_team?.logo_url ||
                            match.away_team_logo ||
                            teamsInfo[match.away_team_id]?.logo_url ||
                            null;
                          
                          return (
                            <Card key={match.id} size="small" style={{ width: '100%' }}>
                              <Space orientation="vertical" style={{ width: '100%' }}>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  alignItems: 'center' 
                                }}>
                                  {/* Equipo local con escudo */}
                                  <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    <Text strong style={{ marginRight: '8px' }}>{homeTeamName}</Text>
                                    {homeTeamLogo && (
                                      <Avatar 
                                        src={homeTeamLogo} 
                                        size="small"
                                        style={{ width: '24px', height: '24px' }}
                                      />
                                    )}
                                  </div>
                                  
                                  {/* Marcador */}
                                  <div style={{ margin: '0 16px' }}>
                                    <Space>
                                      <Text strong style={{ fontSize: '20px' }}>
                                        {match.home_score || 0}
                                      </Text>
                                      <Text> - </Text>
                                      <Text strong style={{ fontSize: '20px' }}>
                                        {match.away_score || 0}
                                      </Text>
                                    </Space>
                                  </div>
                                  
                                  {/* Equipo visitante con escudo */}
                                  <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    {awayTeamLogo && (
                                      <Avatar 
                                        src={awayTeamLogo} 
                                        size="small"
                                        style={{ width: '24px', height: '24px', marginRight: '8px' }}
                                      />
                                    )}
                                    <Text strong>{awayTeamName}</Text>
                                  </div>
                                </div>
                                
                                {/* Informacion adicional */}
                                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                                  <Text type="secondary">
                                    {match.match_date
                                      ? formatDateTimeShort(formatForInputUTC(match.match_date))
                                      : 'Fecha por definir'}
                                    {match.stadium && ` • ${match.stadium}`}
                                    {match.round_name && ` • ${match.round_name}`}
                                  </Text>
                                  <div style={{ marginTop: 6 }}>
                                    <Tag
                                      color={
                                        String(match.status || '').toLowerCase().includes('finalizado')
                                          ? 'green'
                                          : String(match.status || '').toLowerCase().includes('aplazado')
                                            ? 'orange'
                                            : String(match.status || '').toLowerCase().includes('cancelado')
                                              ? 'red'
                                              : 'blue'
                                      }
                                    >
                                      {match.status || 'Programado'}
                                    </Tag>
                                  </div>
                                </div>
                              </Space>
                            </Card>
                          );
                        })}
                      </div>

                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Text type="secondary">No hay partidos recientes</Text>
                      </div>
                    )
                  )
                }
              ]}
            />
          </Card>
        </Col>

        {/* Panel lateral */}
        <Col xs={24} lg={8}>
          <Card title="Vista Previa">
            <TeamCard 
              team={team}
              showActions={false}
              compact={false}
            />
          </Card>

          <Card title="Información General" style={{ marginTop: '16px' }}>
            <Space orientation="vertical" size="large">
              <div>
                <Text strong>Última actualización:</Text>
                <div>
                  <Text type="secondary">
                    {team.updated_at
                      ? formatDateTimeShort(formatForInputUTC(team.updated_at))
                      : 'No disponible'}
                  </Text>
                </div>
              </div>
              
              <div>
                <Text strong>Fecha de creación:</Text>
                <div>
                  <Text type="secondary">
                    {team.created_at
                      ? formatDateTimeShort(formatForInputUTC(team.created_at))
                      : 'No disponible'}
                  </Text>
                </div>
              </div>
              
              {team.is_active === false && (
                <div>
                  <Text strong type="danger">Nota:</Text>
                  <div>
                    <Text type="secondary">
                      Este equipo está marcado como inactivo y no aparecerá 
                      en nuevas competencias.
                    </Text>
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeamDetail;


