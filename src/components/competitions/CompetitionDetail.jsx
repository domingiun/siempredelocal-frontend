import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Tabs, Tag, Space, Button, Statistic, 
  Descriptions, Table, Avatar, Progress, 
  Modal, message, Divider, Typography, Select,
  Empty
} from 'antd';
import { 
  TrophyOutlined, TeamOutlined, CalendarOutlined, 
  EditOutlined, DeleteOutlined, PlusOutlined, 
  EyeOutlined, SettingOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const CompetitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState({
    totalMatches: 0,
    matchesPlayed: 0,
    goalsScored: 0,
    avgGoals: 0,
  });

  useEffect(() => {
    if (id) {
      fetchCompetition();
      fetchStandings();
      fetchMatches();
    }
  }, [id]);

  const fetchCompetition = async () => {
    setLoading(true);
    try {
      const response = await competitionService.getCompetition(id);
      setCompetition(response.data);
      calculateStats(response.data);
    } catch {
      message.error('Error al cargar la competencia');
    } finally {
      setLoading(false);
    }
  };

  const fetchStandings = async () => {
    try {
      const data = await competitionService.getStandings(id);
      setStandings(data || []);
    } catch {}
  };

  const fetchMatches = async () => {
    try {
      const response = await competitionService.getMatchesByCompetition(id);
      setMatches(response.data?.matches || []);
    } catch {}
  };

  const calculateStats = (comp) => {
    if (!comp?.total_teams) return;

    const totalMatches = comp.total_teams * (comp.total_teams - 1) / 2;
    const matchesPlayed = Math.floor(totalMatches * 0.65);
    const goalsScored = matchesPlayed * 2.5;

    setStats({
      totalMatches,
      matchesPlayed,
      goalsScored,
      avgGoals: 2.5,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Finalizado': return 'green';
      case 'En curso': return 'orange';
      case 'Programado': return 'blue';
      case 'Cancelado': return 'red';
      default: return 'default';
    }
  };

  const matchColumns = [
    {
      title: 'Fecha',
      dataIndex: 'match_date',
      key: 'date',
      render: (date) => moment(date).format('DD/MM/YYYY hh:mm A'),
    },
    {
      title: 'Partido',
      key: 'match',
      render: (_, match) => (
        <Space>
          <Avatar src={match.home_team?.logo_url} size="small">
            {match.home_team?.name?.charAt(0)}
          </Avatar>
          <Text strong>{match.home_team?.name || match.home_team_name}</Text>
          <Text>vs</Text>
          <Avatar src={match.away_team?.logo_url} size="small">
            {match.away_team?.name?.charAt(0)}
          </Avatar>
          <Text strong>{match.away_team?.name || match.away_team_name}</Text>
        </Space>
      ),
    },
    {
      title: 'Resultado',
      key: 'result',
      render: (_, match) => (
        <Tag color={match.status === 'Finalizado' ? 'green' : 'blue'}>
          {match.status === 'Finalizado'
            ? `${match.home_score || 0} - ${match.away_score || 0}`
            : '0 - 0'
          }
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Progress type="circle" percent={70} />
        <Paragraph>Cargando competencia...</Paragraph>
      </div>
    );
  }

  if (!competition) {
    return (
      <Card>
        <Title level={3}>Competencia no encontrada</Title>
        <Button onClick={() => navigate('/competitions')}>Volver</Button>
      </Card>
    );
  }

  return (
    <div style={{ padding: 24 }}>

      {/* HEADER */}
      <Card style={{ background: '#1e1e2f', color: '#fff', marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <TrophyOutlined style={{ fontSize: 32 }} />
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                {competition.name}
              </Title>
            </Space>
            <Space>
              <Tag color="blue">{competition.season}</Tag>
              <Tag color="geekblue">{competition.country}</Tag>
            </Space>
          </Col>

          <Col>
            <Space>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/competitions/${id}/edit`)}>Editar</Button>
              <Button danger icon={<DeleteOutlined />}>Eliminar</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>

          {/* RESUMEN */}
          <TabPane tab="Resumen" key="overview" icon={<EyeOutlined />}>
            <Row gutter={24}>
              <Col span={16}>
                <Card title="Información General">
                  <Descriptions column={2}>
                    <Descriptions.Item label="Tipo">{competition.competition_type}</Descriptions.Item>
                    <Descriptions.Item label="Formato">{competition.competition_format}</Descriptions.Item>
                    <Descriptions.Item label="Temporada">{competition.season}</Descriptions.Item>
                    <Descriptions.Item label="País">{competition.country}</Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card title="Clasificación" style={{ marginTop: 16 }}>
                  <Table
                    columns={[
                      { title: '#', dataIndex: 'position' },
                      {
                        title: 'Equipo',
                        render: r => (
                          <Space>
                            <Avatar src={r.logo_url} size="small">{r.team?.charAt(0)}</Avatar>
                            {r.team}
                          </Space>
                        )
                      },
                      { title: 'PTS', dataIndex: 'points' }
                    ]}
                    dataSource={standings}
                    rowKey="position"
                    pagination={false}
                  />
                </Card>
              </Col>

              <Col span={8}>
                <Card title="Estadísticas">
                  <Statistic title="Partidos Totales" value={stats.totalMatches} />
                  <Statistic title="Jugados" value={stats.matchesPlayed} />
                  <Statistic title="Goles" value={stats.goalsScored} />
                </Card>

                <Card title="Próximos Partidos" style={{ marginTop: 16 }}>
                  {matches.slice(0, 5).length === 0 ? (
                    <Empty description="No hay partidos pr??ximos" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {matches.slice(0, 5).map(m => (
                        <Card key={m.id} size="small">
                          <Space orientation="vertical" size={0}>
                            <Text strong>
                              {m.home_team?.name || m.home_team_name} vs {m.away_team?.name || m.away_team_name}
                            </Text>
                            <Text type="secondary">
                              {moment(m.match_date).utc().local().format('dddd, DD [de] MMMM [de] YYYY hh:mm A')} ??? {
                                m.home_team?.stadium_name ||
                                m.home_team?.stadium?.name ||
                                m.stadium ||
                                'Estadio'
                              }
                            </Text>
                          </Space>
                        </Card>
                      ))}
                    </div>
                  )}

                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* PARTIDOS */}
          <TabPane tab="Partidos" key="matches" icon={<CalendarOutlined />}>
            <Table
              columns={matchColumns}
              dataSource={matches}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          {/* EQUIPOS */}
          <TabPane tab="Equipos" key="teams" icon={<TeamOutlined />}>
            <Row gutter={16}>
              {competition.teams?.map(team => (
                <Col span={6} key={team.id}>
                  <Card hoverable onClick={() => navigate(`/teams/${team.id}`)}>
                    <Space orientation="vertical" align="center" style={{ width: '100%' }}>
                      <Avatar size={64} src={team.logo_url}>{team.name.charAt(0)}</Avatar>
                      <Text strong>{team.name}</Text>
                      <Text type="secondary">{team.city}</Text>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>

          <TabPane tab="Configuración" key="settings" icon={<SettingOutlined />}>
            <Paragraph>Aquí podrás configurar el formato, reglas y fases.</Paragraph>
          </TabPane>

        </Tabs>
      </Card>
    </div>
  );
};

export default CompetitionDetail;

