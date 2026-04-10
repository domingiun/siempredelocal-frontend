// frontend/src/components/competitions/CompetitionStandings.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Avatar, Tag, Space, Typography, message, Image, Tooltip, Select, Divider, Grid } from 'antd';
import { TrophyOutlined, FireFilled, CrownOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import competitionService from '../../services/competitionService';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import './CompetitionStandings.css';

const { Text } = Typography;

const CompetitionStandings = ({ competitionId }) => {
  const [standings, setStandings] = useState([]);
  const [groupStandings, setGroupStandings] = useState(null);
  const [playoffBracket, setPlayoffBracket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (competitionId) {
      fetchStandingsWithForm();
      fetchStandingsHistory();
      fetchPlayoffBracket();
    }
  }, [competitionId]);

  const fetchStandingsWithForm = async () => {
    setLoading(true);
    try {
      // Intentar obtener standings por grupos si aplica
      try {
        const groupsRes = await competitionService.getStandingsGroups(competitionId);
        const groupsData = groupsRes?.data?.groups_data || null;
        setGroupStandings(groupsData && Object.keys(groupsData).length ? groupsData : null);
      } catch {
        setGroupStandings(null);
      }

      const response = await competitionService.getStandingsWithRecentForm(competitionId, { form_limit: 5 });
      let standings = Array.isArray(response) ? response : response.data;

      if (!Array.isArray(standings) || standings.length === 0) {
        const fallbackRes = await competitionService.getStandings(competitionId);
        standings = Array.isArray(fallbackRes) ? fallbackRes : fallbackRes.data;
      }

      if (!Array.isArray(standings) || standings.length === 0) {
        setStandings([]);
        return;
      }

      processStandingsData(standings);

    } catch (error) {
      console.error('❌ Error cargando standings:', error);
      message.error('Error al cargar la tabla de posiciones');
      setStandings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayoffBracket = async () => {
    try {
      const response = await competitionService.getPlayoffBracket(competitionId);
      setPlayoffBracket(response.data || null);
    } catch (error) {
      setPlayoffBracket(null);
    }
  };

  const fetchStandingsHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await competitionService.getStandingsHistory(competitionId);
      setHistory(response.data || null);
    } catch (error) {
      console.error('Error cargando historial de posiciones:', error);
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };


  // Función para calcular forma reciente de un equipo
  const calculateTeamRecentForm = (matches, teamId, limit = 5) => {
    if (!Array.isArray(matches)) return [];
    
    const teamIdNum = Number(teamId);
    const teamIdStr = String(teamId);

    // Filtrar partidos del equipo
    const teamMatches = matches.filter(match => 
      Number(match.home_team_id) === teamIdNum ||
      Number(match.away_team_id) === teamIdNum ||
      String(match.home_team_id) === teamIdStr ||
      String(match.away_team_id) === teamIdStr
    );
    
    // Ordenar por fecha más reciente
    const recentMatches = teamMatches
      .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
      .slice(0, limit);
    
    // Calcular resultados W/D/L
    return recentMatches.map(match => {
      const isHome = match.home_team_id === teamId;
      const homeScore = Number(match.home_score) || 0;
      const awayScore = Number(match.away_score) || 0;
      
      if (isHome) {
        if (homeScore > awayScore) return 'W';
        if (homeScore < awayScore) return 'L';
        return 'D';
      } else {
        if (awayScore > homeScore) return 'W';
        if (awayScore < homeScore) return 'L';
        return 'D';
      }
    });
  };

  // Procesar datos de standings
  const processStandingsData = (standings) => {
    if (!standings || !Array.isArray(standings)) {
      setStandings([]);
      return;
    }

    const normalizedData = standings.map((item, index) => {
      const rawPosition = Number(item.position);
      const normalizedPosition = Number.isFinite(rawPosition) && rawPosition > 0
        ? rawPosition
        : index + 1;

      return {
        id: item.id || item.team_id || index,
        position: normalizedPosition,
        team_id: item.team_id,
        
        // ⚠️ SOLO usar lo que realmente viene del backend
        team_name: item.team_name || 
                  (item.team && item.team.name) || 
                  `Equipo ${item.team_id || index}`,
                  
        team_logo: item.team_logo || 
                  (item.team && item.team.logo_url) || 
                  null,

        matches_played: item.matches_played || 0,
        matches_won: item.matches_won || 0,
        matches_drawn: item.matches_drawn || 0,
        matches_lost: item.matches_lost || 0,

        goals_for: item.goals_for || 0,
        goals_against: item.goals_against || 0,
        goal_difference: item.goal_difference || 0,

        points: item.points || 0,
        recent_form: item.recent_form || []
      };
    });

    setStandings(normalizedData);
  };



  const columns = [
    {
      title: 'POS',
      dataIndex: 'position',
      key: 'position',
      width: 70,
      align: 'center',
      render: (pos, record) => {
        let color = 'default';
        let icon = null;
        let className = 'position-tag';
        
        if (pos === 1) {
          color = 'gold';
          icon = <CrownOutlined style={{ fontSize: '12px' }} />;
          className += ' first-place-tag';
        } else if (pos === 2) {
          color = '#d4d4d4';
          className += ' second-place-tag';
        } else if (pos === 3) {
          color = '#cd7f32';
          className += ' third-place-tag';
        } else if (pos <= 4) {
          color = 'green';
          className += ' ucl-tag';
        } else if (pos >= 19) {
          color = 'red';
          className += ' relegation-tag';
          icon = <ArrowDownOutlined style={{ fontSize: '10px' }} />;
        }
        
        return (
          <Tag 
            color={color} 
            className={className}
            style={{ margin: 0 }}
          >
            {icon && <span style={{ marginRight: 4, display: 'inline-flex' }}>{icon}</span>}
            {pos}
          </Tag>
        );
      }
    },
    {
      title: 'Equipo',
      dataIndex: 'team_name',
      key: 'team',
      render: (text, record) => (
        <Space style={{ alignItems: 'center' }}>
          {record.team_logo ? (
            <Avatar 
              src={<Image src={record.team_logo} alt={text} preview={false} />}
              size="small"
              className="team-avatar"
              style={{ 
                width: 28,
                height: 28,
                minWidth: 28
              }}
            />
          ) : (
            <Avatar 
              size="small"
              className="team-avatar"
              style={{ 
                width: 28,
                height: 28,
                minWidth: 28,
                fontSize: '14px'
              }}
            >
              {text?.charAt(0)?.toUpperCase() || 'T'}
            </Avatar>
          )}
          <Text strong style={{ marginLeft: 8, fontSize: '14px' }}>{text || 'Sin nombre'}</Text>
        </Space>
      ),
    },
    {
      title: 'PJ',
      dataIndex: 'matches_played',
      align: 'center',
      width: 50,
    },
    {
      title: 'G',
      dataIndex: 'matches_won',
      align: 'center',
      width: 50,
    },
    {
      title: 'E',
      dataIndex: 'matches_drawn',
      align: 'center',
      width: 50,
    },
    {
      title: 'P',
      dataIndex: 'matches_lost',
      align: 'center',
      width: 50,
    },
    {
      title: 'GF',
      dataIndex: 'goals_for',
      align: 'center',
      width: 50,
    },
    {
      title: 'GC',
      dataIndex: 'goals_against',
      align: 'center',
      width: 50,
    },
    {
      title: 'DG',
      dataIndex: 'goal_difference',
      align: 'center',
      width: 60,
      render: v => (
        <Text 
          strong 
          style={{ 
            color: v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : (isDark ? '#e6edf3' : '#000000'),
            fontSize: '14px'
          }}
        >
          {v > 0 ? '+' : ''}{v}
        </Text>
      ),
    },
    {
      title: 'PTS',
      dataIndex: 'points',
      align: 'center',
      width: 70,
      render: v => <Text strong style={{ fontSize: '16px', fontWeight: 700 }}>{v}</Text>,
      defaultSortOrder: 'descend',
    },
    {
      title: (
        <Tooltip title="Forma reciente - Últimos 5 partidos">
          <Space size={4} style={{ cursor: 'help' }}>
            <FireFilled style={{ color: '#ff6b35', fontSize: '14px' }} />
            <span style={{ fontWeight: 600 }}>Últimos 5 partidos</span>
          </Space>
        </Tooltip>
      ),
      dataIndex: 'recent_form',
      key: 'recent_form',
      width: 150,
      align: 'center',
      render: (form, record) => {
        if (!form || form.length === 0) {
          return (
            <Tooltip title="No hay partidos recientes">
              <Text type="secondary" style={{ fontSize: '12px' }}>-</Text>
            </Tooltip>
          );
        }
        
        return (
          <div className="form-badge-container">
            {form.map((result, index) => {
              const tooltipText = 
                result === 'W' ? 'Victoria' : 
                result === 'D' ? 'Empate' : 'Derrota';
              
              return (
                <Tooltip key={index} title={`${tooltipText} (${index + 1}º Partido)`}>
                  <div
                    className={`form-badge form-${result.toLowerCase()}`}
                  >
                    {result}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        );
      }
    }
  ];

  const groupColumns = columns.filter(col => col.dataIndex !== 'recent_form' && col.key !== 'recent_form');

  const teamOptions = useMemo(() => (
    standings
      .slice()
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((t) => ({
        label: t.team_name,
        value: t.team_id
      }))
  ), [standings]);

  const filteredTeams = useMemo(() => {
    if (!selectedTeams.length) return null;
    return new Set(selectedTeams);
  }, [selectedTeams]);

  const colorForTeam = (teamId) => {
    const palette = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
      '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
      '#bcbd22', '#17becf', '#4c78a8', '#f58518',
      '#54a24b', '#e45756', '#b279a2', '#ff9da6',
      '#9c755f', '#bab0ab', '#003f5c', '#58508d'
    ];
    const idx = Math.abs(Number(teamId || 0)) % palette.length;
    return palette[idx];
  };

  const historySeries = useMemo(() => {
    if (!history?.series) return [];
    const series = history.series;
    if (!filteredTeams) return series;
    return series.filter(s => filteredTeams.has(s.team_id));
  }, [history, filteredTeams]);

  const chartData = useMemo(() => {
    if (!history?.rounds?.length) return [];
    const base = history.rounds
      .filter(r => r.round_number && r.round_number > 0)
      .map(r => ({ round: r.round_number }));
    const indexByRound = new Map(base.map((d, i) => [d.round, i]));

    historySeries.forEach(team => {
      const key = `t_${team.team_id}`;
      team.data.forEach(point => {
        if (!point.round_number || point.round_number <= 0) return;
        const idx = indexByRound.get(point.round_number);
        if (idx !== undefined && point.position && point.position > 0) {
          base[idx][key] = point.position;
        }
      });
    });

    return base;
  }, [history, historySeries]);

  const chartDomains = useMemo(() => {
    const rounds = chartData.map(d => d.round).filter(r => Number.isFinite(r));
    const minRound = rounds.length ? Math.min(...rounds) : 1;
    const maxRound = rounds.length ? Math.max(...rounds) : 1;

    let maxPos = 1;
    historySeries.forEach(team => {
      team.data.forEach(point => {
        if (point.position && point.position > maxPos) {
          maxPos = point.position;
        }
      });
    });

    return { minRound, maxRound, maxPos };
  }, [chartData, historySeries]);

  return (
    <Card 
      className="competition-standings-container competition-tab-card"
      title={
        <Space>
          <TrophyOutlined style={{ color: '#faad14', fontSize: '18px' }} />
          <Text strong style={{ fontSize: '16px' }}>Tabla de Posiciones</Text>
        </Space>
      } 
      style={{ body: { padding: '16px 0' } }}
      extra={
        <Space size={12}>
          <Tag color="gold" style={{ margin: 0, fontWeight: 600 }}>🏆 Campeón</Tag>
        </Space>
      }
    >
      {groupStandings ? (
        <div style={{ padding: '0 16px 16px' }}>
          {Object.entries(groupStandings).map(([groupName, data]) => (
            <Card
              key={groupName}
              size="small"
              title={<Text strong>{groupName}</Text>}
              style={{ marginBottom: 16 }}
            >
              <Table
                className="competition-standings-table"
                columns={groupColumns}
                dataSource={(data?.standings || []).map((row, index) => ({
                  ...row,
                  id: row.team_id || `${groupName}-${index}`
                }))}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                locale={{ emptyText: 'No hay datos de posiciones disponibles' }}
              />
            </Card>
          ))}
        </div>
      ) : (
        <Table
          className="competition-standings-table"
          columns={columns}
          dataSource={standings}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          scroll={{ x: 'max-content' }}
          rowClassName={(record, index) => {
            if (record.position === 1) return 'first-place-row';
            if (record.position <= 4) return 'champions-league-row';
            if (record.position >= 19) return 'relegation-row';
            return '';
          }}
          locale={{
            emptyText: 'No hay datos de posiciones disponibles'
          }}
        />
      )}


      {playoffBracket && (
        <div style={{ padding: '0 16px 16px' }}>
          <Divider orientation="left">Playoff (Dieciseisavos)</Divider>
          {!playoffBracket.ready ? (
            <Text type="secondary">{playoffBracket.reason || 'Fase de grupos no finalizada.'}</Text>
          ) : (
            <>
              {playoffBracket.provisional && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  Provisional: se calcula con la posición actual de los grupos.
                </Text>
              )}
              <Table
                size="small"
                pagination={false}
                dataSource={playoffBracket.round_of_32 || []}
                rowKey="match_number"
                columns={[
                  { title: 'Partido', dataIndex: 'match_number', width: 90, align: 'center' },
                  {
                    title: 'Local',
                    render: (_, row) => playoffBracket.provisional ? (row.home?.label || 'Pendiente') : (row.home?.name || row.home?.label || 'Pendiente')
                  },
                  {
                    title: 'Visitante',
                    render: (_, row) => playoffBracket.provisional ? (row.away?.label || 'Pendiente') : (row.away?.name || row.away?.label || 'Pendiente')
                  }
                ]}
              />

              <Divider style={{ margin: '16px 0' }} />
              <Text strong>Octavos de final</Text>
              <Table
                size="small"
                pagination={false}
                dataSource={playoffBracket.round_of_16 || []}
                rowKey="match_number"
                columns={[
                  { title: 'Partido', dataIndex: 'match_number', width: 90, align: 'center' },
                  { title: 'Local', dataIndex: 'home_label' },
                  { title: 'Visitante', dataIndex: 'away_label' }
                ]}
              />

              <Divider style={{ margin: '16px 0' }} />
              <Text strong>Cuartos de final</Text>
              <Table
                size="small"
                pagination={false}
                dataSource={playoffBracket.quarterfinals || []}
                rowKey="match_number"
                columns={[
                  { title: 'Partido', dataIndex: 'match_number', width: 90, align: 'center' },
                  { title: 'Local', dataIndex: 'home_label' },
                  { title: 'Visitante', dataIndex: 'away_label' }
                ]}
              />

              <Divider style={{ margin: '16px 0' }} />
              <Text strong>Semifinales</Text>
              <Table
                size="small"
                pagination={false}
                dataSource={playoffBracket.semifinals || []}
                rowKey="match_number"
                columns={[
                  { title: 'Partido', dataIndex: 'match_number', width: 90, align: 'center' },
                  { title: 'Local', dataIndex: 'home_label' },
                  { title: 'Visitante', dataIndex: 'away_label' }
                ]}
              />

              <Divider style={{ margin: '16px 0' }} />
              <Text strong>Tercer puesto</Text>
              <Table
                size="small"
                pagination={false}
                dataSource={playoffBracket.third_place || []}
                rowKey="match_number"
                columns={[
                  { title: 'Partido', dataIndex: 'match_number', width: 90, align: 'center' },
                  { title: 'Local', dataIndex: 'home_label' },
                  { title: 'Visitante', dataIndex: 'away_label' }
                ]}
              />

              <Divider style={{ margin: '16px 0' }} />
              <Text strong>Final</Text>
              <Table
                size="small"
                pagination={false}
                dataSource={playoffBracket.final || []}
                rowKey="match_number"
                columns={[
                  { title: 'Partido', dataIndex: 'match_number', width: 90, align: 'center' },
                  { title: 'Local', dataIndex: 'home_label' },
                  { title: 'Visitante', dataIndex: 'away_label' }
                ]}
              />
            </>
          )}
        </div>
      )}

      {!isMobile && <Divider style={{ margin: '20px 0 12px' }} />}

      {!isMobile && <div style={{ padding: '0 16px 16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text strong>Gráfica: Posición por Jornada</Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="Filtrar por equipo"
              style={{ minWidth: 260 }}
              options={teamOptions}
              value={selectedTeams}
              onChange={setSelectedTeams}
              maxTagCount="responsive"
            />
          </Space>

          <div style={{ width: '100%', height: 360 }}>
            {historyLoading ? (
              <Text type="secondary">Cargando gráfica...</Text>
            ) : (
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#223043' : '#e5e7eb'} />
                  <XAxis
                    dataKey="round"
                    type="number"
                    domain={[chartDomains.minRound, chartDomains.maxRound]}
                    allowDecimals={false}
                    ticks={
                      chartDomains.maxRound >= chartDomains.minRound
                        ? Array.from({ length: chartDomains.maxRound - chartDomains.minRound + 1 }, (_, i) => chartDomains.minRound + i)
                        : undefined
                    }
                    tick={{ fontSize: 12, fill: isDark ? '#cbd5e1' : '#374151' }}
                    label={{ value: 'Fecha / Jornada', position: 'insideBottom', offset: -4, fill: isDark ? '#cbd5e1' : '#374151' }}
                  />
                  <YAxis
                    domain={[1, chartDomains.maxPos]}
                    ticks={Array.from({ length: chartDomains.maxPos }, (_, i) => i + 1)}
                    allowDecimals={false}
                    reversed
                    tick={{ fontSize: 12, fill: isDark ? '#cbd5e1' : '#374151' }}
                    label={{ value: 'Posición', angle: -90, position: 'insideLeft', fill: isDark ? '#cbd5e1' : '#374151' }}
                  />
                  <RechartsTooltip
                    formatter={(value, name) => {
                      const team = historySeries.find(s => `t_${s.team_id}` === name);
                      return [value, team?.team_name || name];
                    }}
                    labelFormatter={(label) => `Jornada ${label}`}
                    contentStyle={{
                      background: isDark ? '#0f1724' : '#ffffff',
                      border: `1px solid ${isDark ? '#1f2b3a' : '#e5e7eb'}`,
                      color: isDark ? '#e6edf3' : '#111827'
                    }}
                    labelStyle={{ color: isDark ? '#e6edf3' : '#111827' }}
                  />
                  <Legend />

                  {historySeries.map(team => (
                    <Line
                      key={team.team_id}
                      type="monotone"
                      dataKey={`t_${team.team_id}`}
                      name={team.team_name}
                      stroke={colorForTeam(team.team_id)}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Space>
      </div>}

      <div className="standings-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#52c41a' }}></div>
          <span>Victoria (W)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#faad14' }}></div>
          <span>Empate (D)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ff4d4f' }}></div>
          <span>Derrota (L)</span>
        </div>
      </div>
    </Card>
  );
};

export default CompetitionStandings;










