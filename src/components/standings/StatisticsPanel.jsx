import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Statistic, Table, Tag, Space, Progress, 
  Typography, Radio, Select, DatePicker, Tooltip, 
  Badge, Avatar, message 
} from 'antd';
import { 
  TrophyOutlined, TeamOutlined, FireOutlined, 
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined,
  StarOutlined, CrownOutlined, BulbOutlined,
  LineChartOutlined, BarChartOutlined, PieChartOutlined,
  CalendarOutlined, EnvironmentOutlined, UserOutlined 
} from '@ant-design/icons';
import competitionService from '../../services/competitionService';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const StatisticsPanel = ({ competitionId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('season');
  const [selectedMetric, setSelectedMetric] = useState('overall');

  useEffect(() => {
    if (competitionId) {
      fetchStatistics();
    }
  }, [competitionId, timeRange]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // Obtener competencia
      const competitionRes = await competitionService.getCompetition(competitionId);
      const competition = competitionRes.data;
      
      // Obtener equipos y partidos
      const teamsRes = await competitionService.getTeams();
      const teams = teamsRes.data;
      
      const matchesRes = await competitionService.getMatchesByCompetition(competitionId);
      const matches = matchesRes.data.matches || [];
      
      // Calcular estadísticas avanzadas
      const calculatedStats = calculateAdvancedStats(competition, teams, matches);
      setStats(calculatedStats);
    } catch (error) {
      message.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const calculateAdvancedStats = (competition, teams, matches) => {
    const totalTeams = teams.length;
    const finishedMatches = matches.filter(m => m.status === 'Finalizado');
    
    // Estadísticas de partidos
    const totalGoals = finishedMatches.reduce((sum, match) => 
      sum + (match.home_score || 0) + (match.away_score || 0), 0
    );
    
    const avgGoalsPerMatch = finishedMatches.length > 0 
      ? (totalGoals / finishedMatches.length).toFixed(2) 
      : 0;
    
    const homeWins = finishedMatches.filter(m => 
      (m.home_score || 0) > (m.away_score || 0)
    ).length;
    
    const draws = finishedMatches.filter(m => 
      (m.home_score || 0) === (m.away_score || 0)
    ).length;
    
    const awayWins = finishedMatches.filter(m => 
      (m.home_score || 0) < (m.away_score || 0)
    ).length;
    
    // Equipos con mejor ataque/defensa
    const offensiveTeams = [...teams]
      .sort((a, b) => (b.goals_for || 0) - (a.goals_for || 0))
      .slice(0, 3);
    
    const defensiveTeams = [...teams]
      .sort((a, b) => (a.goals_against || 0) - (b.goals_against || 0))
      .slice(0, 3);
    
    // Equipos con mejor rendimiento en casa/visita
    const homePerformance = teams.map(team => {
      const homeMatches = finishedMatches.filter(m => 
        m.home_team_id === team.id
      );
      
      const homeWins = homeMatches.filter(m => 
        (m.home_score || 0) > (m.away_score || 0)
      ).length;
      
      return {
        team: team.name,
        matches: homeMatches.length,
        wins: homeWins,
        percentage: homeMatches.length > 0 ? (homeWins / homeMatches.length * 100).toFixed(1) : 0
      };
    }).sort((a, b) => b.percentage - a.percentage).slice(0, 3);
    
    // Partidos con más goles
    const highScoringMatches = finishedMatches
      .map(match => ({
        ...match,
        totalGoals: (match.home_score || 0) + (match.away_score || 0)
      }))
      .sort((a, b) => b.totalGoals - a.totalGoals)
      .slice(0, 5);
    
    // Distribución de resultados
    const resultDistribution = {
      homeWins: Math.round((homeWins / finishedMatches.length) * 100) || 0,
      draws: Math.round((draws / finishedMatches.length) * 100) || 0,
      awayWins: Math.round((awayWins / finishedMatches.length) * 100) || 0,
    };
    
    return {
      basic: {
        totalTeams,
        totalMatches: matches.length,
        finishedMatches: finishedMatches.length,
        totalGoals,
        avgGoalsPerMatch,
        homeWinsPercentage: resultDistribution.homeWins,
        drawsPercentage: resultDistribution.draws,
        awayWinsPercentage: resultDistribution.awayWins,
      },
      offensiveTeams,
      defensiveTeams,
      homePerformance,
      highScoringMatches,
      resultDistribution,
    };
  };

  const renderBasicStats = () => {
    if (!stats) return null;

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card size="small" className="stats-card">
            <Statistic
              title="Equipos"
              value={stats.basic.totalTeams}
              prefix={<TeamOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" className="stats-card">
            <Statistic
              title="Partidos Jugados"
              value={stats.basic.finishedMatches}
              prefix={<CalendarOutlined />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" className="stats-card">
            <Statistic
              title="Promedio Goles"
              value={stats.basic.avgGoalsPerMatch}
              suffix="por partido"
              styles={{ content: { color: '#faad14' } }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderResultDistribution = () => {
    if (!stats) return null;

    return (
      <Card 
        title="Distribución de Resultados" 
        style={{ marginTop: 24 }}
        size="small"
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Space orientation="vertical" align="center" style={{ width: '100%' }}>
              <Progress
                type="circle"
                percent={stats.basic.homeWinsPercentage}
                strokeColor="#52c41a"
                format={percent => (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {percent}%
                    </div>
                    <Text type="secondary">Local</Text>
                  </div>
                )}
              />
              <Text strong>Victorias Local</Text>
            </Space>
          </Col>
          <Col span={8}>
            <Space orientation="vertical" align="center" style={{ width: '100%' }}>
              <Progress
                type="circle"
                percent={stats.basic.drawsPercentage}
                strokeColor="#1890ff"
                format={percent => (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {percent}%
                    </div>
                    <Text type="secondary">Empates</Text>
                  </div>
                )}
              />
              <Text strong>Empates</Text>
            </Space>
          </Col>
          <Col span={8}>
            <Space orientation="vertical" align="center" style={{ width: '100%' }}>
              <Progress
                type="circle"
                percent={stats.basic.awayWinsPercentage}
                strokeColor="#ff4d4f"
                format={percent => (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {percent}%
                    </div>
                    <Text type="secondary">Visitante</Text>
                  </div>
                )}
              />
              <Text strong>Victorias Visitante</Text>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderTeamStats = () => {
    if (!stats) return null;

    return (
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={8}>
          <Card 
            title={
              <Space>
                <FireOutlined />
                <span>Mejor Ataque</span>
              </Space>
            }
            size="small"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.offensiveTeams.map((team, index) => (
                <div
                  key={`${team.name}-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <Space>
                    <Badge count={index + 1} style={{ backgroundColor: index === 0 ? '#faad14' : '#1890ff' }} />
                    <Text strong>{team.name}</Text>
                  </Space>
                  <Space>
                    <Tag color="green">{team.goals_for || 0} GF</Tag>
                    <Progress 
                      percent={Math.min(((team.goals_for || 0) / 50) * 100, 100)} 
                      size="small" 
                      showInfo={false}
                      strokeColor="#52c41a"
                    />
                  </Space>
                </div>
              ))}
            </div>

          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card 
            title={
              <Space>
                <BulbOutlined />
                <span>Mejor Defensa</span>
              </Space>
            }
            size="small"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.defensiveTeams.map((team, index) => (
                <div
                  key={`${team.name}-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <Space>
                    <Badge count={index + 1} style={{ backgroundColor: index === 0 ? '#52c41a' : '#1890ff' }} />
                    <Text strong>{team.name}</Text>
                  </Space>
                  <Space>
                    <Tag color="red">{team.goals_against || 0} GC</Tag>
                    <Progress 
                      percent={Math.min(((team.goals_against || 0) / 50) * 100, 100)} 
                      size="small" 
                      showInfo={false}
                      strokeColor="#ff4d4f"
                      status="exception"
                    />
                  </Space>
                </div>
              ))}
            </div>

          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card 
            title={
              <Space>
                <HomeOutlined />
                <span>Mejor Local</span>
              </Space>
            }
            size="small"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.homePerformance.map((team, index) => (
                <div
                  key={`${team.team}-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <Space>
                    <Badge count={index + 1} style={{ backgroundColor: index === 0 ? '#722ed1' : '#1890ff' }} />
                    <Text strong>{team.team}</Text>
                  </Space>
                  <Space>
                    <Tag color="blue">{team.wins}/{team.matches}</Tag>
                    <Text strong>{team.percentage}%</Text>
                  </Space>
                </div>
              ))}
            </div>

          </Card>
        </Col>
      </Row>
    );
  };

  const renderHighScoringMatches = () => {
    if (!stats || !stats.highScoringMatches.length) return null;

    return (
      <Card 
        title={
          <Space>
            <StarOutlined />
            <span>Partidos con Más Goles</span>
          </Space>
        }
        style={{ marginTop: 24 }}
        size="small"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stats.highScoringMatches.map((match, index) => (
            <div
              key={match.id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <Badge 
                count={index + 1}
                style={{ 
                  backgroundColor: index === 0 ? '#faad14' : '#1890ff',
                  marginRight: 12 
                }}
              />
              <Space orientation="vertical" style={{ flex: 1 }}>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text strong>{match.home_team?.name || 'Equipo Local'}</Text>
                  <Space>
                    <Tag color="green" style={{ fontSize: '16px', padding: '4px 8px' }}>
                      {match.home_score || 0} - {match.away_score || 0}
                    </Tag>
                  </Space>
                  <Text strong>{match.away_team?.name || 'Equipo Visitante'}</Text>
                </Space>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text type="secondary">
                    {new Date(match.match_date).toLocaleDateString()}
                  </Text>
                  <Tag color="red">
                    <FireOutlined /> {match.totalGoals} goles
                  </Tag>
                  <Text type="secondary">{match.stadium}</Text>
                </Space>
              </Space>
            </div>
          ))}
        </div>

      </Card>
    );
  };

  const renderTrends = () => {
    if (!stats) return null;

    const trends = [
      { label: 'Victorias en Casa', value: stats.basic.homeWinsPercentage, trend: 'up' },
      { label: 'Empates', value: stats.basic.drawsPercentage, trend: 'stable' },
      { label: 'Victorias Visitante', value: stats.basic.awayWinsPercentage, trend: 'up' },
      { label: 'Promedio Goles', value: parseFloat(stats.basic.avgGoalsPerMatch), trend: 'up' },
    ];

    return (
      <Card 
        title="Tendencias" 
        style={{ marginTop: 24 }}
        size="small"
      >
        <Row gutter={[16, 16]}>
          {trends.map((trend, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card size="small" hoverable>
                <Space orientation="vertical" style={{ width: '100%' }}>
                  <Text type="secondary">{trend.label}</Text>
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Title level={3} style={{ margin: 0 }}>
                      {typeof trend.value === 'number' ? trend.value.toFixed(1) : trend.value}
                      {trend.label.includes('%') ? '%' : ''}
                    </Title>
                    {trend.trend === 'up' ? (
                      <ArrowUpOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                    ) : trend.trend === 'down' ? (
                      <ArrowDownOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
                    ) : (
                      <MinusOutlined style={{ color: '#faad14', fontSize: '20px' }} />
                    )}
                  </Space>
                  <Progress 
                    percent={typeof trend.value === 'number' ? trend.value : 0}
                    size="small"
                    strokeColor={
                      trend.trend === 'up' ? '#52c41a' : 
                      trend.trend === 'down' ? '#ff4d4f' : '#faad14'
                    }
                  />
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <LineChartOutlined />
            <span>Estadísticas Avanzadas</span>
          </Space>
        }
        loading={loading}
        extra={
          <Space>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 150 }}
            >
              <Option value="season">Temporada</Option>
              <Option value="month">Último Mes</Option>
              <Option value="week">Última Semana</Option>
              <Option value="custom">Personalizado</Option>
            </Select>
            
            {timeRange === 'custom' && (
              <RangePicker />
            )}
            
            <Select
              value={selectedMetric}
              onChange={setSelectedMetric}
              style={{ width: 150 }}
            >
              <Option value="overall">General</Option>
              <Option value="offensive">Ofensivas</Option>
              <Option value="defensive">Defensivas</Option>
              <Option value="home">Como Local</Option>
              <Option value="away">Como Visitante</Option>
            </Select>
          </Space>
        }
      >
        {renderBasicStats()}
        {renderResultDistribution()}
        {renderTeamStats()}
        {renderHighScoringMatches()}
        {renderTrends()}
      </Card>
    </div>
  );
};

export default StatisticsPanel;

