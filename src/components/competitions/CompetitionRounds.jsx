// frontend/src/components/competitions/CompetitionRounds.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Button, Typography,
  Row, Col, Progress, Statistic, message, Avatar, Tooltip
} from 'antd';
import {
  CalendarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, PlayCircleOutlined,
  EyeOutlined, ArrowRightOutlined, EnvironmentOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import competitionService from '../../services/competitionService';
import { formatDateTable, formatDateTimeShort } from '../../utils/dateFormatter';

const { Title, Text } = Typography;

const CompetitionRounds = ({ competitionId }) => {
  const [rounds, setRounds] = useState([]);
  const [matchesByRound, setMatchesByRound] = useState({});
  const [teamsInfo, setTeamsInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  useEffect(() => {
    fetchRounds();
  }, [competitionId]);

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const limit = 100;
      let skip = 0;
      let roundsData = [];
      while (true) {
        const res = await competitionService.getRounds(competitionId, { limit, skip });
        const batch = res.data || [];
        roundsData = roundsData.concat(batch);
        if (batch.length < limit) break;
        skip += limit;
      }

      const sortedRounds = roundsData.slice().sort((a, b) => {
        const aDate = a.end_date || a.start_date || null;
        const bDate = b.end_date || b.start_date || null;
        if (aDate && bDate) return new Date(bDate) - new Date(aDate);
        const aNum = Number(a.round_number ?? a.id ?? 0);
        const bNum = Number(b.round_number ?? b.id ?? 0);
        return bNum - aNum;
      });
      setRounds(sortedRounds);

      const map = {};
      const teamIds = [];

      // Cargar partidos de todas las jornadas en paralelo
      const matchResults = await Promise.allSettled(
        roundsData.map(r => competitionService.getMatchesByRound(r.id))
      );
      matchResults.forEach((result, i) => {
        const r = roundsData[i];
        if (result.status === 'fulfilled') {
          const raw = result.value.data;
          const matches = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.matches)
              ? raw.matches
              : [];
          map[r.id] = matches;
          matches.forEach(m => {
            if (m.home_team_id) teamIds.push(m.home_team_id);
            if (m.away_team_id) teamIds.push(m.away_team_id);
          });
        } else {
          map[r.id] = [];
        }
      });

      setMatchesByRound(map);
      await fetchTeamsInfo(teamIds);
    } catch {
      message.error('Error al cargar jornadas');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamsInfo = async (ids) => {
    const unique = [...new Set(ids.filter(Boolean))].filter(id => !teamsInfo[id]);
    if (!unique.length) return;

    const results = await Promise.allSettled(
      unique.map(id => competitionService.getTeam(id))
    );
    const newTeams = {};
    results.forEach((result, i) => {
      const id = unique[i];
      newTeams[id] = result.status === 'fulfilled'
        ? result.value.data
        : { id, name: `Equipo ${id}` };
    });
    setTeamsInfo(prev => ({ ...prev, ...newTeams }));
  };

  const getRoundStatus = (round) => {
    const matches = matchesByRound[round.id] || [];
    const finished = matches.filter(m =>
      m.status === 'FINISHED' || m.status === 'Finalizado'
    ).length;

    if (matches.length && finished === matches.length) return 'completed';
    if (finished > 0) return 'in-progress';
    return 'scheduled';
  };

  const getStatusTag = (status) => {
    if (status === 'completed') return <Tag color="green" icon={<CheckCircleOutlined />}>Completada</Tag>;
    if (status === 'in-progress') return <Tag color="orange" icon={<PlayCircleOutlined />}>En progreso</Tag>;
    return <Tag color="blue" icon={<ClockCircleOutlined />}>Programada</Tag>;
  };

  const columns = [
    {
      title: 'Jornada',
      render: (_, r) => <Text strong>{r.name || `Jornada ${r.round_number}`}</Text>
    },
    {
      title: '#',
      dataIndex: 'round_number',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.round_number - b.round_number
    },
    {
      title: 'Partidos',
      render: (_, r) => {
        const matches = matchesByRound[r.id] || [];
        const finished = matches.filter(m =>
          m.status === 'FINISHED' || m.status === 'Finalizado'
        ).length;

        return (
          <div style={{ textAlign: 'center' }}>
            <Text>{finished}/{matches.length}</Text>
            <Progress
              percent={matches.length ? (finished / matches.length) * 100 : 0}
              size="small"
              showInfo={false}
            />
          </div>
        );
      }
    },
    {
      title: 'Estado',
      render: (_, r) => getStatusTag(getRoundStatus(r))
    },
    {
      title: 'Accion',
      render: (_, r) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() =>
            navigate(`/competitions/${competitionId}/rounds/${r.id}`, {
              state: { roundNumber: r.round_number }
            })
          }
        >
          Ver
        </Button>
      )
    }
  ];

  const completed = rounds.filter(r => getRoundStatus(r) === 'completed');
  const progress = rounds.length ? (completed.length / rounds.length) * 100 : 0;

  return (
    <Card className="competition-tab-card">
      <Title level={4} style={{ marginBottom: 20 }}>
        <CalendarOutlined /> Jornadas de la Competencia
      </Title>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic title="Jornadas" value={rounds.length} prefix={<CalendarOutlined />} />
        </Col>
        <Col span={8}>
          <Statistic title="Completadas" value={completed.length} prefix={<CheckCircleOutlined />} />
        </Col>
        <Col span={8}>
          <Statistic title="Progreso" value={progress.toFixed(2)} suffix="%" prefix={<PlayCircleOutlined />} />
        </Col>
      </Row>

      <Progress
        percent={progress}
        status="active"
        style={{ marginBottom: 10 }}
        format={(percent) => (
          <span className="competition-progress-text">{percent.toFixed(2)}%</span>
        )}
      />

      <Table
        columns={columns}
        dataSource={rounds}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
        expandable={{
          expandedRowRender: (r) => {
            const matches = matchesByRound[r.id] || [];
            if (matches.length === 0) {
              return (
                <Card size="small">
                  <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                    No hay partidos programados para esta jornada
                  </Text>
                </Card>
              );
            }

            return (
              <Card size="small">
                {matches.map(m => {
                  const home = teamsInfo[m.home_team_id] || {};
                  const away = teamsInfo[m.away_team_id] || {};
                  const stadium = m.stadium || home.stadium || 'Estadio no definido';
                  const isFinished = m.status === 'FINISHED' || m.status === 'Finalizado';
                  const dateInfo = formatDateTable(m.match_date);

                  return (
                    <div key={m.id} style={{ padding: 8, borderBottom: isDark ? '1px solid #1f2b3a' : '1px solid #f0f0f0' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <Avatar src={home.logo_url} size="small">{home.name?.charAt(0)}</Avatar>
                          <Text strong>{home.name || `Equipo ${m.home_team_id}`}</Text>
                          <ArrowRightOutlined />
                          <Avatar src={away.logo_url} size="small">{away.name?.charAt(0)}</Avatar>
                          <Text strong>{away.name || `Equipo ${m.away_team_id}`}</Text>
                        </Space>

                        <Space>
                          {isFinished ? (
                            <Tag color="green">{m.home_score || 0} - {m.away_score || 0}</Tag>
                          ) : (
                            <Tag color="blue">
                              <Space size={4}>
                                <FieldTimeOutlined style={{ fontSize: '12px' }} />
                                {dateInfo.date} {dateInfo.time}
                              </Space>
                            </Tag>
                          )}
                          <Tooltip title={stadium}>
                            <EnvironmentOutlined style={{ color: isDark ? '#9fb0c2' : '#666' }} />
                          </Tooltip>
                          <Button
                            size="small"
                            type="link"
                            onClick={() => navigate(`/matches/${m.id}`)}
                          >
                            Ver
                          </Button>
                        </Space>
                      </Space>
                    </div>
                  );
                })}
              </Card>
            );
          }
        }}
        locale={{
          emptyText: (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <CalendarOutlined style={{ fontSize: 48, color: isDark ? '#6b7c93' : '#ccc', marginBottom: 16 }} />
              <Text type="secondary">No hay jornadas programadas para esta competencia</Text>
            </div>
          )
        }}
      />
    </Card>
  );
};

export default CompetitionRounds;
