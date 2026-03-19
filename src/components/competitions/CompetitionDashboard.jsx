// frontend/src/components/competitions/CompetitionDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Tabs, Card, Row, Col, Space, Button, 
  Typography, Statistic, Tag, message, Switch 
} from 'antd';
import { 
  TrophyOutlined, TeamOutlined, CalendarOutlined, 
  TableOutlined, EyeOutlined, SettingOutlined,
  FireOutlined, CrownOutlined 
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import { useTheme } from '../../context/ThemeContext';
import './CompetitionDashboard.css';

// Importa los componentes
import CompetitionTeams from "./CompetitionTeams";
import CompetitionMatches from "./CompetitionMatches";
import CompetitionRounds from "./CompetitionRounds";
import CompetitionStandings from "./CompetitionStandings";
import CompetitionStats from "./CompetitionStats";

const { Title, Text } = Typography;

const CompetitionDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    total_matches: 0,
    matches_played: 0,
    goals_scored: 0,
    avg_goals_per_match: 0,
    total_rounds: 0,
    completed_rounds: 0
  });

  useEffect(() => {
    if (id) {
      fetchCompetitionData();
    }
  }, [id]);

  const fetchCompetitionData = async () => {
    setLoading(true);
    try {
      // Obtener datos de la competencia
      const compResponse = await competitionService.getCompetition(id);
      setCompetition(compResponse.data);

      // Obtener estadísticas
      try {
        const statsResponse = await competitionService.getStats(id);
        setStats(statsResponse.data || {});
      } catch (statsError) {
        console.warn('No se pudieron cargar estadísticas:', statsError);
        // Usar estadísticas por defecto
      }

    } catch (error) {
      console.error('Error al cargar la competencia:', error);
      message.error('Error al cargar la competencia');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    
    const statusUpper = String(status).toUpperCase();
    switch (statusUpper) {
      case 'ONGOING': return 'green';
      case 'SCHEDULED': return 'blue';
      case 'COMPLETED': return 'gray';
      case 'CANCELLED': return 'red';
      case 'DRAFT': return 'orange';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Desconocido';
    
    const statusUpper = String(status).toUpperCase();
    switch (statusUpper) {
      case 'ONGOING': return 'En Curso';
      case 'SCHEDULED': return 'Programado';
      case 'COMPLETED': return 'Finalizado';
      case 'CANCELLED': return 'Cancelado';
      case 'DRAFT': return 'Borrador';
      default: return status;
    }
  };

  const getCompetitionType = (type) => {
    if (!type) return 'Desconocido';
    
    const types = {
      'league': 'Liga',
      'cup': 'PTSa',
      'league_cup': 'Liga + PTSa',
      'groups_playoff': 'Grupos + Playoff',
    };
    return types[type] || type;
  };

  // Configuración de tabs con la nueva API
  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <EyeOutlined />
          Resumen
        </span>
      ),
      children: (
        <div className="competition-tab-content">
          <CompetitionStats competition={competition} stats={stats} />
        </div>
      )
    },
    {
      key: 'teams',
      label: (
        <span>
          <TeamOutlined />
          Equipos ({competition?.teams?.length || 0})
        </span>
      ),
      children: (
        <div className="competition-tab-content">
          <CompetitionTeams competitionId={id} teams={competition?.teams || []} />
        </div>
      )
    },
    {
      key: 'matches',
      label: (
        <span>
          <CalendarOutlined />
          Partidos
        </span>
      ),
      children: (
        <div className="competition-tab-content">
          <CompetitionMatches competitionId={id} competitionName={competition?.name} />
        </div>
      )
    },
    {
      key: 'standings',
      label: (
        <span>
          <TableOutlined />
          Tabla de Posiciones
        </span>
      ),
      children: (
        <div className="competition-tab-content">
          <CompetitionStandings competitionId={id} competitionType={competition?.competition_type} />
        </div>
      )
    },
    {
      key: 'rounds',
      label: (
        <span>
          <CalendarOutlined />
          Jornadas
        </span>
      ),
      children: (
        <div className="competition-tab-content">
          <CompetitionRounds competitionId={id} />
        </div>
      )
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Card>
          <Title level={4}>Cargando competencia...</Title>
          <Text type="secondary">Por favor espera...</Text>
        </Card>
      </div>
    );
  }

  if (!competition) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Title level={3}>Competencia no encontrada</Title>
          <Text>La competencia que buscas no existe o fue eliminada.</Text>
          <br />
          <Button 
            type="primary" 
            onClick={() => navigate('/competitions')}
            style={{ marginTop: '16px' }}
          >
            Volver a competencias
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={isDark ? 'competition-dashboard competition-dashboard--dark' : 'competition-dashboard'} style={{ padding: '24px' }}>
      {/* Header de la competencia */}
      <Card 
        className="competition-hero-card"
        style={{ 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <Space orientation="vertical" size="small">
              <Space>
                <TrophyOutlined style={{ fontSize: '32px' }} />
                <Title level={2} style={{ color: 'white', margin: 0 }}>
                  {competition.name}
                </Title>
              </Space>
              <Space size="middle">
                <Tag color={getStatusColor(competition.status)}>
                  {getStatusText(competition.status)}
                </Tag>
                <Tag color="blue">{getCompetitionType(competition.competition_type)}</Tag>
                <Tag color="geekblue">{competition.season}</Tag>
                <Space>
                  <TeamOutlined />
                  <Text style={{ color: 'white' }}>{competition.total_teams} equipos</Text>
                </Space>
              </Space>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                {competition.description || 'Sin descripción'}
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic
                  title="Partidos Jugados"
                  value={stats.matches_played || 0}
                  styles={{ content: { color: 'white' } }}
                  prefix={<FireOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Goles Totales"
                  value={stats.goals_scored || 0}
                  styles={{ content: { color: 'white' } }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Navegación principal con nueva API de Tabs */}
      <Card className="competition-tabs-card">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          tabBarExtraContent={(
            <Space size="small" className="competition-dashboard__toggle">
              <Text type="secondary">Vista oscura</Text>
              <Switch
                checked={isDark}
                onChange={(checked) => setMode(checked ? 'dark' : 'light')}
              />
            </Space>
          )}
          items={tabItems}
        />
      </Card>
    </div>
  );
};

export default CompetitionDashboard;
