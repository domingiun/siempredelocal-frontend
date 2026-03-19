import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Space, Select, Row, Col, 
  Statistic, Avatar, Progress, message, Grid 
} from 'antd';
import { 
  TrophyOutlined, TeamOutlined, CrownOutlined,
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined 
} from '@ant-design/icons';
import competitionService from '../../services/competitionService';

const { Option } = Select;

const StandingsTable = ({ competitionId }) => {
  const [standings, setStandings] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('general'); // 'general', 'home', 'away'
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (competitionId) {
      fetchStandings();
      fetchCompetition();
    }
  }, [competitionId, view]);

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const data = await competitionService.getStandings(competitionId);
      setStandings(data);
    } catch (error) {
      message.error('Error al cargar clasificación');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetition = async () => {
    try {
      const response = await competitionService.getCompetition(competitionId);
      setCompetition(response.data);
    } catch (error) {
      message.error('Error al cargar competencia');
    }
  };

  const getPromotionRelegationInfo = (position, totalTeams) => {
    if (!competition) return null;

    const { 
      teams_to_qualify, 
      promotion_spots, 
      relegation_spots,
      international_spots 
    } = competition;

    // Posiciones para clasificación a playoff
    const playoffPositions = teams_to_qualify > 0 && 
      position <= teams_to_qualify;

    // Posiciones para ascenso
    const promotionPositions = promotion_spots > 0 && 
      position <= promotion_spots;

    // Posiciones para descenso
    const relegationPositions = relegation_spots > 0 && 
      position > totalTeams - relegation_spots;

    // Posiciones para torneos internacionales
    const internationalPositions = international_spots > 0 && 
      position <= international_spots;

    return {
      playoff: playoffPositions,
      promotion: promotionPositions,
      relegation: relegationPositions,
      international: internationalPositions,
    };
  };

  const getRowClassName = (record) => {
    const info = getPromotionRelegationInfo(record.position, standings.length);
    
    if (info?.promotion) return 'promotion-row';
    if (info?.international) return 'international-row';
    if (info?.playoff) return 'playoff-row';
    if (info?.relegation) return 'relegation-row';
    return '';
  };

  const columns = [
    {
      title: 'Pos',
      dataIndex: 'position',
      key: 'position',
      width: 60,
      render: (position, record) => {
        const info = getPromotionRelegationInfo(position, standings.length);
        
        let icon = null;
        if (position === 1) {
          icon = <CrownOutlined style={{ color: '#faad14', marginRight: 4 }} />;
        } else if (info?.promotion) {
          icon = <ArrowUpOutlined style={{ color: '#52c41a', marginRight: 4 }} />;
        } else if (info?.relegation) {
          icon = <ArrowDownOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />;
        }

        return (
          <Space>
            {icon}
            <strong>{position}</strong>
          </Space>
        );
      },
    },
    {
      title: 'Equipo',
      key: 'team',
      render: (_, record) => (
        <Space>
          <Avatar size="small">
            {record.team.charAt(0)}
          </Avatar>
          <span>{record.team}</span>
        </Space>
      ),
    },
    {
      title: 'PJ',
      dataIndex: 'played',
      key: 'played',
      width: 60,
      align: 'center',
    },
    {
      title: 'G',
      dataIndex: 'won',
      responsive: ['md'],
      key: 'won',
      width: 60,
      align: 'center',
      render: (won) => <Tag color="green">{won}</Tag>,
    },
    {
      title: 'E',
      dataIndex: 'drawn',
      responsive: ['md'],
      key: 'drawn',
      width: 60,
      align: 'center',
      render: (drawn) => <Tag color="blue">{drawn}</Tag>,
    },
    {
      title: 'P',
      dataIndex: 'lost',
      responsive: ['md'],
      key: 'lost',
      width: 60,
      align: 'center',
      render: (lost) => <Tag color="red">{lost}</Tag>,
    },
    {
      title: 'GF',
      dataIndex: 'goalsFor',
      responsive: ['md'],
      key: 'goalsFor',
      width: 60,
      align: 'center',
    },
    {
      title: 'GC',
      dataIndex: 'goalsAgainst',
      responsive: ['md'],
      key: 'goalsAgainst',
      width: 60,
      align: 'center',
    },
    {
      title: 'DG',
      dataIndex: 'goalDifference',
      responsive: ['sm'],
      key: 'goalDifference',
      width: 60,
      align: 'center',
      render: (diff) => (
        <Tag color={diff > 0 ? 'green' : diff < 0 ? 'red' : 'default'}>
          {diff > 0 ? '+' : ''}{diff}
        </Tag>
      ),
    },
    {
      title: 'PTS',
      dataIndex: 'points',
      key: 'points',
      width: 70,
      align: 'center',
      render: (points) => (
        <strong style={{ fontSize: '16px' }}>{points}</strong>
      ),
      sorter: (a, b) => b.points - a.points,
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Rendimiento',
      key: 'performance',
      responsive: ['lg'],
      render: (_, record) => {
        const winRate = record.played > 0 ? (record.won / record.played) * 100 : 0;
        const form = ['W', 'W', 'L', 'D', 'W']; // Esto sería dinámico en producción
        
        return (
          <Space>
            <Progress 
              percent={Math.round(winRate)} 
              size="small" 
              style={{ width: 80 }}
            />
            <Space size={2}>
              {form.map((result, i) => (
                <Tag 
                  key={i} 
                  color={
                    result === 'W' ? 'green' : 
                    result === 'D' ? 'blue' : 'red'
                  }
                  style={{ margin: 0 }}
                >
                  {result}
                </Tag>
              ))}
            </Space>
          </Space>
        );
      },
    },
  ];

  const getCompetitionStats = () => {
    if (!standings.length) return null;

    const totalMatches = standings.reduce((sum, team) => sum + team.played, 0) / 2;
    const totalGoals = standings.reduce((sum, team) => sum + team.goalsFor, 0);
    const avgGoals = totalGoals / totalMatches;
    const leader = standings[0];

    return { totalMatches, totalGoals, avgGoals, leader };
  };

  const stats = getCompetitionStats();

  return (
    <div style={{ padding: '24px' }}>
      {competition && (
        <Card
          title={
            <Space>
              <TrophyOutlined />
              <span>{competition.name} - Clasificación</span>
              <Tag color="blue">{competition.season}</Tag>
            </Space>
          }
          extra={
            <Select
              value={view}
              onChange={setView}
              style={{ width: 150 }}
            >
              <Option value="general">Clasificación General</Option>
              <Option value="home">Como Local</Option>
              <Option value="away">Como Visitante</Option>
            </Select>
          }
        >
          {stats && (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Total Partidos"
                    value={stats.totalMatches}
                    prefix={<TeamOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Total Goles"
                    value={stats.totalGoals}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Promedio Goles"
                    value={stats.avgGoals.toFixed(2)}
                    suffix="por partido"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Líder"
                    value={stats.leader?.team}
                    prefix={<CrownOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          )}

          <Table
            size={isMobile ? 'small' : 'middle'}
            columns={columns}
            dataSource={standings}
            rowKey="position"
            loading={loading}
            pagination={false}
            scroll={{ x: 1200 }}
            rowClassName={getRowClassName}
            summary={() => {
              if (!competition) return null;

              const { 
                teams_to_qualify, 
                promotion_spots, 
                relegation_spots,
                international_spots 
              } = competition;

              return (
                <Table.Summary fixed="bottom">
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={12}>
                      <Space>
                        {international_spots > 0 && (
                          <Tag color="cyan">
                            Clasificación Internacional ({international_spots} equipos)
                          </Tag>
                        )}
                        {teams_to_qualify > 0 && (
                          <Tag color="blue">
                            Playoff ({teams_to_qualify} equipos)
                          </Tag>
                        )}
                        {promotion_spots > 0 && (
                          <Tag color="green">
                            Ascenso ({promotion_spots} equipos)
                          </Tag>
                        )}
                        {relegation_spots > 0 && (
                          <Tag color="red">
                            Descenso ({relegation_spots} equipos)
                          </Tag>
                        )}
                      </Space>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default StandingsTable;
