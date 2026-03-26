// frontend/src/components/teams/TeamsList.jsx

import React, { useState, useEffect, useCallback } from 'react';

import { 

  Card, Table, Tag, Space, Button, Input, Row, Col, 

  Avatar, Modal, message, Statistic, Select, Grid 

} from 'antd';

import { 

  SearchOutlined, PlusOutlined, EditOutlined, 

  DeleteOutlined, EyeOutlined, TeamOutlined,

  TrophyOutlined, EnvironmentOutlined,

  GlobalOutlined, FilterOutlined 

} from '@ant-design/icons';

import { useNavigate } from 'react-router-dom';

import competitionService from '../../services/competitionService';

import { usePermissions } from '../../hooks/usePermissions';
import './TeamList.css';

const { Option } = Select;

const TeamsList = () => {

  const [teams, setTeams] = useState([]);

  const { canCreateTeam, canEdit, canDelete } = usePermissions();

  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');

  const [selectedCountry, setSelectedCountry] = useState('');

  const [availableCountries, setAvailableCountries] = useState([]);

  const navigate = useNavigate();

  const screens = Grid.useBreakpoint();

  const isMobile = !screens.md;

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const resolveLogoUrl = (url) => {

    if (!url) return null;

    if (url.startsWith('http')) return url;

    return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

  };

  // Función para extraer países únicos de los equipos

  const extractCountriesFromTeams = useCallback((teamsData) => {

    const countries = [...new Set(teamsData

      .filter(team => team.country && team.country.trim() !== '')

      .map(team => team.country.trim())

      .sort((a, b) => a.localeCompare(b)))];

    setAvailableCountries(countries);

  }, []);

  // Función principal para cargar equipos

  const fetchTeams = useCallback(async () => {

    setLoading(true);

    try {

      // Crear objeto de parámetros para el backend

      let params = {};

      // Solo agregar parámetros si tienen valor

      if (searchText && searchText.trim()) {

        params.search = searchText.trim();

      }

      if (selectedCountry) {

        params.country = selectedCountry;

      }

      console.log('Fetching teams with params:', params); 

      console.log('Current searchText:', searchText);

      console.log('Current selectedCountry:', selectedCountry);

      console.log('API endpoint:', competitionService.getTeams.toString?.());

      const response = await competitionService.getTeams(params);

      const teamsData = response.data || [];

      console.log('Teams loaded:', teamsData.length); 

      setTeams(teamsData);

      // Si no hay filtro de país, extraer todos los países disponibles

      if (!selectedCountry) {

        extractCountriesFromTeams(teamsData);

      }

  } catch (error) {

    console.error('Error completo al cargar equipos:', error);

    // LOG DETALLADO DEL ERROR 422

    if (error.response?.status === 422) {

      console.error('Errores de validación del servidor:', error.response.data);

      if (error.response.data?.detail) {

      console.error('Detalle del error:', error.response.data.detail);

      console.error('Primer elemento del detalle:', error.response.data.detail[0]);

    }

      console.error('URL solicitada:', error.config?.url);

      console.error('Parámetros enviados:', error.config?.params);

      console.error('Headers enviados:', error.config?.headers);

      console.error('URL completa:', error.config?.baseURL + error.config?.url);

      console.error('Método HTTP:', error.config?.method);

    }

    message.error('Error al cargar equipos');

    setTeams([]);

    setAvailableCountries([]);

  } finally {

    setLoading(false);

  }

}, [searchText, selectedCountry, extractCountriesFromTeams]);

  // Efecto inicial para cargar todos los equipos

  useEffect(() => {

    fetchTeams();

  }, [fetchTeams]);

  // Efecto para actualizar cuando cambia selectedCountry

  useEffect(() => {

    // Si se selecciona un país, actualizamos la lista de equipos

    // El fetchTeams ya se encarga con la dependencia selectedCountry

  }, [selectedCountry]);

  // Manejar búsqueda con debounce

  const handleSearch = (value) => {

    setSearchText(value);

  };

  // Manejar filtro por país

  const handleCountryFilter = (country) => {

    setSelectedCountry(country || '');

  };

  // Limpiar filtros

  const handleClearFilters = () => {

    setSearchText('');

    setSelectedCountry('');

  };

  // Refrescar cuando cambien los filtros (con debounce)

  useEffect(() => {

    const timeoutId = setTimeout(() => {

      fetchTeams();

    }, 500); // 500ms de debounce

    return () => clearTimeout(timeoutId);

  }, [searchText, selectedCountry, fetchTeams]);

  const handleDelete = async (id) => {

    Modal.confirm({

      title: '¿Eliminar equipo?',

      content: 'Esta acción no se puede deshacer.',

      okText: 'Eliminar',

      okType: 'danger',

      cancelText: 'Cancelar',

      onOk: async () => {

        try {

          await competitionService.deleteTeam(id);

          message.success('Equipo eliminado');

          fetchTeams();

        } catch (error) {

          message.error('Error al eliminar equipo');

        }

      },

    });

  };

  const getTeamStats = () => {

    // Filtrar equipos para estadísticas

    const filteredTeams = teams.filter(team => {

      // Aplicar filtros en frontend también para estadísticas precisas

      if (searchText && searchText.trim()) {

        const searchLower = searchText.toLowerCase().trim();

        if (!team.name.toLowerCase().includes(searchLower) && 

            !(team.short_name && team.short_name.toLowerCase().includes(searchLower)) &&

            !(team.city && team.city.toLowerCase().includes(searchLower))) {

          return false;

        }

      }

      if (selectedCountry && team.country !== selectedCountry) {

        return false;

      }

      return true;

    });

    const totalTeams = filteredTeams.length;

    const activeTeams = filteredTeams.filter(t => t.is_active).length;

    const totalPoints = filteredTeams.reduce((sum, team) => sum + (team.points || 0), 0);

    const totalGoals = filteredTeams.reduce((sum, team) => sum + (team.goals_for || 0), 0);

    const countriesCount = new Set(filteredTeams

      .filter(team => team.country)

      .map(team => team.country)).size;

    return { totalTeams, activeTeams, totalPoints, totalGoals, countriesCount };

  };

  const stats = getTeamStats();

  const columns = [

    {

      title: 'Equipo',

      key: 'team',

      render: (_, team) => (

        <Space>

          {team.logo_url ? (

            <Avatar src={resolveLogoUrl(team.logo_url)} size="large" />

          ) : (

            <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>

              {team.name.charAt(0)}

            </Avatar>

          )}

          <Space orientation="vertical" size={0}>

            <strong>{team.name}</strong>

            {team.short_name && (

              <small style={{ color: '#666' }}>{team.short_name}</small>

            )}

          </Space>

        </Space>

      ),

    },

    {

      title: 'Ubicación',

      key: 'location',

      render: (_, team) => (

        <Space orientation="vertical" size={0}>

          <Space>

            <EnvironmentOutlined />

            <span>{team.city || 'Sin ciudad'}</span>

          </Space>

          {team.country && (

            <Tag color="blue" icon={<GlobalOutlined />}>

              {team.country}

            </Tag>

          )}

          {team.stadium && (

            <small style={{ color: '#666' }}>{team.stadium}</small>

          )}

        </Space>

      ),

    },

    {

      title: 'Partidos',

      dataIndex: 'matches_played',

      responsive: ['md'],

      key: 'matches',

      render: (played) => (

        <Tag color="blue">{played || 0} partidos</Tag>

      ),

    },

    {

      title: 'Puntos',

      dataIndex: 'points',

      responsive: ['md'],

      key: 'points',

      render: (points) => (

        <Tag color="green">{points || 0} pts</Tag>

      ),

      sorter: (a, b) => (a.points || 0) - (b.points || 0),

    },

    {

      title: 'Goles',

      key: 'goals',

      responsive: ['md'],

      render: (_, team) => (

        <Space orientation="vertical" size={0}>

          <small>GF: {team.goals_for || 0}</small>

          <small>GC: {team.goals_against || 0}</small>

          <small>DG: {team.goal_difference || 0}</small>

        </Space>

      ),

    },

    {

      title: 'Estado',

      dataIndex: 'is_active',

      key: 'status',

      render: (active) => (

        <Tag color={active ? 'green' : 'red'}>

          {active ? 'Activo' : 'Inactivo'}

        </Tag>

      ),

    },

    {

      title: 'Acciones',

      key: 'actions',

      render: (_, team) => (

        <Space>

          <Button

            type="link"

            icon={<EyeOutlined />}

            onClick={() => navigate(`/teams/${team.id}`)}

          >

            Ver

          </Button>

          {canEdit(team.created_by) && ( // ← Solo mostrar editar si tiene permiso

            <Button

              type="link"

              icon={<EditOutlined />}

              onClick={() => navigate(`/teams/${team.id}/edit`)}

            >

              Editar

            </Button>

          )}

          {canDelete(team.created_by) && ( 

            <Button

              type="link"

              danger

              icon={<DeleteOutlined />}

              onClick={() => handleDelete(team.id)}

            >

              Eliminar

            </Button>

          )}

        </Space>

      ),

    },

  ];

  return (

    <div className="teams-page" style={{ padding: '24px' }}>

      <Row gutter={[16, 16]}>

        <Col span={24}>

          <Card>

            <Row gutter={16}>

              <Col xs={24} sm={4}>

                <Statistic

                  title="Total Equipos"

                  value={stats.totalTeams}

                  prefix={<TeamOutlined />}

                />

              </Col>

              <Col xs={24} sm={4}>

                <Statistic

                  title="Equipos Activos"

                  value={stats.activeTeams}

                  prefix={<TeamOutlined />}

                />

              </Col>

              <Col xs={24} sm={4}>

                <Statistic

                  title="Países"

                  value={stats.countriesCount}

                  prefix={<GlobalOutlined />}

                />

              </Col>

              <Col xs={24} sm={4}>

                <Statistic

                  title="Total Puntos"

                  value={stats.totalPoints}

                  prefix={<TrophyOutlined />}

                />

              </Col>

              <Col xs={24} sm={4}>

                <Statistic

                  title="Total Goles"

                  value={stats.totalGoals}

                />

              </Col>

              <Col xs={24} sm={4}>

                <Card

                  size="small"

                  className="teams-filter-card"

                  style={{ textAlign: 'center', background: '#fafafa' }}

                >

                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>

                    Filtro País

                  </div>

                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>

                    {selectedCountry || 'Todos'}

                  </div>

                  {selectedCountry && (

                    <small 

                      style={{ 

                        color: '#1890ff', 

                        cursor: 'pointer',

                        display: 'block',

                        marginTop: '4px'

                      }}

                      onClick={() => handleCountryFilter('')}

                    >

                      (click para limpiar)

                    </small>

                  )}

                </Card>

              </Col>

            </Row>

          </Card>

        </Col>

        <Col span={24}>

          <Card

            title={

              <Space>

                <TeamOutlined />

                <span>Equipos</span>

                {selectedCountry && (

                  <Tag 

                    color="blue" 

                    closable 

                    onClose={() => handleCountryFilter('')}

                  >

                    País: {selectedCountry}

                  </Tag>

                )}

                {searchText && (

                  <Tag 

                    color="green" 

                    closable 

                    onClose={() => setSearchText('')}

                  >

                    Buscando: {searchText}

                  </Tag>

                )}

              </Space>

            }

            extra={

              <Space>

                <Input

                  placeholder="Buscar equipo..."

                  prefix={<SearchOutlined />}

                  value={searchText}

                  onChange={e => handleSearch(e.target.value)}

                  style={{ width: isMobile ? '100%' : 200 }}

                  allowClear

                />

                <Select

                  placeholder="Filtrar por país"

                  style={{ width: isMobile ? '100%' : 200 }}

                  value={selectedCountry || undefined}

                  onChange={handleCountryFilter}

                  allowClear

                  showSearch

                  filterOption={(input, option) => {

                    if (!input) return true;

                    const country = option?.children?.toString() || option?.value?.toString() || '';

                    return country.toLowerCase().includes(input.toLowerCase());

                  }}

                  suffixIcon={<GlobalOutlined />}

                >

                  <Option value="">Todos los países</Option>

                  {availableCountries.map(country => (

                    <Option key={country} value={country}>

                      {country}

                    </Option>

                  ))}

                </Select>

                {(searchText || selectedCountry) && (

                  <Button

                    icon={<FilterOutlined />}

                    onClick={handleClearFilters}

                  >

                    Limpiar Filtros

                  </Button>

                )}

                {/* SOLO MOSTRAR BOTÓN NUEVO EQUIPO SI TIENE PERMISO */}

                {canCreateTeam && (

                  <Button

                    type="primary"

                    icon={<PlusOutlined />}

                    onClick={() => navigate('/teams/new')}

                    style={{

                      backgroundColor: '#0958d9',

                      borderColor: '#0958d9',

                      color: '#ffffff',

                      fontWeight: 600

                    }}

                  >

                    Nuevo Equipo

                  </Button>

                )}

              </Space>

            }

          >

            <Table

              size={isMobile ? 'small' : 'middle'}

              columns={columns}

              dataSource={teams}

              rowKey="id"

              loading={loading}

              pagination={{

                pageSize: 50,

                showSizeChanger: true,

                pageSizeOptions: ['10', '20', '50', '100'],

                showTotal: (total, range) => 

                  `${range[0]}-${range[1]} de ${total} equipos${

                    selectedCountry ? ` de ${selectedCountry}` : ''

                  }${

                    searchText ? ` (buscando: "${searchText}")` : ''

                  }`

              }}

              scroll={{ x: 1000 }}

              locale={{

                emptyText: (

                  <div style={{ textAlign: 'center', padding: '40px' }}>

                    {selectedCountry || searchText ? (

                      <>

                        <p style={{ fontSize: '16px', marginBottom: '16px' }}>

                          No hay equipos que coincidan con los filtros

                        </p>

                        <Button 

                          type="primary" 

                          onClick={handleClearFilters}

                        >

                          Limpiar filtros

                        </Button>

                      </>

                    ) : (

                      <>

                        <p style={{ fontSize: '16px', marginBottom: '16px' }}>

                          No hay equipos disponibles

                        </p>

                        {canCreateTeam && ( // ← Solo mostrar en empty si tiene permiso

                          <Button 

                            type="primary" 

                            icon={<PlusOutlined />}

                            onClick={() => navigate('/teams/new')}

                          >

                            Crear primer equipo

                          </Button>

                        )}

                      </>

                    )}

                  </div>

                )

              }}

            />

          </Card>

        </Col>

      </Row>

    </div>

  );

};

export default TeamsList;

