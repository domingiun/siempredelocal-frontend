// frontend/src/components/teams/TeamsGrid.jsx
import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Input, Select, Button, Space, 
  Typography, Pagination, Empty, Spin 
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, AppstoreOutlined,
  UnorderedListOutlined, FilterOutlined, ReloadOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import TeamCard from './TeamCard';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const TeamsGrid = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalTeams, setTotalTeams] = useState(0);
  const [availableCountries, setAvailableCountries] = useState([]);

  useEffect(() => {
    fetchTeams();
  }, [page, pageSize]);

  useEffect(() => {
    // Debounce para búsqueda
    const timeoutId = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchTeams();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchText, selectedCountry]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
      };
      
      if (searchText) params.search = searchText;
      if (selectedCountry) params.country = selectedCountry;
      
      const response = await competitionService.getTeams(params);
      const teamsData = response.data || [];
      
      setTeams(teamsData);
      setTotalTeams(teamsData.length); // Nota: Necesitarías un endpoint con conteo total
      
      // Extraer países únicos
      const countries = [...new Set(teamsData
        .filter(team => team.country)
        .map(team => team.country)
        .sort())];
      setAvailableCountries(countries);
      
    } catch (error) {
      console.error('Error al cargar equipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleClearFilters = () => {
    setSearchText('');
    setSelectedCountry('');
    setPage(1);
  };

  const renderGrid = () => (
    <Row gutter={[16, 16]}>
      {teams.map(team => (
        <Col key={team.id} xs={24} sm={12} md={8} lg={6}>
          <TeamCard 
            team={team}
            showActions={true}
            showStats={true}
            compact={false}
          />
        </Col>
      ))}
    </Row>
  );

  const renderList = () => (
    <Row gutter={[0, 16]}>
      {teams.map(team => (
        <Col key={team.id} span={24}>
          <TeamCard 
            team={team}
            showActions={true}
            showStats={false}
            compact={true}
          />
        </Col>
      ))}
    </Row>
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Title level={3} style={{ margin: 0 }}>
              Equipos ({totalTeams})
            </Title>
            <Text type="secondary">
              Gestiona todos los equipos del sistema
            </Text>
          </Col>
          
          <Col xs={24} md={12}>
            <Space style={{ float: 'right' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchTeams}
                loading={loading}
              />
              
              <Button
                icon={viewMode === 'grid' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                title={`Cambiar a vista ${viewMode === 'grid' ? 'lista' : 'grid'}`}
              />
              
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
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filtros */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Search
              placeholder="Buscar equipos..."
              allowClear
              value={searchText}
              onChange={e => handleSearch(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
          </Col>
          
          <Col xs={24} md={8}>
            <Select
              placeholder="Filtrar por país"
              style={{ width: '100%' }}
              value={selectedCountry || undefined}
              onChange={setSelectedCountry}
              allowClear
              showSearch
            >
              {availableCountries.map(country => (
                <Option key={country} value={country}>
                  {country}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} md={8}>
            <Button
              icon={<FilterOutlined />}
              onClick={handleClearFilters}
              style={{ width: '100%' }}
              disabled={!searchText && !selectedCountry}
            >
              Limpiar Filtros
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Contenido */}
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>Cargando equipos...</Text>
            </div>
          </div>
        ) : teams.length > 0 ? (
          <>
            {viewMode === 'grid' ? renderGrid() : renderList()}
            
            {/* Paginación */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: '24px' 
            }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={totalTeams}
                onChange={(newPage, newPageSize) => {
                  setPage(newPage);
                  setPageSize(newPageSize);
                }}
                showSizeChanger
                showTotal={(total, range) => 
                  `${range[0]}-${range[1]} de ${total} equipos`
                }
                pageSizeOptions={['12', '24', '48', '96']}
              />
            </div>
          </>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text>No se encontraron equipos</Text>
                {searchText || selectedCountry ? (
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary">
                      Intenta con otros filtros o{' '}
                      <a onClick={handleClearFilters}>limpiar filtros</a>
                    </Text>
                  </div>
                ) : (
                  <div style={{ marginTop: '16px' }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => navigate('/teams/new')}
                    >
                      Crear primer equipo
                    </Button>
                  </div>
                )}
              </div>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default TeamsGrid;
