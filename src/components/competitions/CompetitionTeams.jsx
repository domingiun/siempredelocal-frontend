// frontend/src/components/competitions/CompetitionTeams.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Table, Tag, Avatar, Space, 
  Button, Input, Modal, message, Typography, Alert 
} from 'antd';
import { 
  TeamOutlined, SearchOutlined, PlusOutlined, 
  DeleteOutlined, EyeOutlined, LockOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions'; // ← AÑADIR ESTA IMPORTACIÓN

const { Title, Text } = Typography;
const { Search } = Input;

const CompetitionTeams = ({ competitionId, initialTeams = [], teams: teamsProp = [] }) => {
  const seededTeams = initialTeams.length ? initialTeams : teamsProp;
  const [teams, setTeams] = useState(seededTeams);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { isAdmin } = usePermissions(); // ← USAR HOOK

  useEffect(() => {
    if (seededTeams.length) {
      setTeams(seededTeams);
      return;
    }
    fetchTeams();
  }, [competitionId, initialTeams, teamsProp]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await competitionService.getCompetition(competitionId);
      setTeams(response.data.teams || []);
    } catch (error) {
      message.error('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeam = (teamId) => {
    if (!isAdmin) {
      message.error('No tienes permisos para remover equipos');
      return;
    }

    Modal.confirm({
      title: '¿Remover equipo de la competencia?',
      content: 'El equipo ya no participará en esta competencia.',
      okText: 'Remover',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          // Aquí implementarías la API para remover equipo
          message.success('Equipo removido exitosamente');
          fetchTeams();
        } catch (error) {
          message.error('Error al remover equipo');
        }
      },
    });
  };

  const filteredTeams = teams.filter(team => {
    if (!searchText) return true;
    const query = searchText.toLowerCase();
    return (
      team.name?.toLowerCase().includes(query) ||
      team.country?.toLowerCase().includes(query) ||
      team.short_name?.toLowerCase().includes(query) ||
      team.city?.toLowerCase().includes(query)
    );
  });

  const columns = [
    {
      title: 'Equipo',
      key: 'team',
      render: (_, team) => (
        <Space>
          <Avatar 
            src={team.logo_url} 
            icon={<TeamOutlined />}
          >
            {team.name?.charAt(0)}
          </Avatar>
          <Space orientation="vertical" size={0}>
            <Text strong>{team.name}</Text>
            <Text type="secondary">{team.short_name}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Estadio',
      dataIndex: 'stadium',
      key: 'stadium',
      render: (stadium) => stadium || 'No especificado',
    },
    {
      title: 'País',
      dataIndex: 'country',
      key: 'country',
      render: (country) => country || 'No especificado',
    },
    {
      title: 'Ciudad',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 180,
      render: (_, team) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/teams/${team.id}`)}
            size="small"
          >
            Ver
          </Button>
          
          {/* Solo mostrar botón "Remover" si es admin */}
          {isAdmin ? (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveTeam(team.id)}
              size="small"
            >
              Remover
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Card className="competition-tab-card">
      <div style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Title level={4} style={{ margin: 0 }}>
              Equipos Participantes ({teams.length})
            </Title>
            {!isAdmin && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Modo solo lectura - Contacta con un administrador para cambios
              </Text>
            )}
          </Col>
          <Col xs={24} md={12}>
            <Space style={{ float: 'right' }}>
              <Search
                placeholder="Buscar equipo..."
                onSearch={setSearchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              
              {/* Botón "Agregar Equipos" solo visible para admins */}
              {isAdmin ? (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate(`/competitions/${competitionId}/add-teams`)}
                  style={{
                    backgroundColor: '#0958d9',
                    borderColor: '#0958d9',
                    color: '#ffffff',
                    fontWeight: 600
                  }}
                >
                  Agregar Equipos
                </Button>
              ) : (
                <Button
                  type="default"
                  icon={<LockOutlined />}
                  disabled
                  title="Solo administradores pueden agregar equipos"
                  style={{
                    backgroundColor: isDark ? '#0f1724' : '#f3f4f6',
                    borderColor: isDark ? '#1f2b3a' : '#d1d5db',
                    color: isDark ? '#6b7c93' : '#6b7280'
                  }}
                >
                  Agregar Equipos
                </Button>
              )}
            </Space>
          </Col>
        </Row>

      </div>

      <Table
        columns={columns}
        dataSource={filteredTeams}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `${total} equipos`
        }}
        locale={{
          emptyText: (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <TeamOutlined style={{ fontSize: '48px', color: isDark ? '#6b7c93' : '#999' }} />
              <p>No hay equipos en esta competencia</p>
              
              {/* Solo mostrar botón de agregar si es admin */}
              {isAdmin ? (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate(`/competitions/${competitionId}/add-teams`)}
                  style={{
                    backgroundColor: '#0958d9',
                    borderColor: '#0958d9',
                    color: '#ffffff',
                    fontWeight: 600
                  }}
                >
                  Agregar equipos
                </Button>
              ) : (
                <Alert
                  title="Competencia sin equipos"
                  description="Esta competencia aún no tiene equipos asignados. Contacta con un administrador para agregar equipos."
                  type="warning"
                  showIcon
                  style={{ marginTop: 16, maxWidth: 400, margin: '0 auto' }}
                />
              )}
            </div>
          )
        }}
      />
    </Card>
  );
};

export default CompetitionTeams;




