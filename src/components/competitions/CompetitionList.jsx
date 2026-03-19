// frontend/src/components/competitions/CompetitionsList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { 
  Card, Table, Tag, Space, Button, Input, Select, 
  DatePicker, Row, Col, Modal, message, Avatar,
  Statistic, Badge, Progress, Typography, Divider, Tooltip, Segmented,
  Empty, Flex, Switch
} from 'antd';
import { 
  SearchOutlined, EyeOutlined, EditOutlined, 
  DeleteOutlined, PlusOutlined, CalendarOutlined,
  TrophyOutlined, TeamOutlined, FieldTimeOutlined,
  EnvironmentOutlined, FilterOutlined, ExportOutlined,
  CrownOutlined, FireOutlined, TableOutlined,
  AppstoreOutlined, LoadingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import competitionService from '../../services/competitionService';
import CompetitionCard from './CompetitionCard';
import './CompetitionList.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const CompetitionsList = () => {
  const [competitions, setCompetitions] = useState([]);
  const { canCreateCompetition } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 'card' o 'table'
  const [statsLoading, setStatsLoading] = useState(false);
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getLogoSrc = (logoUrl) => {
    if (!logoUrl) return undefined;
    return logoUrl.startsWith('http') ? logoUrl : `${apiBaseUrl}${logoUrl}`;
  };

  useEffect(() => {
    fetchCompetitions();
    fetchTeams();
  }, []);


  const fetchCompetitions = async (params = {}) => {
    setLoading(true);
    setStatsLoading(true);
    try {
      const response = await competitionService.getCompetitions({
        ...filters,
        ...params,
      });
      
      console.log('Competitions API Response:', response);
      const comps = response.data || [];
      
      const enrichedCompetitions = await enrichCompetitionsWithTeams(comps);
      const normalizedCompetitions = enrichedCompetitions.map((comp) => ({
        ...comp,
        status: competitionService.mapCompetitionStatus(comp.status)
      }));
      setCompetitions(normalizedCompetitions);
    } catch (error) {
      message.error('Error al cargar competencias');
      console.error('Error fetching competitions:', error);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await competitionService.getTeams({ limit: 100 });
      setTeams(response.data || []);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
    }
  };

  const enrichCompetitionsWithTeams = async (comps) => {
    try {
      return comps.map(competition => {
        if (competition.teams && competition.teams.length > 0) {
          return {
            ...competition,
            team_logos: competition.teams
              .filter(team => team.logo_url)
              .map(team => team.logo_url)
              .slice(0, 5)
          };
        }
        return competition;
      });
    } catch (error) {
      console.error('Error enriching competitions:', error);
      return comps;
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchCompetitions(newFilters);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchCompetitions({ search: value });
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      handleFilterChange('start_date', dates[0].toISOString());
      handleFilterChange('end_date', dates[1].toISOString());
    } else {
      const newFilters = { ...filters };
      delete newFilters.start_date;
      delete newFilters.end_date;
      setFilters(newFilters);
      fetchCompetitions(newFilters);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '¿Eliminar competencia?',
      content: 'Esta acción eliminará la competencia y todos los partidos asociados. ¿Estás seguro?',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      centered: true,
      maskClosable: true,
      onOk: async () => {
        try {
          await competitionService.deleteCompetition(id);
          message.success('Competencia eliminada exitosamente');
          fetchCompetitions();
        } catch (error) {
          message.error('Error al eliminar competencia');
        }
      },
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'En curso': 'green',
      'Programado': 'blue',
      'Finalizado': 'gray',
      'Cancelado': 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusConfig = (status) => {
    const configs = {
      'En curso': { color: '#52c41a', icon: <FireOutlined />, label: 'En Curso' },
      'Programado': { color: '#1890ff', icon: <CalendarOutlined />, label: 'Programado' },
      'Finalizado': { color: '#8c8c8c', icon: <TrophyOutlined />, label: 'Finalizado' },
      'Cancelado': { color: '#ff4d4f', icon: <DeleteOutlined />, label: 'Cancelado' }
    };
    return configs[status] || { color: '#d9d9d9', icon: null, label: status };
  };

  const getTypeColor = (type) => {
    const colors = {
      'league': 'blue',
      'cup': 'red',
      'league_cup': 'purple',
      'groups_playoff': 'orange'
    };
    return colors[type] || 'default';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'league': 'Liga',
      'cup': 'PTSa',
      'league_cup': 'Liga + PTSa',
      'groups_playoff': 'Grupos + Playoff'
    };
    return labels[type] || type;
  };

  const calculateProgress = (competition) => {
    if (competition.status === 'Finalizado') return 100;
    if (competition.status === 'Cancelado') return 0;
    if (competition.status === 'Programado') return 10;
    if (competition.status === 'En curso') return 50;
    return 0;
  };

  const stats = useMemo(() => {
    const total = competitions.length;
    const active = competitions.filter(c => c.status === 'En curso').length;
    const upcoming = competitions.filter(c => c.status === 'Programado').length;
    const completed = competitions.filter(c => c.status === 'Finalizado').length;
    const totalTeams = competitions.reduce((sum, comp) => sum + (comp.total_teams || 0), 0);
    
    return { total, active, upcoming, completed, totalTeams };
  }, [competitions]);

  const columns = [
    {
      title: 'COMPETENCIA',
      key: 'competition',
      width: 250,
      fixed: 'left',
      render: (_, comp) => (
        <Space align="start">
          <Badge 
            dot 
            color={getStatusColor(comp.status)}
            offset={[-5, 5]}
          >
            <Avatar 
              size={48}
              src={getLogoSrc(comp.logo_url)}
              icon={!comp.logo_url ? <TrophyOutlined /> : undefined}
              style={{ 
                backgroundColor: '#f0f5ff',
                color: '#1890ff',
                borderRadius: '12px'
              }}
            />
          </Badge>
          <Space orientation="vertical" size={2}>
            <Title level={5} style={{ margin: 0 }}>
              {comp.name}
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {comp.season}
            </Text>
            <Tag color={getTypeColor(comp.competition_type)}>
              {getTypeLabel(comp.competition_type)}
            </Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: 'EQUIPOS',
      key: 'teams',
      width: 150,
      render: (_, comp) => (
        <Space orientation="vertical" size={4}>
          <Tag 
            icon={<TeamOutlined />} 
            color="blue"
            style={{ margin: 0 }}
          >
            {comp.total_teams || 0}
          </Tag>
          {comp.team_logos?.length > 0 && (
            <Avatar.Group 
              maxCount={3}
              size="small"
              maxPopoverTrigger="click"
              maxStyle={{ 
                color: '#fff', 
                backgroundColor: '#1890ff',
                cursor: 'pointer'
              }}
            >
              {comp.team_logos.map((logo, index) => (
                <Tooltip key={index} title={`Equipo ${index + 1}`}>
                  <Avatar 
                    src={logo}
                    alt="Logo equipo"
                    style={{ border: '1px solid #f0f0f0' }}
                  />
                </Tooltip>
              ))}
            </Avatar.Group>
          )}
        </Space>
      ),
    },
    {
      title: 'ESTADO',
      key: 'status',
      width: 120,
      render: (status, comp) => {
        const config = getStatusConfig(comp.status);
        return (
          <Tag 
            color={config.color} 
            icon={config.icon}
            style={{ 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'PROGRESO',
      key: 'progress',
      width: 150,
      render: (_, comp) => (
        <Space orientation="vertical" size={2} style={{ width: '100%' }}>
          <Progress 
            percent={calculateProgress(comp)} 
            size="small" 
            strokeColor={getStatusColor(comp.status)}
            showInfo={false}
            style={{ margin: 0 }}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {calculateProgress(comp)}% completado
          </Text>
        </Space>
      ),
    },
    {
      title: 'FECHAS',
      key: 'dates',
      width: 180,
      render: (_, comp) => (
        <Space orientation="vertical" size={2}>
          <Text style={{ fontSize: '12px' }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            Inicio: {comp.start_date ? 
              new Date(comp.start_date).toLocaleDateString('es-ES') : 'N/A'
            }
          </Text>
          <Text style={{ fontSize: '12px' }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            Fin: {comp.end_date ? 
              new Date(comp.end_date).toLocaleDateString('es-ES') : 'N/A'
            }
          </Text>
        </Space>
      ),
    },
    {
      title: 'ACCIONES',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, comp) => {
        {
      const { canEdit: canEditAny, canDelete: canDeleteAny } = usePermissions();
      const canEdit = canEditAny() || comp.created_by === user?.id;
      const canDelete = canDeleteAny();
 
      return (
        <Space>
          <Tooltip title="Ver detalles">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/competitions/${comp.id}`)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
 
          {canEdit && (
            <Tooltip title="Editar">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => navigate(`/competitions/${comp.id}/edit`)}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
 
          {canDelete && (
            <Tooltip title="Eliminar">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(comp.id)}
              />
            </Tooltip>
          )}
        </Space>
      );
      }
    },
  },
];


  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Space orientation="vertical" size={8}>
          <Text type="secondary">
            {canCreateCompetition() 
              ? 'No hay competencias creadas' 
              : 'No hay competencias disponibles'}
          </Text>
          {canCreateCompetition() && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/competitions/new')}
              size="large"
            >
              Crear Primera Competencia
            </Button>
          )}
        </Space>
      }
      style={{ padding: '40px 0' }}
    />
  );

  const StatsCard = ({ title, value, icon, color, loading }) => (
    <Card 
      size="small" 
      hoverable
      style={{ 
        borderLeft: `4px solid ${color}`,
        borderRadius: '8px'
      }}
      styles={{ body: { padding: '16px' } }}
    >
      <Statistic
        title={title}
        value={value}
        prefix={icon}
        loading={loading}
        styles={{ 
          valueText: { color },
          content: { color }
        }}
      />
    </Card>
  );

  return (
    <div className={isDark ? 'competitions-container competitions-container--dark' : 'competitions-container'}>
      {/* Header */}
      <Flex justify="space-between" align="center" className="competitions-header">
        <Space orientation="vertical" size={2}>
          <Title level={2} style={{ margin: 0 }}>
            Competencias
          </Title>
          <Text type="secondary">
            Gestiona y sigue todas las competencias deportivas
          </Text>
        </Space>
        <Space size="small">
          <Text type="secondary">Vista oscura</Text>
          <Switch
            checked={isDark}
            onChange={(checked) => setMode(checked ? 'dark' : 'light')}
          />
        </Space>
        
        {canCreateCompetition() && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/competitions/new')}
            size="large"
          >
            Nueva Competencia
          </Button>
        )}
      </Flex>


      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }} className="competitions-stats">
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total Competencias"
            value={stats.total}
            icon={<TrophyOutlined />}
            color="#1890ff"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="En Curso"
            value={stats.active}
            icon={<FireOutlined />}
            color="#52c41a"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Programadas"
            value={stats.upcoming}
            icon={<CalendarOutlined />}
            color="#fa8c16"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Equipos Totales"
            value={stats.totalTeams}
            icon={<TeamOutlined />}
            color="#722ed1"
            loading={statsLoading}
          />
        </Col>
      </Row>

      {/* Filtros */}
      <Card 
        className="filters-card"
        style={{ marginBottom: 24 }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Space wrap>
              <Input
                placeholder="Buscar competencia..."
                prefix={<SearchOutlined />}
                onChange={e => handleSearch(e.target.value)}
                style={{ width: 250 }}
                allowClear
                size="large"
              />
              
              <Select
                className="competitions-filter-select"
                placeholder="Tipo"
                style={{ width: 150 }}
                onChange={value => handleFilterChange('competition_type', value)}
                allowClear
                size="large"
              >
                <Option value="league">Liga</Option>
                <Option value="cup">PTSa</Option>
                <Option value="league_cup">Liga + PTSa</Option>
                <Option value="groups_playoff">Grupos + Playoff</Option>
              </Select>
              
              <Select
                className="competitions-filter-select"
                placeholder="Estado"
                style={{ width: 150 }}
                onChange={value => handleFilterChange('status', value)}
                allowClear
                size="large"
              >
                <Option value="En curso">En curso</Option>
                <Option value="Programado">Programado</Option>
                <Option value="Finalizado">Finalizado</Option>
                <Option value="Cancelado">Cancelado</Option>
              </Select>
            </Space>
          </Col>
          
          <Col xs={24} md={12}>
            <Space style={{ float: 'right' }} wrap>
              <RangePicker 
                onChange={handleDateRangeChange}
                placeholder={['Fecha inicio', 'Fecha fin']}
                size="large"
                style={{ width: 250 }}
              />
              
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  {
                    label: (
                      <Tooltip title="Vista de tarjetas">
                        <AppstoreOutlined />
                      </Tooltip>
                    ),
                    value: 'card'
                  },
                  {
                    label: (
                      <Tooltip title="Vista de tabla">
                        <TableOutlined />
                      </Tooltip>
                    ),
                    value: 'table'
                  }
                ]}
                size="large"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Contenido principal */}
      {viewMode === 'card' ? (
        <Row gutter={[16, 16]}>
          {competitions.map(competition => (
            <Col key={competition.id} xs={24} sm={12} lg={8} xl={8}>
              <CompetitionCard 
                competition={competition}
                showActions={true}
                onDelete={handleDelete}
                loading={loading}
              />
            </Col>
          ))}
          
          {competitions.length === 0 && !loading && (
            <Col span={24}>
              <Card>
                {renderEmptyState()}
              </Card>
            </Col>
          )}
        </Row>
      ) : (
        <Card className="table-card">
          <Table
            columns={columns}
            dataSource={competitions}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} competencias`
            }}
            scroll={{ x: 1000 }}
            locale={{ emptyText: renderEmptyState() }}
            rowClassName={(record) => `competition-row ${record.status?.toLowerCase().replace(' ', '-')}`}
          />
        </Card>
      )}

      {/* Competencias en curso destacadas */}
      {competitions.filter(c => c.status === 'En curso').length > 0 && (
        <Card 
          className="featured-card"
          style={{ marginTop: 24 }}
          title={
            <Space>
              <FireOutlined style={{ color: '#ff4d4f' }} />
              <span>Competencias en Curso</span>
              <Badge 
                count={stats.active} 
                style={{ backgroundColor: '#ff4d4f' }}
              />
            </Space>
          }
          extra={
            <Button 
              type="link" 
              onClick={() => handleFilterChange('status', 'En curso')}
            >
              Ver todas
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {competitions
              .filter(c => c.status === 'En curso')
              .slice(0, 4)
              .map(competition => (
                <Col xs={24} sm={12} lg={6} key={competition.id}>
                  <CompetitionCard 
                    competition={competition}
                    showActions={false}
                    compact={true}
                  />
                </Col>
              ))}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default CompetitionsList;
