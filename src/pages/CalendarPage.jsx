// frontend/src/pages/CalendarPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Spin, Row, Col, 
  Tag, Badge, Select, DatePicker, Space, Button, 
  Modal, Avatar, 
  Timeline, Empty, Tabs 
} from 'antd';
import { 
  CalendarOutlined, 
  FireOutlined, 
  TrophyOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  FieldTimeOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
  HomeOutlined,
  FlagOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import 'dayjs/locale/es';
import CompetitionService from '../services/competitionService'; 
import matchService from '../services/matchService';
import { formatDateTime, formatDateOnlyUTC, formatTimeOnlyUTC } from '../utils/dateFormatter';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CalendarPage = () => {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('calendar');
  const [todayMatches, setTodayMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
    loadTodayMatches();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar competencias directamente
      const compResponse = await api.get('/competitions/', {
        params: { 
          is_active: true,
          limit: 100 
        }
      });
      setCompetitions(compResponse.data || []);
      console.log('Estructura de competencias:', compResponse.data);
      
      // Cargar partidos del mes actual
      const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');
      const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD');
      
      const matchesResponse = await api.get('/matches/', {
        params: {
          date_from: startOfMonth,
          date_to: endOfMonth,
          limit: 100
        }
      });
      
      setMatches(matchesResponse.data || []);
      setFilteredMatches(matchesResponse.data || []);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayMatches = async () => {
    try {
      const response = await api.get('/matches/today/upcoming');
      if (response.data) {
        setTodayMatches(response.data.today || []);
        setUpcomingMatches(response.data.upcoming || []);
      }
    } catch (error) {
      console.error('Error cargando partidos de hoy:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...matches];

    if (selectedCompetition !== 'all') {
      // Convierte a número para comparar
      const compId = parseInt(selectedCompetition);
      filtered = filtered.filter(match => 
        match.competition_id === compId
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(match => 
        match.status === selectedStatus
      );
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(match => {
        const matchDate = dayjs(match.match_date);
        return matchDate.isAfter(dateRange[0].subtract(1, 'day')) && 
               matchDate.isBefore(dateRange[1].add(1, 'day'));
      });
    }

    setFilteredMatches(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedCompetition, selectedStatus, dateRange, matches]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'in_progress': return 'orange';
      case 'finished': return 'green';
      case 'postponed': return 'gray';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <ClockCircleOutlined />;
      case 'in_progress': return <PlayCircleOutlined />;
      case 'finished': return <CheckCircleOutlined />;
      case 'postponed': return <FieldTimeOutlined />;
      case 'cancelled': return <CloseCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return 'Programado';
      case 'in_progress': return 'En Juego';
      case 'finished': return 'Finalizado';
      case 'postponed': return 'Aplazado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handleMatchClick = (match) => {
    setSelectedMatch(match);
    setModalVisible(true);
  };

  const renderMatchCard = (match) => {
    const statusValue = String(match.status || '').toLowerCase();
    const isFinished = statusValue.includes('finalizado') || statusValue === 'finished';
    const isLive = statusValue.includes('en curso') || statusValue === 'in_progress';
    return (
      <Card 
        key={match.id}
        size="small"
        hoverable
        onClick={() => handleMatchClick(match)}
        style={{ marginBottom: '12px', cursor: 'pointer' }}
      >
        <div style={{ padding: '8px' }}>
          {/* Estado y competencia */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Tag 
              color={getStatusColor(match.status)} 
              icon={getStatusIcon(match.status)}
            >
              {getStatusText(match.status)}
            </Tag>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <TrophyOutlined /> {match.competition_name}
            </Text>
          </div>

          {/* Equipos y marcador */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '8px' 
          }}>
            <div style={{ flex: 1, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
              <Text strong>{match.home_team_name}</Text>
              {match.home_team_logo && (
                <Avatar size="small" src={match.home_team_logo} icon={<TeamOutlined />} />
              )}
            </div>
            
            <div style={{ padding: '0 16px', textAlign: 'center' }}>
              {isFinished || isLive ? (
                <Badge 
                  count={`${match.home_score} - ${match.away_score}`}
                  style={{ 
                    backgroundColor: getStatusColor(match.status),
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                />
              ) : (
                <Text type="secondary">vs</Text>
              )}
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {match.away_team_logo && (
                <Avatar size="small" src={match.away_team_logo} icon={<TeamOutlined />} />
              )}
              <Text strong>{match.away_team_name}</Text>
            </div>
          </div>

          {/* Fecha, hora y estadio */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CalendarOutlined style={{ fontSize: '12px' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {formatDateOnlyUTC(match.match_date)}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ClockCircleOutlined style={{ fontSize: '12px' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {formatTimeOnlyUTC(match.match_date)}
              </Text>
            </div>
          </div>

          {match.stadium && (
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
              <HomeOutlined /> {match.stadium}
              {match.city && `, ${match.city}`}
            </Text>
          )}

          {/* Jornada */}
          {match.round_name && (
            <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
              <FlagOutlined /> {match.round_name} (Jornada {match.round_number})
            </Text>
          )}
        </div>
      </Card>
    );
  };

  


  const renderCalendarView = () => {
    const matchesByDate = filteredMatches.reduce((acc, match) => {
      const date = formatDateOnlyUTC(match.match_date);
      if (!acc[date]) acc[date] = [];
      acc[date].push(match);
      return acc;
    }, {});

    const sortedDates = Object.keys(matchesByDate).sort((a, b) => 
      dayjs(a, 'DD/MM/YYYY').diff(dayjs(b, 'DD/MM/YYYY'))
    );

    if (sortedDates.length === 0) {
      return <Empty description="No hay partidos para mostrar" />;
    }

    return (
      <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
        {sortedDates.map(date => (
          <Card 
            key={date}
            size="small"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarOutlined />
                <Text strong>{date}</Text>
                <Badge count={matchesByDate[date].length} style={{ backgroundColor: '#1890ff' }} />
              </div>
            }
            style={{ marginBottom: '16px' }}
          >
            {matchesByDate[date].map(match => renderMatchCard(match))}
          </Card>
        ))}
      </div>
    );
  };


 

  const renderListView = () => {
    const sortedMatches = [...filteredMatches].sort((a, b) => 
      dayjs(a.match_date).diff(dayjs(b.match_date))
    );

    return (
      <>
        {sortedMatches.length === 0 ? (
          <Empty description="No hay partidos para mostrar" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortedMatches.map(match => (
              <div key={match.id}>{renderMatchCard(match)}</div>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderTimelineView = () => {
    const sortedMatches = [...filteredMatches].sort((a, b) => 
      dayjs(a.match_date).diff(dayjs(b.match_date))
    );

    return (
      <Timeline mode="left">
        {sortedMatches.map(match => (
          <Timeline.Item
            key={match.id}
            color={getStatusColor(match.status)}
            label={
              <div>
                <Text strong style={{ display: 'block' }}>{formatDateOnlyUTC(match.match_date)}</Text>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                  {formatTimeOnlyUTC(match.match_date)}
                </Text>
              </div>
            }
          >
            <div style={{ cursor: 'pointer', textAlign: 'left' }} onClick={() => handleMatchClick(match)}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {match.home_team_logo && (
                    <Avatar size="small" src={match.home_team_logo} icon={<TeamOutlined />} />
                  )}
                  <Text strong>{match.home_team_name}</Text>
                  {(String(match.status || '').toLowerCase().includes('finalizado') || String(match.status || '').toLowerCase() === 'finished' || String(match.status || '').toLowerCase().includes('en curso') || String(match.status || '').toLowerCase() === 'in_progress') ? (
                    <Badge 
                      count={`${match.home_score} - ${match.away_score}`}
                      style={{ 
                        backgroundColor: getStatusColor(match.status),
                        fontSize: '12px'
                      }}
                    />
                  ) : (
                    <Text type="secondary">vs</Text>
                  )}
                  <Text strong>{match.away_team_name}</Text>
                  {match.away_team_logo && (
                    <Avatar size="small" src={match.away_team_logo} icon={<TeamOutlined />} />
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  <TrophyOutlined /> {match.competition_name} • {match.stadium}
                </Text>
                <Tag 
                  color={getStatusColor(match.status)} 
                  icon={getStatusIcon(match.status)}
                  size="small"
                >
                  {getStatusText(match.status)}
                </Tag>
              </div>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  const tabItems = [
    {
      key: 'calendar',
      label: 'Vista Calendario',
      children: renderCalendarView()
    },
    {
      key: 'list',
      label: 'Vista Lista',
      children: renderListView()
    },
  
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Encabezado */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2}>
              <CalendarOutlined /> Calendario de Partidos
            </Title>
            <Paragraph type="secondary">
              Visualiza y gestiona todos los partidos del sistema
            </Paragraph>
          </div>
          <div>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadInitialData}
              loading={loading}
            >
              Actualizar
            </Button>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <Select
            placeholder="Todas las competencias"
            value={selectedCompetition}
            onChange={setSelectedCompetition}
            suffixIcon={<TrophyOutlined />}
          >
            <Option value="all">Todas las competencias</Option>
            {competitions.map(comp => (
              <Option key={comp.id} value={comp.id}>
                {comp.name}
              </Option>
            ))}
          </Select>
          
          <Select
            placeholder="Todos los estados"
            value={selectedStatus}
            onChange={setSelectedStatus}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">Todos los estados</Option>
            <Option value="Programado">Programado</Option>
            <Option value="En curso">En Juego</Option>
            <Option value="Finalizado">Finalizado</Option>
            <Option value="Aplazado">Aplazado</Option>
            <Option value="Cancelado">Cancelado</Option>
          </Select>
          
          <RangePicker
            placeholder={['Fecha inicio', 'Fecha fin']}
            format="DD/MM/YYYY"
            value={dateRange}
            onChange={setDateRange}
            style={{ width: '100%' }}
          />
          
          <Button
            type="default"
            icon={<FilterOutlined />}
            onClick={() => {
              setSelectedCompetition('all');
              setSelectedStatus('all');
              setDateRange(null);
            }}
          >
            Limpiar Filtros
          </Button>
        </div>
      </Card>

      {/* Estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Total Partidos</Text>
            <Title level={3} style={{ margin: '8px 0 0 0', color: '#1890ff' }}>
              {matches.length}
            </Title>
          </div>
        </Card>
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Mostrando</Text>
            <Title level={3} style={{ margin: '8px 0 0 0', color: '#52c41a' }}>
              {filteredMatches.length}
            </Title>
          </div>
        </Card>
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Partidos Hoy</Text>
            <Title level={3} style={{ margin: '8px 0 0 0', color: '#faad14' }}>
              {todayMatches.length}
            </Title>
          </div>
        </Card>
      </div>

      {/* Contenido principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tabs 
                  activeKey={viewMode} 
                  onChange={setViewMode}
                  items={tabItems}
                  type="card"
                />
                <Text type="secondary">
                  Mostrando {filteredMatches.length} partidos
                </Text>
              </div>
            }
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
              </div>
            ) : (
              <div>
                {viewMode === 'calendar' && renderCalendarView()}
                {viewMode === 'list' && renderListView()}
                {viewMode === 'timeline' && renderTimelineView()}
              </div>
            )}
          </Card>
        </div>

        {/* Panel lateral */}
        <div>
          <Card
            title={<><FireOutlined /> Partidos de Hoy</>}
            style={{ marginBottom: '16px' }}
          >
            {(todayMatches.length === 0 && upcomingMatches.length === 0) ? (
              <Empty description="No hay partidos programados para hoy" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {todayMatches.length > 0 && (
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                      <FireOutlined /> Hoy
                    </Text>
                    {todayMatches.map(match => renderMatchCard(match))}
                  </div>
                )}
                
                {upcomingMatches.length > 0 && (
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                      <ClockCircleOutlined /> Próximos
                    </Text>
                    {upcomingMatches.map(match => renderMatchCard(match))}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="Estados de Partidos">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button
                type={selectedStatus === 'scheduled' ? 'primary' : 'default'}
                icon={<ClockCircleOutlined />}
                onClick={() => setSelectedStatus('scheduled')}
                style={{ textAlign: 'left' }}
              >
                Programados ({matches.filter(m => m.status === 'scheduled').length})
              </Button>
              <Button
                type={selectedStatus === 'in_progress' ? 'primary' : 'default'}
                icon={<PlayCircleOutlined />}
                onClick={() => setSelectedStatus('in_progress')}
                style={{ textAlign: 'left' }}
              >
                En Juego ({matches.filter(m => m.status === 'in_progress').length})
              </Button>
              <Button
                type={selectedStatus === 'finished' ? 'primary' : 'default'}
                icon={<CheckCircleOutlined />}
                onClick={() => setSelectedStatus('finished')}
                style={{ textAlign: 'left' }}
              >
                Finalizados ({matches.filter(m => m.status === 'finished').length})
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de detalle */}
      <Modal
        title="Detalles del Partido"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedMatch && (
          <div>
            <Card size="small" style={{ marginBottom: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ marginBottom: '16px' }}>
                  {selectedMatch.home_team_name} vs {selectedMatch.away_team_name}
                </Title>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '24px',
                  marginBottom: '24px'
                }}>
                  {selectedMatch.home_team_logo && (
                    <Avatar size={64} src={selectedMatch.home_team_logo} />
                  )}
                  {((String(selectedMatch.status || '').toLowerCase().includes('finalizado') || String(selectedMatch.status || '').toLowerCase() === 'finished' || String(selectedMatch.status || '').toLowerCase().includes('en curso') || String(selectedMatch.status || '').toLowerCase() === 'in_progress')) ? (
                    <Badge
                      count={`${selectedMatch.home_score} - ${selectedMatch.away_score}`}
                      style={{
                        backgroundColor: getStatusColor(selectedMatch.status),
                        fontSize: '36px',
                        padding: '20px',
                        borderRadius: '8px'
                      }}
                    />
                  ) : (
                    <Text style={{ fontSize: '36px' }}>vs</Text>
                  )}
                  {selectedMatch.away_team_logo && (
                    <Avatar size={64} src={selectedMatch.away_team_logo} />
                  )}
                </div>

                <Tag 
                  color={getStatusColor(selectedMatch.status)} 
                  icon={getStatusIcon(selectedMatch.status)}
                  style={{ fontSize: '16px', padding: '8px 16px' }}
                >
                  {getStatusText(selectedMatch.status)}
                </Tag>
              </div>
            </Card>

            <Card title="Información del Partido" size="small">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Competencia:</Text>
                  <Text><TrophyOutlined /> {selectedMatch.competition_name}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Jornada:</Text>
                  <Text><FlagOutlined /> {selectedMatch.round_name || 'No especificada'}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Fecha y Hora:</Text>
                  <Text><CalendarOutlined /> {formatDateTime(selectedMatch.match_date)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Estadio:</Text>
                  <Text><HomeOutlined /> {selectedMatch.stadium || 'No especificado'}</Text>
                </div>
                {selectedMatch.city && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Ciudad:</Text>
                    <Text>{selectedMatch.city}</Text>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CalendarPage;

