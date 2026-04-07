//frontend/src/components/rounds/RoundList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Space, Button, Input, Row, Col, 
  Progress, Statistic, Select, Avatar, Tooltip, message,
  Typography, Modal
} from 'antd';
import {
  SearchOutlined, CalendarOutlined, TeamOutlined,
  EyeOutlined, CheckCircleOutlined, ClockCircleOutlined,
  TrophyOutlined, ArrowRightOutlined, FilterOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import { useAuth } from '../../context/AuthContext';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

const RoundList = ({ competitionId: propCompetitionId, showAll = false }) => {
  const params = useParams();
  const competitionId = propCompetitionId || params.competitionId;
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [rounds, setRounds] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');

  useEffect(() => {
    if (showAll) {
      fetchAllRounds();
    } else if (competitionId) {
      fetchRounds();
      fetchCompetition();
    }
  }, [competitionId, showAll]);

  const fetchRounds = async (filters = {}) => {
    setLoading(true);
    try {
      const limit = 100;
      let skip = 0;
      let roundsData = [];

      while (true) {
        const response = await competitionService.getRounds(competitionId, { ...filters, limit, skip });
        const batch = response.data || [];
        roundsData = roundsData.concat(batch);
        if (batch.length < limit) break;
        skip += limit;
      }

      const sorted = roundsData.slice().sort((a, b) => {
        const aDate = a.end_date || a.start_date || null;
        const bDate = b.end_date || b.start_date || null;
        if (aDate && bDate) return new Date(bDate) - new Date(aDate);
        const aNum = Number(a.round_number ?? a.id ?? 0);
        const bNum = Number(b.round_number ?? b.id ?? 0);
        return bNum - aNum;
      });
      setRounds(sorted);
    } catch (error) {
      message.error('Error al cargar jornadas');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRounds = async () => {
    setLoading(true);
    try {
      const response = await competitionService.getAllRounds();
      const sorted = (response.data || []).slice().sort((a, b) => {
        const aDate = a.end_date || a.start_date || null;
        const bDate = b.end_date || b.start_date || null;
        if (aDate && bDate) return new Date(bDate) - new Date(aDate);
        const aNum = Number(a.round_number ?? a.id ?? 0);
        const bNum = Number(b.round_number ?? b.id ?? 0);
        return bNum - aNum;
      });
      setRounds(sorted);
    } catch (error) {
      console.error('Error fetching all rounds:', error);
      message.error('Error al cargar todas las jornadas');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetition = async () => {
    if (!competitionId) return;
    try {
      const response = await competitionService.getCompetition(competitionId);
      setCompetition(response.data);
    } catch (error) {
      console.error('Error fetching competition:', error);
    }
  };

  const handleDeleteRound = async (roundId, competitionId) => {
    Modal.confirm({
      title: '¿Eliminar jornada?',
      content: 'Esta acción no se puede deshacer. ¿Estás seguro?',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await competitionService.deleteRound(roundId);
          message.success('Jornada eliminada');
          if (showAll) {
            fetchAllRounds();
          } else {
            fetchRounds();
          }
        } catch (error) {
          message.error(error.response?.data?.detail || 'Error al eliminar jornada');
        }
      },
    });
  };

  const getRoundStats = () => {
    const totalRounds = rounds.length;
    const completedRounds = rounds.filter(r => r.is_completed).length;
    const ongoingRounds = rounds.filter(r => !r.is_completed).length;
    const completionRate = totalRounds > 0 ? (completedRounds / totalRounds) * 100 : 0;

    return { totalRounds, completedRounds, ongoingRounds, completionRate };
  };

  const stats = getRoundStats();

  const getRoundTypeColor = (type) => {
    const colors = {
      'regular': 'blue',
      'group_stage': 'green',
      'round_of': 'purple',
      'semifinal': 'orange',
      'final': 'gold',
      'third_place': 'cyan',
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'round_number',
      key: 'number',
      width: 60,
      sorter: (a, b) => a.round_number - b.round_number,
      render: (number) => (
        <div style={{ textAlign: 'center' }}>
          <Avatar 
            size="small" 
            style={{ 
              backgroundColor: '#1890ff',
              fontWeight: 'bold'
            }}
          >
            {number}
          </Avatar>
        </div>
      ),
    },
    {
      title: 'Jornada',
      key: 'name',
      render: (record) => (
        <Space orientation="vertical" size={0}>
          <strong>{record.name}</strong>
          <Space size="small">
            <CalendarOutlined />
            <Tag color={getRoundTypeColor(record.round_type)} size="small">
              {record.round_type}
            </Tag>
            {record.phase && (
              <Tag color="purple" size="small">
                {record.phase}
              </Tag>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Competencia',
      key: 'competition',
      render: (record) => (
        showAll ? (
          <Space orientation="vertical" size={0}>
            <Text strong>{record.competition_name || `Competencia ${record.competition_id}`}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {record.competition_id}
            </Text>
          </Space>
        ) : null
      ),
    },
    {
      title: 'Estado',
      key: 'status',
      width: 120,
      render: (record) => (
        <Tag color={record.is_completed ? 'green' : 'orange'} icon={record.is_completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>
          {record.is_completed ? 'Completada' : 'En progreso'}
        </Tag>
      ),
    },
    {
      title: 'Partidos',
      key: 'matches',
      render: (record) => (
        <Space>
          <Tag>{record.total_matches || 0} total</Tag>
          <Tag color="green">{record.matches_played || 0} jugados</Tag>
        </Space>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalles">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/competitions/${record.competition_id}/rounds/${record.id}`)}
            />
          </Tooltip>
          
          {isAdmin && (
            <>
              <Tooltip title="Editar">
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/rounds/edit/${record.id}`)}
                />
              </Tooltip>
              <Tooltip title="Eliminar">
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteRound(record.id, record.competition_id)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: showAll ? 0 : '24px' }}>
      {/* Header para vista de todas las jornadas */}
      {showAll && (
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Space orientation="vertical" size={0}>
                <Text strong style={{ fontSize: '20px' }}>
                  <TrophyOutlined style={{ marginRight: 8 }} />
                  Todas las Jornadas del Sistema
                </Text>
                <Text type="secondary">
                  Gestión completa de jornadas - {rounds.length} jornadas encontradas
                </Text>
              </Space>
            </Col>
            
            <Col xs={24} md={12}>
              <Row gutter={[8, 8]} justify="end">
                <Col xs={24} sm={12}>
                  <Search
                    placeholder="Buscar jornada o competencia..."
                    onSearch={(value) => {
                      // Implementar búsqueda
                      console.log('Search:', value);
                    }}
                    allowClear
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Select
                    placeholder="Estado"
                    style={{ width: '100%' }}
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value)}
                    suffixIcon={<FilterOutlined />}
                  >
                    <Option value="all">Todos</Option>
                    <Option value="completed">Completadas</Option>
                    <Option value="ongoing">En progreso</Option>
                  </Select>
                </Col>
                <Col xs={12} sm={6}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/rounds/new')}
                  >
                    Nueva
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      )}

      {/* Estadísticas para vista general */}
      {showAll && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Jornadas"
                value={stats.totalRounds}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Completadas"
                value={stats.completedRounds}
                prefix={<CheckCircleOutlined />}
                styles={{ content: { color: '#52c41a' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="En Progreso"
                value={stats.ongoingRounds}
                prefix={<ClockCircleOutlined />}
                styles={{ content: { color: '#1890ff' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Progreso General"
                value={stats.completionRate.toFixed(1)}
                suffix="%"
              />
              <Progress 
                percent={stats.completionRate} 
                size="small" 
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabla de jornadas */}
      <Card>
        <Table
          columns={columns}
          dataSource={rounds}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} jornadas`,
          }}
          rowClassName={(record) => 
            record.is_completed ? 'status-finished' : 'status-ongoing'
          }
        />
      </Card>
    </div>
  );
};

export default RoundList;
