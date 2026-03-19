// frontend/src/components/matches/MatchDetail.jsx 
import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Tag, Space, Button, Descriptions, 
  Typography, Avatar, Timeline, Statistic, Divider, 
  Modal, message, InputNumber, Alert, Image, Badge
} from 'antd';
import { 
  formatDateTime, 
  formatTimeOnly, 
  formatDateOnly,
  formatDateTable,
  formatDateTimeWithOffset
} from '../../utils/dateFormatter';
import { 
  CalendarOutlined, TeamOutlined, EnvironmentOutlined,
  EditOutlined, DeleteOutlined, TrophyOutlined,
  CheckCircleOutlined, ClockCircleOutlined, PlayCircleOutlined,
  ArrowLeftOutlined, SaveOutlined, PictureOutlined,
  TrophyFilled, FlagOutlined, UserOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import { usePermissions } from '../../hooks/usePermissions';

const { Title, Text, Paragraph } = Typography;

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingScore, setEditingScore] = useState(false);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const { isAdmin } = usePermissions();

  useEffect(() => {
    if (id) {
      console.log('MatchDetail: Loading match ID:', id);
      fetchMatch();
    }
  }, [id]);

  
  useEffect(() => {
    if (match && match.home_team_id && match.away_team_id && !teamsLoaded) {
      fetchTeamsInfo();
    }
  }, [match, teamsLoaded]);

  const fetchMatch = async () => {
    setLoading(true);
    try {
      console.log('Fetching match data...');
      const response = await competitionService.getMatch(id);
      console.log('Match data received:', response.data);
      setMatch(response.data);
      setHomeScore(response.data.home_score || 0);
      setAwayScore(response.data.away_score || 0);
      
      // Verificar si ya vienen los equipos en la respuesta
      if (response.data.home_team && response.data.away_team) {
        setHomeTeam(response.data.home_team);
        setAwayTeam(response.data.away_team);
        setTeamsLoaded(true);
      }
    } catch (error) {
      console.error('Full error in fetchMatch:', error);
      message.error('Error al cargar el partido');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamsInfo = async () => {
    if (!match) return;
    
    try {
      console.log('Fetching teams info...');
      
      // Intentar obtener información de los equipos
      const [homeResponse, awayResponse] = await Promise.allSettled([
        competitionService.getTeam(match.home_team_id),
        competitionService.getTeam(match.away_team_id)
      ]);
      
      if (homeResponse.status === 'fulfilled') {
        setHomeTeam(homeResponse.value.data);
        console.log('Home team loaded:', homeResponse.value.data);
      }
      
      if (awayResponse.status === 'fulfilled') {
        setAwayTeam(awayResponse.value.data);
        console.log('Away team loaded:', awayResponse.value.data);
      }
      
      setTeamsLoaded(true);
    } catch (error) {
      console.error('Error fetching teams info:', error);
    }
  };

  const handleDelete = () => {
    if (!isAdmin) {
      message.error('No tienes permisos para eliminar partidos');
      return;
    }
    Modal.confirm({
      title: '¿Eliminar partido?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await competitionService.deleteMatch(id);
          message.success('Partido eliminado');
          navigate('/matches');
        } catch (error) {
          message.error('Error al eliminar partido');
        }
      },
    });
  };

  const handleUpdateScore = async () => {
    if (!isAdmin) {
      message.error('No tienes permisos para actualizar marcador');
      return;
    }
    try {
      await competitionService.updateMatchScore(id, homeScore, awayScore);
      message.success('Marcador actualizado');
      setEditingScore(false);
      fetchMatch();
    } catch (error) {
      message.error('Error actualizando marcador');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Finalizado': return 'green';
      case 'En curso': return 'blue';
      case 'Programado': return 'orange';
      case 'Aplazado': return 'yellow';
      case 'Cancelado': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Finalizado': return <CheckCircleOutlined />;
      case 'En curso': return <PlayCircleOutlined />;
      case 'Programado': return <ClockCircleOutlined />;
      case 'Aplazado': return <ClockCircleOutlined />;
      case 'Cancelado': return <CheckCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  // Renderizar escudo del equipo con fallback
  const renderTeamLogo = (team, size = 80) => {
    const teamName = team?.name || 'Equipo';
    const initials = teamName.charAt(0).toUpperCase();
    
    if (team?.logo_url) {
      return (
        <div style={{ position: 'relative' }}>
          <Image
            width={size}
            height={size}
            src={team.logo_url}
            alt={teamName}
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #1890ff',
              backgroundColor: 'white'
            }}
            fallback={
              <Avatar 
                size={size} 
                icon={<TeamOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              >
                {initials}
              </Avatar>
            }
            preview={false}
          />
          {team?.country && (
            <Tag 
              color="blue" 
              style={{ 
                position: 'absolute', 
                bottom: -8, 
                left: '50%', 
                transform: 'translateX(-50%)',
                fontSize: '10px',
                padding: '2px 6px'
              }}
            >
              {team.country}
            </Tag>
          )}
        </div>
      );
    }
    
    return (
      <div style={{ position: 'relative' }}>
        <Avatar 
          size={size} 
          icon={<TeamOutlined />}
          style={{ 
            backgroundColor: '#1890ff',
            fontSize: size * 0.4,
            fontWeight: 'bold'
          }}
        >
          {initials}
        </Avatar>
      </div>
    );
  };

  // Obtener nombre del equipo con fallback
  const getTeamName = (team, fallback = 'Equipo') => {
    return team?.name || match?.[`${fallback.toLowerCase()}_team_name`] || fallback;
  };

  // Obtener estadio del equipo local como fallback
  const getStadiumInfo = () => {
    if (match?.stadium && match.stadium !== 'string') {
      return match.stadium;
    }
    
    if (homeTeam?.stadium) {
      return homeTeam.stadium;
    }
    
    return 'Estadio no definido';
  };

  // Obtener ciudad
  const getCityInfo = () => {
    if (match?.city && match.city !== 'string') {
      return match.city;
    }
    
    if (homeTeam?.city) {
      return homeTeam.city;
    }
    
    return 'Ciudad no definida';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={3}>Cargando partido...</Title>
        <Text type="secondary">Obteniendo información del partido y equipos</Text>
      </div>
    );
  }

  if (!match) {
    return (
      <Card style={{ margin: '24px' }}>
        <Title level={3}>Partido no encontrado</Title>
        <Paragraph>El partido que buscas no existe o fue eliminado.</Paragraph>
        <Button type="primary" onClick={() => navigate('/matches')}>
          Volver a partidos
        </Button>
      </Card>
    );
  }

  const homeTeamName = getTeamName(homeTeam, 'Local');
  const awayTeamName = getTeamName(awayTeam, 'Visitante');
  const stadium = getStadiumInfo();
  const city = getCityInfo();

  return (
    <div style={{ padding: '24px' }}>
      {/* Header con escudos */}
      <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Row gutter={[24, 24]} align="middle">
          {/* Equipo Local */}
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <Space orientation="vertical" size="middle">
              {renderTeamLogo(homeTeam, 100)}
              <div>
                <Title level={2} style={{ margin: 0 }}>{homeTeamName}</Title>
                {homeTeam?.short_name && (
                  <Text type="secondary" strong style={{ fontSize: '16px' }}>
                    ({homeTeam.short_name})
                  </Text>
                )}
                {homeTeam?.country && (
                  <div style={{ marginTop: 4 }}>
                    <FlagOutlined /> {homeTeam.country}
                  </div>
                )}
              </div>
            </Space>
          </Col>
          
          {/* Centro - Marcador y Estado */}
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
              {/* Estado */}
              <Badge.Ribbon 
               >
                <div style={{ padding: '8px 0' }}>
                  <Tag 
                    color={getStatusColor(match.status)} 
                    icon={getStatusIcon(match.status)}
                    style={{ fontSize: '16px', padding: '8px 16px' }}
                  >
                    {match.status}
                  </Tag>
                </div>
              </Badge.Ribbon>
              
              {/* Marcador */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '40px',
                padding: '20px 0'
              }}>
                {editingScore ? (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <InputNumber 
                        min={0} 
                        value={homeScore} 
                        onChange={setHomeScore}
                        size="large"
                        style={{ width: '100px', textAlign: 'center', fontSize: '32px' }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Local</Text>
                      </div>
                    </div>
                    
                    <Title level={1} style={{ margin: 0, fontSize: '48px' }}>:</Title>
                    
                    <div style={{ textAlign: 'center' }}>
                      <InputNumber 
                        min={0} 
                        value={awayScore} 
                        onChange={setAwayScore}
                        size="large"
                        style={{ width: '100px', textAlign: 'center', fontSize: '32px' }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Visitante</Text>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={1} style={{ margin: 0, fontSize: '72px', color: match.status === 'Finalizado' ? '#1890ff' : '#000' }}>
                        {match.home_score || 0}
                      </Title>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Local</Text>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <Title level={1} style={{ margin: 0, fontSize: '48px' }}>VS</Title>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          {formatDateTimeWithOffset(match.match_date, -5)}
                        </Text>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <Title level={1} style={{ margin: 0, fontSize: '72px', color: match.status === 'Finalizado' ? '#1890ff' : '#000' }}>
                        {match.away_score || 0}
                      </Title>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Visitante</Text>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Acciones de marcador */}
              {isAdmin && editingScore ? (
                <Space>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={handleUpdateScore}
                    size="large"
                  >
                    Guardar Marcador
                  </Button>
                  <Button 
                    onClick={() => setEditingScore(false)}
                    size="large"
                  >
                    Cancelar
                  </Button>
                </Space>
              ) : isAdmin && match.status === 'Programado' && (
                <Button 
                  onClick={() => setEditingScore(true)}
                  size="large"
                  icon={<EditOutlined />}
                >
                  Actualizar Marcador
                </Button>
              )}
            </Space>
          </Col>
          
          {/* Equipo Visitante */}
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <Space orientation="vertical" size="middle">
              {renderTeamLogo(awayTeam, 100)}
              <div>
                <Title level={2} style={{ margin: 0 }}>{awayTeamName}</Title>
                {awayTeam?.short_name && (
                  <Text type="secondary" strong style={{ fontSize: '16px' }}>
                    ({awayTeam.short_name})
                  </Text>
                )}
                {awayTeam?.country && (
                  <div style={{ marginTop: 4 }}>
                    <FlagOutlined /> {awayTeam.country}
                  </div>
                )}
              </div>
            </Space>
          </Col>
        </Row>
        
        <Divider />
        
        {/* Navegación */}
        <Row justify="space-between" align="middle">
          <Col>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/matches')}
              size="large"
            >
              Volver a Partidos
            </Button>
          </Col>
          {isAdmin ? (
            <Col>
              <Space>
                <Button 
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/matches/edit/${id}`)}
                  size="large"
                  type="primary"
                >
                  Editar Partido
                </Button>
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  size="large"
                >
                  Eliminar
                </Button>
              </Space>
            </Col>
          ) : null}
        </Row>
      </Card>

      {/* Detalles del partido */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <EnvironmentOutlined />
                <span>Información del Partido</span>
              </Space>
            }
          >
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Competencia">
                <Space>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  <Text strong style={{ fontSize: '16px' }}>
                    {match.competition?.name || 'Sin competencia'}
                  </Text>
                  {match.competition?.season && (
                    <Tag color="blue">{match.competition.season}</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="Estadio">
                <Space>
                  <PictureOutlined />
                  <Text strong style={{ fontSize: '16px' }}>{stadium}</Text>
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="Ubicación">
                <Space>
                  <FlagOutlined />
                  <Text>{city}</Text>
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="Fecha y Hora">
                <Space>
                  <CalendarOutlined />
                  <Text>{formatDateTimeWithOffset(match.match_date, -5)}</Text>
                </Space>
              </Descriptions.Item>
              
              {match.round && (
                <Descriptions.Item label="Jornada">
                  <Space>
                    <TrophyFilled />
                    <Text>{match.round.name} (Jornada {match.round.round_number})</Text>
                  </Space>
                </Descriptions.Item>
              )}
              
              {match.observations && (
                <Descriptions.Item label="Observaciones">
                  <Text type="secondary">{match.observations}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <TeamOutlined />
                <span>Estadísticas del Partido</span>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" hoverable>
                  <Statistic
                    title="Posesión"
                    value={match.status === 'Finalizado' ? '55%' : '-'}
                    prefix={<TeamOutlined />}
                    styles={{ value:{ color: '#1890ff' }}}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable>
                  <Statistic
                    title="Tiros al arco"
                    value={match.status === 'Finalizado' ? '12' : '-'}
                    prefix={<UserOutlined />}
                    styles={{ value:{ color: '#52c41a' }}}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable>
                  <Statistic
                    title="Faltas"
                    value={match.status === 'Finalizado' ? '18' : '-'}
                    prefix={<FlagOutlined />}
                    styles={{ value:{ color: '#fa8c16' }}}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" hoverable>
                  <Statistic
                    title="Tarjetas"
                    value={match.status === 'Finalizado' ? '3A / 1R' : '-'}
                    prefix={<CheckCircleOutlined />}
                    styles={{ value:{ color: '#f5222d' }}}
                  />
                </Card>
              </Col>
            </Row>
            
            {match.status !== 'Finalizado' && (
              <Alert
                title="Estadísticas no disponibles"
                description="Las estadísticas detalladas se mostrarán después de que el partido finalice."
                type="info"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Información adicional de equipos */}
      {(homeTeam || awayTeam) && (
        <Card 
          title="Información de Equipos" 
          style={{ marginTop: '16px' }}
        >
          <Row gutter={[16, 16]}>
            {homeTeam && (
              <Col xs={24} md={12}>
                <Card size="small" title={`${homeTeamName} - Local`}>
                  <Space orientation="vertical">
                    {homeTeam.founded_year && (
                      <Text><strong>Fundado:</strong> {homeTeam.founded_year}</Text>
                    )}
                    {homeTeam.coach && (
                      <Text><strong>Entrenador:</strong> {homeTeam.coach}</Text>
                    )}
                    {homeTeam.stadium && (
                      <Text><strong>Estadio propio:</strong> {homeTeam.stadium}</Text>
                    )}
                    {homeTeam.city && (
                      <Text><strong>Ciudad:</strong> {homeTeam.city}</Text>
                    )}
                  </Space>
                </Card>
              </Col>
            )}
            
            {awayTeam && (
              <Col xs={24} md={12}>
                <Card size="small" title={`${awayTeamName} - Visitante`}>
                  <Space orientation="vertical">
                    {awayTeam.founded_year && (
                      <Text><strong>Fundado:</strong> {awayTeam.founded_year}</Text>
                    )}
                    {awayTeam.coach && (
                      <Text><strong>Entrenador:</strong> {awayTeam.coach}</Text>
                    )}
                    {awayTeam.stadium && (
                      <Text><strong>Estadio propio:</strong> {awayTeam.stadium}</Text>
                    )}
                    {awayTeam.city && (
                      <Text><strong>Ciudad:</strong> {awayTeam.city}</Text>
                    )}
                  </Space>
                </Card>
              </Col>
            )}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default MatchDetail;

