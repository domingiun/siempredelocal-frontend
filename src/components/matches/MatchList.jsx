// frontend/src/components/matches/MatchList.jsx - VERSIÓN ACTUALIZADA
import React, { useEffect, useState } from 'react';
import { 
  Row, Col, Card, Tabs, Spin, Empty, Tag, 
  Button, Space, Typography, Select, DatePicker,
  Input, Alert, Badge
} from 'antd';
import { 
  CalendarOutlined, FireOutlined, FilterOutlined,
  SearchOutlined, ReloadOutlined, TeamOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import MatchCard from './MatchCard';
import './MatchList.css';

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const MatchList = ({ 
  competitionId = null, 
  roundId = null,
  teamId = null,
  showFilters = true,
  limit = 12,
  title = "Partidos"
}) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    search: '',
    status: null,
    dateRange: null,
    competition: competitionId,
    team: teamId
  });
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    in_progress: 0,
    finished: 0
  });

  useEffect(() => {
    fetchMatches();
  }, [competitionId, roundId, teamId]);

  useEffect(() => {
    applyFilters();
  }, [matches, activeTab, filters]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 100, // Obtener más para filtrar
        competition_id: competitionId || undefined,
        round_id: roundId || undefined,
        team_id: teamId || undefined
      };

      const response = await competitionService.getMatches(params);
      const matchesData = response.data || [];
      setMatches(matchesData);
      
      // Calcular estadísticas
      calculateStats(matchesData);
      
    } catch (error) {
      console.error('Error cargando partidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (matchesList) => {
    const stats = {
      total: matchesList.length,
      scheduled: 0,
      in_progress: 0,
      finished: 0,
      postponed: 0,
      cancelled: 0
    };

    matchesList.forEach(match => {
      switch(match.status) {
        case 'scheduled':
          stats.scheduled++;
          break;
        case 'in_progress':
          stats.in_progress++;
          break;
        case 'finished':
          stats.finished++;
          break;
        case 'postponed':
          stats.postponed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
    });

    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...matches];

    // 1. Filtrar por tab activo
    switch (activeTab) {
      case 'live':
        filtered = filtered.filter(m => m.status === 'in_progress');
        break;
      case 'scheduled':
        filtered = filtered.filter(m => m.status === 'scheduled');
        break;
      case 'finished':
        filtered = filtered.filter(m => m.status === 'finished');
        break;
      case 'today':
        const today = new Date().toDateString();
        filtered = filtered.filter(m => {
          if (!m.match_date) return false;
          return new Date(m.match_date).toDateString() === today;
        });
        break;
      case 'upcoming':
        const now = new Date();
        filtered = filtered.filter(m => {
          if (!m.match_date) return false;
          return new Date(m.match_date) > now && m.status === 'scheduled';
        });
        break;
      // 'all' no filtra por status
    }

    // 2. Aplicar filtros adicionales
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(m => 
        (m.home_team?.name?.toLowerCase().includes(searchTerm)) ||
        (m.away_team?.name?.toLowerCase().includes(searchTerm)) ||
        (m.stadium?.toLowerCase().includes(searchTerm)) ||
        (m.city?.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.status) {
      filtered = filtered.filter(m => m.status === filters.status);
    }

    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = filters.dateRange[0].startOf('day');
      const endDate = filters.dateRange[1].endOf('day');
      
      filtered = filtered.filter(m => {
        if (!m.match_date) return false;
        const matchDate = new Date(m.match_date);
        return matchDate >= startDate && matchDate <= endDate;
      });
    }

    // Ordenar por fecha (más recientes primero para finalizados, más cercanos para programados)
    filtered.sort((a, b) => {
      if (!a.match_date || !b.match_date) return 0;
      
      const dateA = new Date(a.match_date);
      const dateB = new Date(b.match_date);
      
      if (a.status === 'finished' && b.status === 'finished') {
        return dateB - dateA; // Finalizados: más reciente primero
      } else if (a.status === 'scheduled' && b.status === 'scheduled') {
        return dateA - dateB; // Programados: más cercano primero
      } else if (a.status === 'finished') {
        return 1; // Finalizados después de programados
      } else if (b.status === 'finished') {
        return -1;
      }
      
      return dateA - dateB;
    });

    setFilteredMatches(filtered.slice(0, limit));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: null,
      dateRange: null,
      competition: competitionId,
      team: teamId
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      'scheduled': 'Programado',
      'in_progress': 'En Curso',
      'finished': 'Finalizado',
      'postponed': 'Aplazado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'in_progress': return 'red';
      case 'scheduled': return 'blue';
      case 'finished': return 'green';
      case 'postponed': return 'orange';
      case 'cancelled': return 'gray';
      default: return 'default';
    }
  };

  // Si no hay partidos y está cargando
  if (loading && matches.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <p>Cargando partidos...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="match-list-card"
      title={
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <CalendarOutlined />
              <Title level={4} style={{ margin: 0 }}>{title}</Title>
              {stats.total > 0 && (
                <Badge 
                  count={stats.total} 
                  style={{ backgroundColor: '#1890ff' }}
                />
              )}
            </Space>
          </Col>
          <Col>
            <Button 
              icon={<ReloadOutlined />} 
              className="btn-outline-primary"
              onClick={fetchMatches}
              loading={loading}
            >
              Actualizar
            </Button>
          </Col>
        </Row>
      }
      extra={
        showFilters && (
          <Button 
            type="default"
            className="btn-outline-primary"
            style={{ color: '#1890ff' }}
            onClick={() => navigate('/matches/new')}
          >
            Nuevo Partido
          </Button>
        )
      }
    >
      {/* Estadísticas rápidas */}
      {stats.total > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Tag color="blue">
              Total: <strong>{stats.total}</strong>
            </Tag>
            <Tag color="blue">
              Programados: <strong>{stats.scheduled}</strong>
            </Tag>
            {stats.in_progress > 0 && (
              <Tag color="red">
                <FireOutlined /> En curso: <strong>{stats.in_progress}</strong>
              </Tag>
            )}
            <Tag color="green">
              Finalizados: <strong>{stats.finished}</strong>
            </Tag>
            {stats.postponed > 0 && (
              <Tag color="orange">
                Aplazados: <strong>{stats.postponed}</strong>
              </Tag>
            )}
            {stats.cancelled > 0 && (
              <Tag color="gray">
                Cancelados: <strong>{stats.cancelled}</strong>
              </Tag>
            )}
          </Space>
        </div>
      )}

      {/* Filtros avanzados */}
      {showFilters && (
        <Card 
          size="small" 
          style={{ marginBottom: 16, background: '#fafafa' }}
          title={
            <Space>
              <FilterOutlined />
              <Text strong>Filtros</Text>
            </Space>
          }
          extra={
            <Button 
              size="small" 
              onClick={handleClearFilters}
              disabled={!filters.search && !filters.status && !filters.dateRange}
            >
              Limpiar
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Input
                placeholder="Buscar por equipo o estadio..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                allowClear
              />
            </Col>
            
            <Col xs={24} md={6}>
              <Select
                placeholder="Estado"
                style={{ width: '100%' }}
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                allowClear
              >
                <Option value="scheduled">Programado</Option>
                <Option value="in_progress">En curso</Option>
                <Option value="finished">Finalizado</Option>
                <Option value="postponed">Aplazado</Option>
                <Option value="cancelled">Cancelado</Option>
              </Select>
            </Col>
            
            <Col xs={24} md={10}>
              <RangePicker
                style={{ width: '100%' }}
                placeholder={['Fecha desde', 'Fecha hasta']}
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange('dateRange', dates)}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Tabs de navegación */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
      >
        <TabPane 
          tab={
            <Space>
              <span>Todos</span>
              {stats.total > 0 && <Badge count={stats.total} />}
            </Space>
          } 
          key="all" 
        />
        <TabPane 
          tab={
            <Space>
              <FireOutlined />
              <span>En Vivo</span>
              {stats.in_progress > 0 && (
                <Badge count={stats.in_progress} style={{ backgroundColor: '#ff4d4f' }} />
              )}
            </Space>
          } 
          key="live" 
        />
        <TabPane 
          tab={
            <Space>
              <CalendarOutlined />
              <span>Programados</span>
              {stats.scheduled > 0 && <Badge count={stats.scheduled} />}
            </Space>
          } 
          key="scheduled" 
        />
        <TabPane 
          tab={
            <Space>
              <TeamOutlined />
              <span>Finalizados</span>
              {stats.finished > 0 && <Badge count={stats.finished} />}
            </Space>
          } 
          key="finished" 
        />
        <TabPane tab="Hoy" key="today" />
        <TabPane tab="Próximos" key="upcoming" />
      </Tabs>

      {/* Contenido de partidos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
          <p>Cargando partidos...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <Empty
          description={
            <div>
              <p>No hay partidos {activeTab !== 'all' ? `con estado "${getStatusText(activeTab)}"` : ''}</p>
              {filters.search || filters.status || filters.dateRange ? (
                <Button onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <Button onClick={() => navigate('/matches/new')}>
                  Crear primer partido
                </Button>
              )}
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          {/* Contador de resultados */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Mostrando {filteredMatches.length} de {matches.length} partidos
            </Text>
          </div>

          {/* Grid de partidos */}
          <Row gutter={[16, 16]}>
            {filteredMatches.map(match => (
              <Col key={match.id} xs={24} sm={12} md={8} lg={6}>
                <MatchCard 
                  match={match} 
                  showActions={true}
                  onClick={() => navigate(`/matches/${match.id}`)}
                />
              </Col>
            ))}
          </Row>

          {/* Ver más si hay más resultados */}
          {filteredMatches.length < matches.length && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button onClick={() => navigate('/matches')}>
                Ver todos los partidos ({matches.length})
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default MatchList;

