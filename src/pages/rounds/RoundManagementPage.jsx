// frontend/src/pages/rounds/RoundManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, Card, Button, Space, Tag, Select, Input, 
  Row, Col, Typography, message, Modal 
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, EditOutlined, 
  DeleteOutlined, EyeOutlined, CalendarOutlined 
} from '@ant-design/icons';
import competitionService from '../../services/competitionService';
import './RoundManagementPage.css';

const { Title, Text } = Typography;
const { Option } = Select;

const RoundManagementPage = () => {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRounds();
  }, [filters]);

  const fetchRounds = async () => {
    setLoading(true);
    try {
      // Aquí necesitarías una API específica para obtener todas las rondas
      // Por ahora, obtenemos competencias y luego sus rondas
      const compsResponse = await competitionService.getCompetitions({ limit: 10 });
      let allRounds = [];
      
      for (const comp of compsResponse.data || []) {
        const roundsResponse = await competitionService.getRounds(comp.id, { limit: 100 });
        const roundsWithCompetition = (roundsResponse.data || []).map(round => ({
          ...round,
          competition_name: comp.name,
          competition_id: comp.id,
        }));
        allRounds = [...allRounds, ...roundsWithCompetition];
      }
      
      setRounds(allRounds);
    } catch (error) {
      message.error('Error al cargar jornadas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roundId, competitionId) => {
    Modal.confirm({
      title: '¿Eliminar jornada?',
      content: 'Esta acción eliminará la jornada y todos sus partidos. ¿Estás seguro?',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await competitionService.deleteRound(competitionId, roundId);
          message.success('Jornada eliminada exitosamente');
          fetchRounds();
        } catch (error) {
          message.error('Error al eliminar jornada');
        }
      },
    });
  };

  const getStatusTag = (isCompleted) => (
    <Tag color={isCompleted ? 'green' : 'blue'}>
      {isCompleted ? 'Completada' : 'Activa'}
    </Tag>
  );

  const filteredRounds = rounds.filter(round =>
    round.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    round.competition_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Jornada',
      dataIndex: 'name',
      key: 'name',
      render: (name, round) => (
        <Space>
          <CalendarOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Número',
      dataIndex: 'round_number',
      key: 'round_number',
      width: 100,
      align: 'center',
    },
      {
      title: 'Competencia', 
      dataIndex: 'competition_name',
      key: 'competition_name',
      render: (name, round) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/competitions/${round.competition_id}`)}
          style={{ padding: 0 }} 
        >
          {name} 
        </Button>
      ),
    },
    {
      title: 'Estado',
      key: 'status',
      width: 120,
      render: (_, round) => getStatusTag(round.is_completed),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 180,
      render: (_, round) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/competitions/${round.competition_id}/rounds/${round.id}`)}
            size="small"
          >
            Ver
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/rounds/edit/${round.id}`, { 
              state: { competitionId: round.competition_id } 
            })}
            size="small"
          >
            Editar
          </Button>

          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(round.id, round.competition_id)}
            size="small"
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="rounds-management-page" style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Title level={3} style={{ margin: 0 }}>
                <CalendarOutlined /> Gestión de Jornadas
              </Title>
            </Col>
            <Col xs={24} md={12}>
              <Space style={{ float: 'right' }} wrap>
                <Input
                  placeholder="Buscar jornada o competencia..."
                  prefix={<SearchOutlined />}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: 250 }}
                  allowClear
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/rounds/new')}
                  style={{
                    backgroundColor: '#0958d9',
                    borderColor: '#0958d9',
                    color: '#ffffff',
                    fontWeight: 600
                  }}
                >
                  Nueva Jornada
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredRounds}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <CalendarOutlined style={{ fontSize: '48px', color: '#999' }} />
                <p>No hay jornadas registradas</p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/rounds/new')}
                  style={{
                    backgroundColor: '#0958d9',
                    borderColor: '#0958d9',
                    color: '#ffffff',
                    fontWeight: 600
                  }}
                >
                  Crear primera jornada
                </Button>
              </div>
            )
          }}
        />
      </Card>
    </div>
  );
};

export default RoundManagementPage;
