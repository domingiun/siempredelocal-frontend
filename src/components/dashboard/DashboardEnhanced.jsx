// frontend/src/components/dashboard/DashboardEnhanced.jsx
import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Statistic, Progress, Table, Tag, 
  Space, Button, Avatar, Timeline, Badge, Alert,
  Typography, Calendar, Modal, DatePicker, Grid
} from 'antd';
import { 
  TrophyOutlined, TeamOutlined, CalendarOutlined,
  FireOutlined, RiseOutlined, FallOutlined,
  DashboardOutlined, BarChartOutlined,
  PlayCircleOutlined, CheckCircleOutlined,
  ClockCircleOutlined, UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/es';
import dashboardService from '../../services/dashboardService';
import competitionService from '../../services/competitionService';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const DashboardEnhanced = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [activeCompetitions, setActiveCompetitions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [calendarDate, setCalendarDate] = useState(moment());
  const navigate = useNavigate();
  const screens = useBreakpoint();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Datos del dashboard
      const dashboardRes = await dashboardService.getSummary();
      setStats(dashboardRes.data);
      
      // Próximos partidos
      const matchesRes = await competitionService.getMatches({
        status: 'scheduled',
        start_date: moment().format('YYYY-MM-DD'),
        limit: 10
      });
      setUpcomingMatches(matchesRes.data || []);
      
      // Competencias activas
      const compRes = await competitionService.getCompetitions({
        status: ['ONGOING', 'SCHEDULED'],
        limit: 5
      });
      setActiveCompetitions(compRes.data || []);
      
      // Actividad reciente
      const activityRes = await dashboardService.getRecentActivity();
      setRecentActivity(activityRes.data || []);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompetitionStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'ongoing': return 'green';
      case 'scheduled': return 'blue';
      case 'completed': return 'default';
      case 'cancelled': return 'red';
      case 'draft': return 'orange';
      default: return 'default';
    }
  };

  const getMatchStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'in_progress': return 'red';
      case 'scheduled': return 'blue';
      case 'finished': return 'green';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const QuickStatsCard = ({ title, value, icon, color, suffix, onClick }) => (
    <Card 
      hoverable 
      onClick={onClick}
      style={{ 
        borderLeft: `4px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default'
      }}
      size="small"
    >
      <Space orientation="vertical" size="small">
        <Text type="secondary">{title}</Text>
        <Space align="center">
          {icon}
          <Statistic 
            value={value} 
            styles={{ value:{ fontSize: '24px', fontWeight: 'bold' }}}
            suffix={suffix}
          />
        </Space>
      </Space>
    </Card>
  );

  const MatchCardMini = ({ match }) => (
    <Card size="small" style={{ marginBottom: 8 }}>
      <Row align="middle" gutter={8}>
        <Col span={10}>
          <Space orientation="vertical" size={0} style={{ width: '100%' }}>
            <Text strong ellipsis>{match.home_team?.name || 'Local'}</Text>
            <Text type="secondary" style={{ fontSize: '10px' }}>
              {match.home_team?.city || ''}
            </Text>
          </Space>
        </Col>
        <Col span={4} style={{ textAlign: 'center' }}>
          <Badge 
            count={
              match.status === 'in_progress' ? 
              <FireOutlined spin /> : 
              `${match.home_score || 0}-${match.away_score || 0}`
            }
            style={{ backgroundColor: getMatchStatusColor(match.status) }}
          />
        </Col>
        <Col span={10} style={{ textAlign: 'right' }}>
          <Space orientation="vertical" size={0} align="end" style={{ width: '100%' }}>
            <Text strong ellipsis>{match.away_team?.name || 'Visitante'}</Text>
            <Text type="secondary" style={{ fontSize: '10px' }}>
              {match.away_team?.city || ''}
            </Text>
          </Space>
        </Col>
      </Row>
      <div style={{ marginTop: 8, fontSize: '11px', color: '#666', textAlign: 'center' }}>
        {moment(match.match_date).format('DD/MM HH:mm')} • {match.competition?.name}
      </div>
    </Card>
  );

  if (loading && !stats) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Title level={3}>Cargando dashboard...</Title>
        <Progress percent={30} status="active" />
      </div>
    );
  }

  return (
    <div style={{ padding: screens.xs ? 12 : 24 }}>
      {/* Header del Dashboard */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Space orientation="vertical">
            <Title level={2}>
              <DashboardOutlined /> Dashboard
            </Title>
            <Text type="secondary">
              Bienvenido al panel de control de SiempreDeLocal
            </Text>
          </Space>
        </Col>
      </Row>

      {/* Estadísticas rápidas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <QuickStatsCard
            title="Competiciones Activas"
            value={stats?.active_competitions || 0}
            icon={<TrophyOutlined style={{ color: '#1890ff' }} />}
            color="#1890ff"
            onClick={() => navigate('/competitions?status=active')}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <QuickStatsCard
            title="Equipos Registrados"
            value={stats?.total_teams || 0}
            icon={<TeamOutlined style={{ color: '#52c41a' }} />}
            color="#52c41a"
            onClick={() => navigate('/teams')}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <QuickStatsCard
            title="Partidos Hoy"
            value={stats?.today_matches || 0}
            icon={<CalendarOutlined style={{ color: '#fa8c16' }} />}
            color="#fa8c16"
            onClick={() => navigate('/matches/today')}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <QuickStatsCard
            title="Tasa de Finalización"
            value={stats?.completion_rate || 0}
            icon={<BarChartOutlined style={{ color: '#722ed1' }} />}
            color="#722ed1"
            suffix="%"
          />
        </Col>
      </Row>

      {/* Contenido principal */}
      <Row gutter={[16, 16]}>
        {/* Próximos partidos */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <TrophyOutlined />
                <span>Competiciones Activas</span>
              </Space>
            }
            extra={
              <Button 
                type="link" 
                size="small"
                onClick={() => navigate('/competitions')}
              >
                Ver todas
              </Button>
            }
          >
            {activeCompetitions.length === 0 ? (
              <Alert
                title="No hay competencias activas"
                description="Crea o programa una competencia para comenzar."
                type="info"
                showIcon
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeCompetitions.map(competition => (
                  <div
                    key={competition.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      border: '1px solid #f0f0f0',
                      borderRadius: 8
                    }}
                  >
                    <Space>
                      <Avatar 
                        icon={<TrophyOutlined />}
                        style={{ 
                          backgroundColor: getCompetitionStatusColor(competition.status)
                        }}
                      />
                      <div>
                        <Space>
                          <Text strong>{competition.name}</Text>
                          <Tag color={getCompetitionStatusColor(competition.status)}>
                            {competition.status}
                          </Tag>
                        </Space>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                          {competition.season} ? {competition.teams_count || 0} equipos
                        </Text>
                      </div>
                    </Space>
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => navigate(`/competitions/${competition.id}`)}
                    >
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* Actividad reciente */}
        <Col xs={24} lg={12}>
          <Card title="Actividad Reciente">
            <Timeline>
              {recentActivity.slice(0, 5).map((activity, index) => (
                <Timeline.Item
                  key={index}
                  color={
                    activity.type === 'creation' ? 'green' :
                    activity.type === 'update' ? 'blue' :
                    activity.type === 'deletion' ? 'red' : 'gray'
                  }
                  dot={
                    activity.type === 'creation' ? <CheckCircleOutlined /> :
                    activity.type === 'update' ? <ClockCircleOutlined /> :
                    <PlayCircleOutlined />
                  }
                >
                  <Space orientation="vertical" size={0}>
                    <Text strong>{activity.action}</Text>
                    <Text type="secondary">{activity.details}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {moment(activity.timestamp).fromNow()}
                    </Text>
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* Calendario mini */}
        <Col xs={24} lg={12}>
          <Card 
            title="Calendario"
            extra={
              <DatePicker
                picker="month"
                value={calendarDate}
                onChange={setCalendarDate}
                size="small"
              />
            }
          >
            <Calendar
              fullscreen={false}
              value={calendarDate}
              onSelect={date => {
                navigate(`/matches?date=${date.format('YYYY-MM-DD')}`);
              }}
              dateCellRender={date => {
                const dayMatches = upcomingMatches.filter(match =>
                  moment(match.match_date).isSame(date, 'day')
                );
                return dayMatches.length > 0 ? (
                  <div style={{ fontSize: '10px' }}>
                    <Badge count={dayMatches.length} size="small" />
                  </div>
                ) : null;
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Estadísticas adicionales */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Estadísticas del Sistema">
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Statistic
                  title="Partidos Programados"
                  value={stats?.scheduled_matches || 0}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Partidos en Curso"
                  value={stats?.in_progress_matches || 0}
                  prefix={<FireOutlined />}
                  styles={{ value:{ color: '#cf1322' }}}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Partidos Finalizados"
                  value={stats?.finished_matches || 0}
                  prefix={<CheckCircleOutlined />}
                  styles={{ value:{ color: '#3f8600' }}}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Usuarios Activos"
                  value={stats?.active_users || 0}
                  prefix={<UserOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardEnhanced;

