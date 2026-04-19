// frontend/src/pages/matches/MatchesPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select,
  DatePicker, Row, Col, Typography, Badge, message,
  Popconfirm, Tooltip, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined, CalendarOutlined,
  TeamOutlined, FilterOutlined, ReloadOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import competitionService from '../../services/competitionService';
import MatchCard from '../../components/matches/MatchCard';
import { formatDateTableUTC, formatForInputUTC } from '../../utils/dateFormatter';
import './MatchesPage.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const MatchesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateMatch, canEdit, canDelete, isAdmin } = usePermissions();
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({
    status: 'scheduled',
    search: '',
    dateRange: null,
    round: null,
    country:null
  });
  const [roundOptions, setRoundOptions] = useState([]);
  const [allRoundOptions, setAllRoundOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [viewMode, setViewMode] = useState('cards');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(100);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchMatches();
    fetchRounds();
  }, []);

  useEffect(() => {
    applyLocalFilters();
  }, [filters, matches]);

  useEffect(() => {
    fetchMatches(true);
  }, [filters.status, filters.round, filters.country, filters.dateRange]);

  useEffect(() => {
    const optionsByCountry = filters.country
      ? allRoundOptions.filter((opt) => opt.country === filters.country)
      : allRoundOptions;

    setRoundOptions(optionsByCountry);

    if (filters.round && !optionsByCountry.some((opt) => opt.value === filters.round)) {
      setFilters((prev) => ({ ...prev, round: null }));
    }
  }, [filters.country, allRoundOptions]);

  useEffect(() => {
    if (matches.length > 0) {
      console.log('🔍 Revisando campos del primer partido:', {
        id: matches[0].id,
        allKeys: Object.keys(matches[0]),
        home_team: matches[0].home_team,
        away_team: matches[0].away_team,
        // Buscar campos relacionados con país
        home_team_country: matches[0].home_team_country,
        away_team_country: matches[0].away_team_country,
        // Verificar si viene dentro del objeto team
        home_team_object: matches[0].home_team,
        away_team_object: matches[0].away_team
      });
    }
  }, [matches]);

  const fetchRounds = async () => {
    try {
      // Obtener jornadas de todas las competencias
      const allRounds = [];
      
      // Primero, obtener competencias
      const competitionsRes = await competitionService.getCompetitions({ limit: 10 });
      const competitions = competitionsRes.data || [];
      
      // Para cada competencia, obtener sus jornadas
      for (const comp of competitions) {
        try {
          const roundsRes = await competitionService.getRounds(comp.id, { limit: 50 });
          const roundsWithComp = roundsRes.data.map(round => ({
            ...round,
            competition_name: comp.name,
            competition_id: comp.id,
            competition_country: comp.country || null
          }));
          allRounds.push(...roundsWithComp);
        } catch (error) {
          console.warn(`No se pudieron obtener jornadas de competencia ${comp.id}:`, error);
        }
      }
      
      // Crear opciones para el select (de mayor a menor)
      const options = [...allRounds]
        .sort((a, b) => {
          const aNum = Number(a.round_number ?? 0);
          const bNum = Number(b.round_number ?? 0);
          if (bNum !== aNum) return bNum - aNum;
          return Number(b.id ?? 0) - Number(a.id ?? 0);
        })
        .map(round => ({
        value: round.id,
        label: `${round.name || `Jornada ${round.round_number}`} - ${round.competition_name || 'Sin competencia'}`,
        country: round.competition_country || round.country || null
      }));
      setAllRoundOptions(options);
      setRoundOptions(options);
      
    } catch (error) {
      console.error('Error fetching rounds:', error);
    }
  };

  const mapStatusToBackend = (status) => {
    const map = {
      scheduled: 'Programado',
      in_progress: 'En curso',
      finished: 'Finalizado',
      postponed: 'Aplazado',
      cancelled: 'Cancelado'
    };
    return map[status] || status;
  };

  const buildParams = (pageIndex = 0) => {
    const params = {
      limit: pageSize,
      skip: pageIndex * pageSize
    };

    if (filters.status) {
      params.status = mapStatusToBackend(filters.status);
    }
    if (filters.round) {
      params.round_id = filters.round;
    }
    if (filters.country) {
      params.country = filters.country;
    }
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      params.date_from = filters.dateRange[0].format('YYYY-MM-DD');
      params.date_to = filters.dateRange[1].format('YYYY-MM-DD');
    }

    return params;
  };

  const fetchMatches = async (reset = true) => {
    if (reset) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const pageIndex = reset ? 0 : page + 1;
      const params = buildParams(pageIndex);
      console.log('🔎 Obteniendo partidos con params:', params);

      const response = await competitionService.getMatches(params);
      const matchesData = response.data || [];

      const nextHasMore = matchesData.length === pageSize;
      setHasMore(nextHasMore);
      setPage(pageIndex);

      // Procesar partidos para nombres y logos
      const processedBatch = matchesData.map(match => ({
        ...match,
        home_team_name: match.home_team_name || `Equipo ${match.home_team_id}`,
        away_team_name: match.away_team_name || `Equipo ${match.away_team_id}`,
        home_team_logo: match.home_team_logo || null,
        away_team_logo: match.away_team_logo || null,
        round_name: match.round_name || (match.round_id ? `Jornada ${match.round_id}` : 'Sin jornada'),
        round_number: match.round_number || match.round_id,
        competition_name: match.competition_name || 'Sin competencia',
        // Aqu?? traemos los equipos completos si vienen en el backend
        home_team_object: match.home_team || null,
        away_team_object: match.away_team || null,
        // Pa??ses extra??dos de los equipos
        home_team_country: match.home_team_country || null,
        away_team_country: match.away_team_country || null,
        // A??adimos el owner_id si existe (para verificar permisos)
        created_by: match.created_by || null,
        owner_id: match.owner_id || match.created_by || null
      }));

      const nextMatches = reset ? processedBatch : [...matches, ...processedBatch];
      setMatches(nextMatches);
      setFilteredMatches(nextMatches);

      // Extraer pa??ses desde los equipos
      const countries = [...new Set(
        nextMatches.flatMap(m => [m.home_team_country, m.away_team_country]).filter(Boolean)
      )];

      console.log('???? Pa??ses detectados:', countries);

      setCountryOptions(
        countries.map(c => ({ label: c, value: c }))
      );

    } catch (error) {
      console.error('??? Error cargando partidos:', error);
      message.error('Error al cargar los partidos');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };


  const applyLocalFilters = () => {
    let filtered = [...matches];
    
    // 1. Filtrar por texto de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(match => 
        (match.home_team_name?.toLowerCase().includes(searchTerm)) ||
        (match.away_team_name?.toLowerCase().includes(searchTerm)) ||
        (match.stadium?.toLowerCase().includes(searchTerm)) ||
        (match.city?.toLowerCase().includes(searchTerm)) ||
        (match.round_name?.toLowerCase().includes(searchTerm)) ||
        (match.competition_name?.toLowerCase().includes(searchTerm))
      );
    }
    
    // 2. Filtrar por estado
    if (filters.status) {
      filtered = filtered.filter(match => {
        const matchStatus = match.status?.toLowerCase();
        const filterStatus = filters.status?.toLowerCase();
        
        const statusMap = {
          'scheduled': ['programado'],
          'in_progress': ['en curso', 'en_curso'],
          'finished': ['finalizado'],
          'postponed': ['aplazado'],
          'cancelled': ['cancelado']
        };
        
        if (statusMap[filterStatus]) {
          return statusMap[filterStatus].includes(matchStatus);
        }
        return matchStatus === filterStatus;
      });
    }
    
    // 3. Filtrar por jornada
    if (filters.round) {
      filtered = filtered.filter(match => match.round_id == filters.round);
    }
    // 3.5 Filtrar por país
    if (filters.country) {
      filtered = filtered.filter(m =>
        m.home_team_country === filters.country ||
        m.away_team_country === filters.country
      );
    }
    
    // 4. Filtrar por rango de fechas
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = filters.dateRange[0].startOf('day');
      const endDate = filters.dateRange[1].endOf('day');
      
      filtered = filtered.filter(match => {
        if (!match.match_date) return false;
        const matchDate = formatForInputUTC(match.match_date);
        if (!matchDate) return false;
        const time = matchDate.valueOf();
        return time >= startDate.valueOf() && time <= endDate.valueOf();
      });
    }
    
    // Ordenar por fecha
    filtered.sort((a, b) => {
      if (!a.match_date || !b.match_date) return 0;
      const aTime = formatForInputUTC(a.match_date)?.valueOf() ?? 0;
      const bTime = formatForInputUTC(b.match_date)?.valueOf() ?? 0;
      return aTime - bTime;
    });
    
    setFilteredMatches(filtered);
  };

  const handleDelete = async (id) => {
    try {
      // Verificar permisos (doble seguridad)
      if (!canDelete()) { // ← Solo admin puede eliminar
        message.error('No tiene permisos para eliminar partidos');
        return;
      }
      
      await competitionService.deleteMatch(id);
      message.success('Partido eliminado');
      fetchMatches();
    } catch (error) {
      message.error('Error al eliminar el partido');
    }
  };

  const getStatusColor = (status) => {
    if (!status) return '#6b7280';
    const s = String(status).toLowerCase();
    if (s.includes('finalizado') || s === 'finished')  return '#16a34a';
    if (s.includes('programado') || s === 'scheduled') return '#1677ff';
    if (s.includes('en curso')   || s === 'in_progress') return '#f59e0b';
    if (s.includes('aplazado')   || s === 'postponed') return '#7c3aed';
    if (s.includes('cancelado')  || s === 'cancelled') return '#dc2626';
    return '#6b7280';
  };

  const handleClearFilters = () => {
      setFilters({
        status: 'scheduled',
        search: '',
        dateRange: null,
        round: null,
        country:null
      });
    setFilteredMatches(matches);
  };

  const getRoundBadge = (match) => {
    if (!match.round_id) return null;
    
    return (
      <Tooltip title={match.round_name}>
        <Badge
          count={match.round_number || match.round_id}
          style={{ 
            backgroundColor: '#1890ff',
            cursor: 'pointer'
          }}
          onClick={() => setFilters({ ...filters, round: match.round_id })}
        />
      </Tooltip>
    );
  };

  const getScoreText = (match) => {
    const status = String(match.status).toLowerCase();
    if (status.includes('finalizado')) {
      return `${match.home_score || 0} - ${match.away_score || 0}`;
    }
    return '0 - 0';
  };

  const columns = [
    {
      title: 'Jornada',
      key: 'round',
      render: (_, match) => getRoundBadge(match),
      width: 70,
      align: 'center'
    },
    
    {
      title: 'Partido',
      align: 'center',
      key: 'match',
      render: (_, match) => {
        const score = getScoreText(match);
        const isFinished = String(match.status).toLowerCase().includes('finalizado');
        
        return (
          <Space size="middle" align="center">
            {/* Logo local */}
            {match.home_team_logo ? (
              <img
                src={match.home_team_logo}
                alt={match.home_team_name}
                style={{ width: 24, height: 24, borderRadius: '50%' }}
              />
            ) : (
              <TeamOutlined style={{ fontSize: 24 }} />
            )}
            <Text strong>{match.home_team_name}</Text>

            <Badge
              count={score}
              style={{ 
                backgroundColor: isFinished ? '#52c41a' : '#d9d9d9',
                color: isFinished ? 'white' : 'rgba(0, 0, 0, 0.65)'
              }}
            />

            <Text style={{ fontSize: '0.9em', color: '#999' }}>vs</Text>

            {/* Logo visitante */}
            {match.away_team_logo ? (
              <img
                src={match.away_team_logo}
                alt={match.away_team_name}
                style={{ width: 24, height: 24, borderRadius: '50%' }}
              />
            ) : (
              <TeamOutlined style={{ fontSize: 24 }} />
            )}
            <Text strong>{match.away_team_name}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Competencia',
      key: 'competition',
      render: (_, match) => (
        <Text type="secondary" style={{ fontSize: '0.85em' }}>
          {match.competition_name}
        </Text>
      ),
      width: 150,
    },
    {
      title: 'Fecha',
      dataIndex: 'match_date',
      key: 'match_date',
      render: (date) => date ? (
        <div>
          <div style={{ fontWeight: 'bold' }}>{formatDateTableUTC(date).date}</div>
          <div style={{ fontSize: '0.8em', color: '#666' }}>
            {formatDateTableUTC(date).time}
          </div>
        </div>
      ) : '-',
      width: 100,
    },
    {
      title: 'Estadio',
      dataIndex: 'stadium',
      key: 'stadium',
      render: (stadium) => (
        <Text style={{ fontSize: '0.9em' }} ellipsis>
          {stadium || 'Sin definir'}
        </Text>
      ),
      width: 120,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 700,
          color: '#fff',
          background: getStatusColor(status),
          lineHeight: '20px',
        }}>
          {status}
        </span>
      ),
      width: 120,
    },
    {
  title: 'Acciones',
  key: 'actions',
  width: 150,
  render: (_, match) => {
    return (
      <Space>
        {/* Ver detalles - TODOS pueden ver */}
        <Tooltip title="Ver detalles">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/matches/${match.id}`)}
          />
        </Tooltip>

        {/* Editar - Admin o dueño */}
        {isAdmin && canEdit(match.owner_id) && (
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/matches/${match.id}/edit`)}
            />
          </Tooltip>
        )}

        {/* Eliminar - SOLO ADMIN */}
        {isAdmin && canDelete() && ( // ← ¡Sin parámetros! Solo verifica si es admin
          <Popconfirm
            title="¿Eliminar partido?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleDelete(match.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        )}
      </Space>
    );
  },
},
  ];

  return (
    <div
      className={`matches-page${isAdmin ? '' : ' matches-page--limited'}`}
      style={{ padding: '24px' }}
    >
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              Partidos
            </Title>
            <Text type="secondary">
              {canCreateMatch 
                ? 'Gestiona todos los partidos del sistema' 
                : 'Consulta todos los partidos del sistema'}
            </Text>
          </Col>
          
          <Col>
            {isAdmin && (
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchMatches}
                  loading={loading}
                  className="matches-action-refresh"
                >
                  Actualizar
                </Button>
                {canCreateMatch && ( // Cambiado de isAdmin a canCreateMatch
                  <Button
                    type="default"
                    className="btn-outline-primary matches-action-create"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/matches/new')}
                  >
                    Nuevo Partido
                  </Button>
                )}
              </Space>
            )}
          </Col>
        </Row>

        {/* Filtros */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={6} className="matches-filter-search">
            <Input
              placeholder="Buscar equipo, estadio, jornada..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              allowClear
            />
          </Col>

          <Col xs={24} md={4}>
            <Select
              placeholder="Estado"
              style={{ width: '100%' }}
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="scheduled">Programado</Option>
              <Option value="in_progress">En curso</Option>
              <Option value="finished">Finalizado</Option>
              <Option value="postponed">Aplazado</Option>
              <Option value="cancelled">Cancelado</Option>
            </Select>
          </Col>
          
          <Col xs={24} md={5} className="matches-filter-round">
            <Select
              placeholder="Jornada"
              style={{ width: '100%' }}
              allowClear
              value={filters.round}
              onChange={(value) => setFilters({ ...filters, round: value })}
              options={roundOptions}
              showSearch
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
          
          {isAdmin && (
            <Col xs={24} md={7} className="matches-filter-date">
              <RangePicker
                style={{ width: '100%' }}
                placeholder={['Fecha desde', 'Fecha hasta']}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                value={filters.dateRange}
              />
            </Col>
          )}

          <Col xs={24} md={4}>
            <Select
              placeholder="País"
              style={{ width: '100%' }}
              allowClear
              value={filters.country}
              onChange={(value) => setFilters({ ...filters, country: value, round: null })}
              options={countryOptions}
              showSearch
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
          
          <Col xs={24} md={2} className="matches-filter-clear">
            <Button
              icon={<FilterOutlined />}
              onClick={handleClearFilters}
              block
              disabled={!filters.search && !filters.status && !filters.dateRange && !filters.round && !filters.country}
            >
              Limpiar
            </Button>
          </Col>
        </Row>

        {/* Contador de resultados */}
        <div style={{ marginBottom: 16 }} className="matches-results-counter">
          <Space>
            <Text>
              Mostrando <strong>{filteredMatches.length}</strong> de <strong>{matches.length}</strong> partidos cargados
            </Text>
            {(filters.search || filters.status || filters.dateRange || filters.round || filters.country) && (
              <Button size="small" onClick={handleClearFilters}>
                Mostrar todos
              </Button>
            )}
          </Space>
        </div>

        {/* Modo de visualización */}
        <div style={{ marginBottom: 16, textAlign: 'right' }} className="matches-view-toggle">
          <Space.Compact>
            <Button
              type="default"
              className={viewMode === 'cards' ? 'btn-outline-primary btn-outline-primary-active' : 'btn-outline-primary'}
              onClick={() => setViewMode('cards')}
            >
              Tarjetas ({filteredMatches.length})
            </Button>
            <Button
              type="default"
              className={viewMode === 'table' ? 'btn-outline-primary btn-outline-primary-active' : 'btn-outline-primary'}
              onClick={() => setViewMode('table')}
            >
              Tabla ({filteredMatches.length})
            </Button>
          </Space.Compact>
        </div>
      </Card>

      {/* Contenido */}
      {loading && matches.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Title level={4}>Cargando partidos...</Title>
            <Text type="secondary">Obteniendo datos del servidor</Text>
          </div>
        </Card>
      ) : filteredMatches.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <CalendarOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
            <Title level={4}>No hay partidos</Title>
            <Text type="secondary">
              {matches.length === 0 
                ? 'No se encontraron partidos en el sistema' 
                : 'No hay partidos que coincidan con los filtros'}
            </Text>
            {matches.length > 0 && (
              <Button onClick={handleClearFilters} style={{ marginTop: 16 }}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === 'cards' ? (
        <>
          <Row gutter={[16, 16]}>
            {filteredMatches.map(match => (
              <Col key={match.id} xs={24} sm={12} md={8} lg={6}>
                <MatchCard 
                  match={match} 
                  roundName={match.round_name}
                  showActions={isAdmin}
                />
              </Col>
            ))}
          </Row>
          {hasMore && !loading && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button onClick={() => fetchMatches(false)} loading={loadingMore}>
                Cargar más
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
        <Table
          columns={columns}
          dataSource={filteredMatches}
          rowKey="id"
          loading={loading && matches.length > 0}
          pagination={{ 
            pageSize: 50,
            pageSizeOptions: ['20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} partidos`
          }}
          scroll={{ x: 1200 }}
        />
        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={() => fetchMatches(false)} loading={loadingMore}>
              Cargar más
            </Button>
          </div>
        )}
      </Card>
      )}
    </div>
  );
};

export default MatchesPage;

