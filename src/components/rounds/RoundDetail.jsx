// frontend/src/components/rounds/RoundDetail.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Table, Tag, Space, Button, Avatar, 
  Typography, Descriptions, Statistic, Progress, Modal, 
  message, Form, Input, Select, DatePicker, InputNumber
} from 'antd';
import {
  CalendarOutlined, TrophyOutlined, TeamOutlined,
  EditOutlined, DeleteOutlined, CheckCircleOutlined,
  ClockCircleOutlined, EnvironmentOutlined, 
  FieldTimeOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import competitionService from '../../services/competitionService';
import { useAuth } from '../../context/AuthContext';
import { 
  formatDateTimeShortUTC, 
  formatDateOnly, 
  formatTimeOnly,
  formatDateTableUTC,
  formatDateTime,
  formatForInputUTC
} from '../../utils/dateFormatter';

const { Title, Text } = Typography;
const { Option } = Select;

const RoundDetail = () => {
  const { competitionId, roundId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  
  const [round, setRound] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingScore, setUpdatingScore] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    if (competitionId && roundId) {
      fetchRoundData();
    }
  }, [competitionId, roundId]);

  const fetchRoundData = async () => {
    setLoading(true);
    try {
      // Obtener datos de la jornada
      const roundRes = await competitionService.getRound(competitionId, roundId);
      setRound(roundRes.data);
      
      // Obtener partidos de la jornada
      const matchesRes = await competitionService.getMatchesByRound(roundId);
      setMatches(matchesRes.data.matches || []);
    } catch (error) {
      message.error('Error al cargar datos de la jornada');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async (matchId, homeScore, awayScore) => {
    setUpdatingScore(matchId);
    try {
      await competitionService.updateMatchScore(matchId, homeScore, awayScore);
      message.success('Marcador actualizado');
      fetchRoundData();
    } catch (error) {
      message.error('Error al actualizar marcador');
    } finally {
      setUpdatingScore(null);
    }
  };

  const handleCompleteRound = async () => {
    Modal.confirm({
      title: '¿Completar jornada?',
      content: 'Al completar la jornada, no se podrán modificar los resultados.',
      okText: 'Completar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await competitionService.completeRound(competitionId, roundId);
          message.success('Jornada completada');
          fetchRoundData();
        } catch (error) {
          message.error('Error al completar jornada');
        }
      },
    });
  };

  const handleEditRound = async (values) => {
    try {
      await competitionService.updateRound(competitionId, roundId, values);
      message.success('Jornada actualizada');
      setEditModalVisible(false);
      fetchRoundData();
    } catch (error) {
      message.error('Error al actualizar jornada');
    }
  };

  const getRoundStats = () => {
    if (!matches.length) return null;

    const finishedMatches = matches.filter(m => m.status === 'Finalizado');
    const totalGoals = finishedMatches.reduce((sum, m) => sum + m.home_score + m.away_score, 0);
    const avgGoals = totalGoals / finishedMatches.length;
    
    // Partido con más goles
    const highestScoringMatch = finishedMatches.reduce((max, match) => {
      const total = match.home_score + match.away_score;
      return total > (max.total || 0) ? { match, total } : max;
    }, {});

    return {
      totalMatches: matches.length,
      finishedMatches: finishedMatches.length,
      totalGoals,
      avgGoals: avgGoals.toFixed(2),
      highestScoringMatch,
    };
  };

  const stats = getRoundStats();
  const allMatchesFinished = matches.every(m => m.status === 'Finalizado');

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'match_date',
      key: 'date',
      width: 150,
      render: (date) => {
        const dateInfo = formatDateTableUTC(date);
        return (
          <Space orientation="vertical" size={0}>
            <Text strong>{dateInfo.date}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <FieldTimeOutlined style={{ marginRight: 4 }} />
              {dateInfo.time}
            </Text>
          </Space>
        );
      },
      sorter: (a, b) => {
        const aTime = formatForInputUTC(a.match_date)?.valueOf() ?? 0;
        const bTime = formatForInputUTC(b.match_date)?.valueOf() ?? 0;
        return aTime - bTime;
      },
    },
    {
      title: 'Estadio',
      dataIndex: 'stadium',
      key: 'stadium',
      width: 120,
      render: (stadium, record) => (
        <Space orientation="vertical" size={0}>
          <Text>{stadium || 'Por definir'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.city || 'Ciudad no definida'}
          </Text>
        </Space>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}>Partidos</div>,
      key: 'match',
      render: (record) => (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          {/* EQUIPO LOCAL */}
          <div style={{ textAlign: 'right', width: 140 }}>
            <Space>
              <Avatar 
                size="small"
                src={record.home_team?.logo_url ? (
                  <img 
                    src={record.home_team.logo_url} 
                    alt={record.home_team.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : null}
                style={{
                  backgroundColor: record.home_team?.logo_url ? 'transparent' : '#1890ff',
                  minWidth: 32,
                  minHeight: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {!record.home_team?.logo_url && record.home_team?.name?.charAt(0)?.toUpperCase() || 'L'}
              </Avatar>
              <div style={{ textAlign: 'right' }}>
                <Text strong style={{ fontSize: '14px', display: 'block' }}>
                  {record.home_team?.name || `Equipo ${record.home_team_id}`}
                </Text>
                {record.home_team?.short_name && (
                  <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                    {record.home_team.short_name}
                  </Text>
                )}
              </div>
            </Space>
          </div>
          
          {/* MARCADOR */}
          <Space style={{ minWidth: 120, justifyContent: 'center' }}>
            {record.status === 'Finalizado' ? (
              <Space>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  minWidth: '40px',
                  textAlign: 'center',
                  background: isDark
                    ? 'linear-gradient(135deg, #1a2744, #0d1f3c)'
                    : 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
                  color: isDark ? '#4096ff' : '#1d3557',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: isDark ? '1px solid rgba(64,150,255,0.25)' : '1px solid #d9d9d9'
                }}>
                  {record.home_score} - {record.away_score}
                </div>
                {isAdmin && (
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => setUpdatingScore(record.id)}
                    loading={updatingScore === record.id}
                    style={{ padding: '0 4px' }}
                  >
                    <EditOutlined />
                  </Button>
                )}
              </Space>
            ) : record.status === 'En curso' ? (
              <Tag color="blue" icon={<ClockCircleOutlined />} style={{ padding: '4px 8px' }}>
                En curso
              </Tag>
            ) : (
              <Tag color="orange" style={{ padding: '4px 8px' }}>
                {formatTimeOnly(formatForInputUTC(record.match_date))}
              </Tag>
            )}
          </Space>
          
          {/* EQUIPO VISITANTE */}
          <div style={{ textAlign: 'left', width: 140 }}>
            <Space>
              <div style={{ textAlign: 'left' }}>
                <Text strong style={{ fontSize: '14px', display: 'block' }}>
                  {record.away_team?.name || `Equipo ${record.away_team_id}`}
                </Text>
                {record.away_team?.short_name && (
                  <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                    {record.away_team.short_name}
                  </Text>
                )}
              </div>
              <Avatar 
                size="small"
                src={record.away_team?.logo_url ? (
                  <img 
                    src={record.away_team.logo_url} 
                    alt={record.away_team.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : null}
                style={{
                  backgroundColor: record.away_team?.logo_url ? 'transparent' : '#52c41a',
                  minWidth: 32,
                  minHeight: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {!record.away_team?.logo_url && record.away_team?.name?.charAt(0)?.toUpperCase() || 'V'}
              </Avatar>
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          'Finalizado': { color: 'green', icon: <CheckCircleOutlined /> },
          'En curso': { color: 'blue', icon: <ClockCircleOutlined /> },
          'Programado': { color: 'orange' },
          'Cancelado': { color: 'red' },
        };
        const config = statusConfig[status] || {};
        return (
          <Tag color={config.color} icon={config.icon}>
            {status}
          </Tag>
        );
      },
    },
  ];

  if (updatingScore) {
    const match = matches.find(m => m.id === updatingScore);
    columns.push({
      title: 'Marcador',
      key: 'scoreEditor',
      width: 150,
      render: (record) => {
        if (record.id !== updatingScore) return null;
        
        const [homeScore, setHomeScore] = useState(match?.home_score || 0);
        const [awayScore, setAwayScore] = useState(match?.away_score || 0);

        return (
          <Space>
            <InputNumber
              min={0}
              value={homeScore}
              onChange={setHomeScore}
              style={{ width: 60 }}
            />
            <span>-</span>
            <InputNumber
              min={0}
              value={awayScore}
              onChange={setAwayScore}
              style={{ width: 60 }}
            />
            <Space>
              <Button 
                type="primary" 
                size="small"
                onClick={() => handleUpdateScore(match.id, homeScore, awayScore)}
              >
                Guardar
              </Button>
              <Button 
                size="small"
                onClick={() => setUpdatingScore(null)}
              >
                Cancelar
              </Button>
            </Space>
          </Space>
        );
      },
    });
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card
        style={{ marginBottom: 24 }}
        loading={loading}
      >
        <Row align="middle" gutter={[16, 16]}>
          <Col>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/competitions/${competitionId}`)}
            >
              Volver a Competencia
            </Button>
          </Col>
          <Col flex="auto">
            <Space orientation="vertical" size={0}>
              <Title level={3} style={{ margin: 0 }}>
                <TrophyOutlined style={{ marginRight: 8 }} />
                {round?.competition?.name} - {round?.name}
              </Title>
              <Space>
                <Tag color="blue">Jornada {round?.round_number}</Tag>
                {round?.group_letter && (
                  <Tag color="green">Grupo {round?.group_letter}</Tag>
                )}
                <Tag color={round?.is_completed ? 'green' : 'orange'}>
                  {round?.is_completed ? 'Completada' : 'En progreso'}
                </Tag>
              </Space>
            </Space>
          </Col>
          <Col>
            <Space>
              {isAdmin && !round?.is_completed && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    editForm.setFieldsValue({
                      name: round?.name,
                      start_date: round?.start_date ? new Date(round.start_date) : null,
                      end_date: round?.end_date ? new Date(round.end_date) : null,
                    });
                    setEditModalVisible(true);
                  }}
                >
                  Editar
                </Button>
              )}
              {isAdmin && allMatchesFinished && !round?.is_completed && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleCompleteRound}
                >
                  Completar Jornada
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Estadísticas */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Partidos"
                value={stats.totalMatches}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Partidos Jugados"
                value={stats.finishedMatches}
                suffix={`/ ${stats.totalMatches}`}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Goles"
                value={stats.totalGoals}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card size="small">
              <Statistic
                title="Promedio Goles"
                value={stats.avgGoals}
                suffix="por partido"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Información de la jornada */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Información de la Jornada" style={{ height: '100%' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Nombre">
                <Text strong>{round?.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Número de Jornada">
                <Tag color="blue">{round?.round_number}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tipo">
                <Tag color="purple">{round?.round_type}</Tag>
              </Descriptions.Item>
              {round?.phase && (
                <Descriptions.Item label="Fase">
                  <Tag>{round.phase}</Tag>
                </Descriptions.Item>
              )}
              {round?.group_letter && (
                <Descriptions.Item label="Grupo">
                  <Tag color="green">Grupo {round.group_letter}</Tag>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Estado">
                <Tag color={round?.is_completed ? 'green' : 'orange'}>
                  {round?.is_completed ? 'Completada' : 'En progreso'}
                </Tag>
              </Descriptions.Item>
              {round?.start_date && (
                <Descriptions.Item label="Fecha Inicio">
                  {formatDateOnly(round.start_date)}
                </Descriptions.Item>
              )}
              {round?.end_date && (
                <Descriptions.Item label="Fecha Fin">
                  {formatDateOnly(round.end_date)}
                </Descriptions.Item>
              )}
              {round?.completed_at && (
                <Descriptions.Item label="Completada el">
                  {formatDateTime(round.completed_at)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <CalendarOutlined />
                <span>Partidos de la Jornada</span>
                <Tag>{matches.length} partidos</Tag>
              </Space>
            }
            extra={
              <Progress 
                percent={Math.round((stats?.finishedMatches / stats?.totalMatches) * 100)} 
                size="small" 
                style={{ width: 150 }}
              />
            }
          >
            <Table
              columns={columns}
              dataSource={matches}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 800 }}
              rowClassName={(record) => {
                switch (record.status) {
                  case 'Finalizado': return 'status-finished';
                  case 'En curso': return 'status-ongoing';
                  case 'Programado': return 'status-scheduled';
                  default: return '';
                }
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Partido con más goles */}
      {stats?.highestScoringMatch?.match && (
        <Card 
          title="Partido con más goles" 
          style={{ marginTop: 24 }}
          extra={
            <Tag color="gold" style={{ fontSize: '18x', padding: '4px 12px' }}>
              {stats.highestScoringMatch.total} goles
            </Tag>
          }
        >
          <Row align="middle" gutter={[16, 16]}>
            {/* Escudo Local */}
            <Col span={4} style={{ textAlign: 'right' }}>
              <Avatar
                size={64}
                src={stats.highestScoringMatch.match.home_team?.logo_url}
                style={{ 
                  backgroundColor: stats.highestScoringMatch.match.home_team?.logo_url ? 'transparent' : '#1890ff',
                  border: '2px solid #1890ff'
                }}
              >
                {!stats.highestScoringMatch.match.home_team?.logo_url && 
                stats.highestScoringMatch.match.home_team?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Col>
            
            {/* Equipo Local */}
            <Col span={4} style={{ textAlign: 'center' }}>
              <Text strong style={{ display: 'block' }}>
                {stats.highestScoringMatch.match.home_team?.name}
              </Text>
              {stats.highestScoringMatch.match.home_team?.short_name && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {stats.highestScoringMatch.match.home_team.short_name}
                </Text>
              )}
            </Col>
            
            {/* Marcador */}
            <Col span={8} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                background: isDark
                  ? 'linear-gradient(135deg, #1a2744, #0d1f3c)'
                  : 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
                color: isDark ? '#4096ff' : '#1d3557',
                padding: '12px',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(64,150,255,0.25)' : '1px solid #d9d9d9'
              }}>
                {stats.highestScoringMatch.match.home_score} - {stats.highestScoringMatch.match.away_score}
              </div>
              <Tag color="green" style={{ marginTop: 8 }}>Finalizado</Tag>
            </Col>
            
            {/* Equipo Visitante */}
            <Col span={4} style={{ textAlign: 'center' }}>
              <Text strong style={{ display: 'block' }}>
                {stats.highestScoringMatch.match.away_team?.name}
              </Text>
              {stats.highestScoringMatch.match.away_team?.short_name && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {stats.highestScoringMatch.match.away_team.short_name}
                </Text>
              )}
            </Col>
            
            {/* Escudo Visitante */}
            <Col span={4} style={{ textAlign: 'left' }}>
              <Avatar
                size={64}
                src={stats.highestScoringMatch.match.away_team?.logo_url}
                style={{ 
                  backgroundColor: stats.highestScoringMatch.match.away_team?.logo_url ? 'transparent' : '#52c41a',
                  border: '2px solid #52c41a'
                }}
              >
                {!stats.highestScoringMatch.match.away_team?.logo_url && 
                stats.highestScoringMatch.match.away_team?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Col>
          </Row>
          
          {/* Información del partido */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Space>
              <EnvironmentOutlined />
              <Text>{stats.highestScoringMatch.match.stadium || 'Estadio no definido'}</Text>
              <Text type="secondary">•</Text>
              <FieldTimeOutlined />
              <Text>{formatDateTimeShortUTC(stats.highestScoringMatch.match.match_date)}</Text>
            </Space>
          </div>
        </Card>
      )}

      {/* Modal para editar jornada */}
      <Modal
        title="Editar Jornada"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => editForm.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditRound}
        >
          <Form.Item
            name="name"
            label="Nombre de la jornada"
            rules={[{ required: true, message: 'Por favor ingresa el nombre' }]}
          >
            <Input placeholder="Ej: Fecha 1, Cuartos de final, etc." />
          </Form.Item>
          <Form.Item
            name="start_date"
            label="Fecha de inicio"
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="Seleccionar fecha y hora"
            />
          </Form.Item>
          <Form.Item
            name="end_date"
            label="Fecha de fin"
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="Seleccionar fecha y hora"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoundDetail;
