// frontend/src/components/standings/StandingsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Select, Tabs, Space, Typography, 
  Button, Statistic, Divider, Spin, Empty, Alert
} from 'antd';
import { 
  TrophyOutlined, TeamOutlined, BarChartOutlined,
  DownloadOutlined, FilterOutlined, EyeOutlined,
  CrownOutlined, ArrowUpOutlined, ArrowDownOutlined,
  GlobalOutlined, HistoryOutlined, LineChartOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import StandingsTable from './StandingsTable';
import StandingsChart from './StandingsChart';
import StatisticsPanel from './StatisticsPanel';
import './StandingsPage.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const StandingsPage = () => {
  const { competitionId } = useParams();
  const [competition, setCompetition] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('2026');
  const [activeTab, setActiveTab] = useState('table');
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMatches: 0,
    goalsScored: 0,
    avgGoals: 0,
    attendance: 0,
  });

  useEffect(() => {
    fetchCompetitions();
    if (competitionId) {
      fetchCompetition(competitionId);
    }
  }, [competitionId]);

  useEffect(() => {
    if (competition) {
      calculateStats();
    }
  }, [competition]);

  const fetchCompetitions = async () => {
    try {
      const response = await competitionService.getCompetitions({ limit: 50 });
      setCompetitions(response.data);
      
      // Si no hay competitionId seleccionado, usar la primera
      if (!competitionId && response.data.length > 0) {
        setCompetition(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
    }
  };

  const fetchCompetition = async (id) => {
    setLoading(true);
    try {
      const response = await competitionService.getCompetition(id);
      setCompetition(response.data);
    } catch (error) {
      console.error('Error fetching competition:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!competition) return;

    // Estadísticas simuladas - en producción vendrían del backend
    const totalTeams = competition.total_teams || 0;
    const totalMatches = totalTeams * (totalTeams - 1) / 2;
    const goalsScored = Math.floor(totalMatches * 2.8);
    const avgGoals = 2.8;
    const attendance = Math.floor(totalMatches * 15000);

    setStats({
      totalTeams,
      totalMatches,
      goalsScored,
      avgGoals,
      attendance,
    });
  };

  const handleCompetitionChange = (id) => {
    fetchCompetition(id);
  };

  const handleExportData = () => {
    // Lógica para exportar datos
    alert('Función de exportación en desarrollo');
  };

  const getCompetitionTypeName = (type) => {
    const types = {
      'league': 'Liga',
      'cup': 'PTSa',
      'league_cup': 'Liga + PTSa',
      'groups_playoff': 'Grupos + Playoff',
    };
    return types[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      'En curso': 'green',
      'Programado': 'blue',
      'Finalizado': 'gray',
      'Cancelado': 'red',
    };
    return colors[status] || 'default';
  };

  const seasons = ['2026', '2025', '2024', '2023'];
  const views = ['general', 'home', 'away'];

  if (loading && !competition) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: '20px' }}>Cargando clasificación...</Paragraph>
      </div>
    );
  }

  if (!competition) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span>
            No hay competencias disponibles
          </span>
        }
      >
        <Button type="primary" onClick={() => window.location.href = '/competitions/new'}>
          Crear primera competencia
        </Button>
      </Empty>
    );
  }

  return (
    <div className="standings-page">
      {/* Header */}
      <Card className="standings-header">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={12}>
            <Space orientation="vertical" size="small">
              <Space>
                <TrophyOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                <Title level={2} style={{ margin: 0 }}>
                  {competition.name}
                </Title>
              </Space>
              <Space size="middle">
                <Tag color={getStatusColor(competition.status)}>
                  {competition.status}
                </Tag>
                <Tag color="blue">{getCompetitionTypeName(competition.competition_type)}</Tag>
                <Tag color="geekblue">{competition.season}</Tag>
                <Space>
                  <TeamOutlined />
                  <Text>{competition.total_teams} equipos</Text>
                </Space>
              </Space>
              <Paragraph type="secondary" style={{ margin: 0 }}>
                {competition.description || 'Clasificación de la competencia'}
              </Paragraph>
            </Space>
          </Col>
          
          <Col xs={24} md={12}>
            <Row gutter={[16, 16]} justify="end">
              <Col>
                <Select
                  placeholder="Seleccionar competencia"
                  style={{ width: 250 }}
                  value={competition.id}
                  onChange={handleCompetitionChange}
                >
                  {competitions.map(comp => (
                    <Option key={comp.id} value={comp.id}>
                      <Space>
                        <TrophyOutlined />
                        <span>{comp.name} - {comp.season}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="Temporada"
                  style={{ width: 120 }}
                  value={selectedSeason}
                  onChange={setSelectedSeason}
                >
                  {seasons.map(season => (
                    <Option key={season} value={season}>
                      {season}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportData}
                >
                  Exportar
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Estadísticas rápidas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card className="stat-card" hoverable>
            <Statistic
              title="Total Equipos"
              value={stats.totalTeams}
              prefix={<TeamOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="stat-card" hoverable>
            <Statistic
              title="Partidos Totales"
              value={stats.totalMatches}
              prefix={<BarChartOutlined />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="stat-card" hoverable>
            <Statistic
              title="Goles Anotados"
              value={stats.goalsScored}
              suffix="goles"
              styles={{ content: { color: '#fa8c16' } }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Promedio: {stats.avgGoals} por partido
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="stat-card" hoverable>
            <Statistic
              title="Asistencia Total"
              value={stats.attendance.toLocaleString()}
              prefix={<TeamOutlined />}
              suffix="espectadores"
              styles={{ content: { color: '#722ed1' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs principales */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          items={[
            {
              key: 'table',
              label: (
                <Space>
                  <BarChartOutlined />
                  <span>Tabla de Posiciones</span>
                </Space>
              ),
            },
            {
              key: 'charts',
              label: (
                <Space>
                  <LineChartOutlined />
                  <span>Gráficos y Estadísticas</span>
                </Space>
              ),
            },
            {
              key: 'stats',
              label: (
                <Space>
                  <GlobalOutlined />
                  <span>Estadísticas Detalladas</span>
                </Space>
              ),
            },
            {
              key: 'history',
              label: (
                <Space>
                  <HistoryOutlined />
                  <span>Historial</span>
                </Space>
              ),
            },
          ]}
        />

        <div style={{ marginTop: 24 }}>
          {activeTab === 'table' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Text strong>Vista:</Text>
                  <Select defaultValue="general" style={{ width: 150 }}>
                    <Option value="general">General</Option>
                    <Option value="home">Como Local</Option>
                    <Option value="away">Como Visitante</Option>
                  </Select>
                  <Text strong>Fase:</Text>
                  <Select defaultValue="all" style={{ width: 150 }}>
                    <Option value="all">Todas</Option>
                    <Option value="regular">Fase Regular</Option>
                    <Option value="playoff">Playoff</Option>
                  </Select>
                </Space>
              </div>
              
              {competitionId ? (
                <StandingsTable competitionId={competitionId} />
              ) : (
                <Alert
                  title="Selecciona una competencia"
                  type="info"
                  showIcon
                />
              )}
            </>
          )}

          {activeTab === 'charts' && (
            <StandingsChart competitionId={competitionId} />
          )}

          {activeTab === 'stats' && (
            <StatisticsPanel competitionId={competitionId} />
          )}

          {activeTab === 'history' && (
            <Card>
              <Title level={4}>Historial de la Competencia</Title>
              <Paragraph>
                Aquí se mostrará el historial completo de la competencia, incluyendo:
              </Paragraph>
              <ul>
                <li>Campeones anteriores</li>
                <li>Récords históricos</li>
                <li>Evolución de la tabla</li>
                <li>Momentos destacados</li>
              </ul>
              <Empty description="Historial en desarrollo" />
            </Card>
          )}
        </div>
      </Card>

      {/* Información adicional */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Leyenda de Posiciones">
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <div className="legend-item">
                <div className="legend-color promotion"></div>
                <Text>Clasificación a Playoff/Internacional</Text>
              </div>
              <div className="legend-item">
                <div className="legend-color international"></div>
                <Text>Cupo Internacional</Text>
              </div>
              <div className="legend-item">
                <div className="legend-color playoff"></div>
                <Text>Zona de Playoff</Text>
              </div>
              <div className="legend-item">
                <div className="legend-color relegation"></div>
                <Text>Zona de Descenso</Text>
              </div>
              <Divider />
              <Space size="large">
                <Space>
                  <CrownOutlined style={{ color: '#faad14' }} />
                  <Text>Campeón</Text>
                </Space>
                <Space>
                  <ArrowUpOutlined style={{ color: '#52c41a' }} />
                  <Text>Ascenso</Text>
                </Space>
                <Space>
                  <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
                  <Text>Descenso</Text>
                </Space>
              </Space>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Próximos Partidos Clave">
            <Space orientation="vertical" style={{ width: '100%' }}>
              <div className="key-match">
                <Space>
                  <Text strong>Nacional vs. Millonarios</Text>
                  <Tag color="blue">Fecha 25</Tag>
                </Space>
                <Text type="secondary">15 Mar 2024 - 20:00</Text>
              </div>
              <div className="key-match">
                <Space>
                  <Text strong>América vs. Junior</Text>
                  <Tag color="blue">Fecha 26</Tag>
                </Space>
                <Text type="secondary">18 Mar 2024 - 18:00</Text>
              </div>
              <div className="key-match">
                <Space>
                  <Text strong>Medellín vs. Cali</Text>
                  <Tag color="blue">Fecha 27</Tag>
                </Space>
                <Text type="secondary">22 Mar 2024 - 19:30</Text>
              </div>
              <Button type="link" icon={<EyeOutlined />}>
                Ver calendario completo
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Notas */}
      <Alert
        type="info"
        title="Notas importantes"
        description={
          <ul>
            <li>Los puntos se calculan: Victoria = 3 pts, Empate = 1 pt, Derrota = 0 pts</li>
            <li>En caso de empate en puntos, se considera: 1. Diferencia de goles, 2. Goles a favor</li>
            <li>Los datos se actualizan automáticamente después de cada partido</li>
            <li>Para más detalles, consulta el reglamento de la competencia</li>
          </ul>
        }
        style={{ marginTop: 24 }}
        showIcon
      />
    </div>
  );
};

// Necesitamos importar Tag desde antd
const { Tag } = Typography;

export default StandingsPage;
