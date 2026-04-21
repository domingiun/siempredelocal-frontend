// frontend/src/pages/bets/CommunityPredictionsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Typography, Spin, Alert, Select, Avatar, Tag, Collapse, Table,
  Row, Col, Card, Statistic, Empty, Grid
} from 'antd';
import {
  TeamOutlined, TrophyOutlined, FireOutlined,
  CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import betService from '../../services/betService';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const CommunityPredictionsPage = () => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [betdates, setBetdates] = useState([]);
  const [selectedBetdateId, setSelectedBetdateId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(true);
  const [error, setError] = useState(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    betService.getBetDates().then(res => {
      const all = res?.data || [];
      // Only show closed or finished dates
      const closedDates = all
        .filter(bd => bd.status === 'closed' || bd.status === 'finished')
        .sort((a, b) => new Date(b.close_datetime || 0) - new Date(a.close_datetime || 0));
      setBetdates(closedDates);
      if (closedDates.length > 0) setSelectedBetdateId(closedDates[0].id);
    }).catch(() => {}).finally(() => setLoadingDates(false));
  }, []);

  useEffect(() => {
    if (!selectedBetdateId) return;
    setLoading(true);
    setError(null);
    betService.getCommunityPredictions(selectedBetdateId)
      .then(res => setData(res?.data || null))
      .catch(err => {
        const msg = err?.response?.data?.detail || 'Error al cargar los pronósticos';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [selectedBetdateId]);

  const getAvatarSrc = (url) => {
    if (!url) return undefined;
    return url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
  };

  const rankColor = (rank) => {
    if (rank === 1) return '#f59e0b';
    if (rank === 2) return '#94a3b8';
    if (rank === 3) return '#cd7f32';
    return isDark ? '#4b6280' : '#6b7280';
  };

  const getPredictionResult = (pred) => {
    const st = String(pred.match_status || '').toLowerCase();
    const isFinished = st.includes('finalizado') || st === 'finished';
    if (!isFinished) return 'pending';
    if (pred.points === 3) return 'exact';
    if (pred.points === 1) return 'partial';
    return 'miss';
  };

  const resultIcon = (result) => {
    if (result === 'exact') return <CheckCircleOutlined style={{ color: '#22c55e' }} />;
    if (result === 'partial') return <CheckCircleOutlined style={{ color: '#f59e0b' }} />;
    if (result === 'miss') return <CloseCircleOutlined style={{ color: '#ef4444' }} />;
    return <MinusCircleOutlined style={{ color: '#94a3b8' }} />;
  };

  const bg = isDark ? '#0a0f16' : '#f0f4f8';
  const cardBg = isDark ? '#0f1824' : '#ffffff';
  const border = isDark ? '#1f2b3a' : '#e2e8f0';
  const textColor = isDark ? '#e6edf3' : '#1a202c';
  const subtleColor = isDark ? '#94a3b8' : '#6b7280';

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: isMobile ? 12 : 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ color: textColor, marginBottom: 4 }}>
            <TeamOutlined style={{ marginRight: 10, color: '#3b82f6' }} />
            Pronósticos de la Comunidad
          </Title>
          <Text style={{ color: subtleColor }}>
            Ve lo que pronosticaron todos los participantes en cada fecha cerrada
          </Text>
        </div>

        {/* Selector de fecha */}
        <Card
          style={{ background: cardBg, border: `1px solid ${border}`, marginBottom: 20 }}
          bodyStyle={{ padding: '16px 20px' }}
        >
          <Row gutter={16} align="middle">
            <Col>
              <Text strong style={{ color: textColor }}>Fecha:</Text>
            </Col>
            <Col flex="auto">
              {loadingDates ? (
                <Spin size="small" />
              ) : betdates.length === 0 ? (
                <Text style={{ color: subtleColor }}>No hay fechas cerradas aún</Text>
              ) : (
                <Select
                  value={selectedBetdateId}
                  onChange={setSelectedBetdateId}
                  style={{ minWidth: 220 }}
                  size="large"
                >
                  {betdates.map(bd => (
                    <Option key={bd.id} value={bd.id}>
                      {bd.name}
                      <Tag
                        style={{ marginLeft: 8, fontSize: 10 }}
                        color={bd.status === 'finished' ? 'blue' : 'orange'}
                      >
                        {bd.status === 'finished' ? 'Finalizada' : 'Cerrada'}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              )}
            </Col>
            {data && (
              <Col>
                <Statistic
                  title={<span style={{ color: subtleColor, fontSize: 12 }}>Participantes</span>}
                  value={data.total_participants}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#3b82f6', fontSize: 20 }}
                />
              </Col>
            )}
          </Row>
        </Card>

        {/* Content */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" tip="Cargando pronósticos..." />
          </div>
        )}

        {error && !loading && (
          <Alert type="warning" message={error} showIcon style={{ marginBottom: 16 }} />
        )}

        {!loading && !error && data && data.participants.length === 0 && (
          <Empty description="Nadie participó en esta fecha" />
        )}

        {!loading && !error && data && data.participants.length > 0 && (
          <Collapse
            accordion={false}
            bordered={false}
            style={{ background: 'transparent' }}
          >
            {data.participants.map((participant, idx) => {
              const rank = participant.rank ?? idx + 1;
              const exact = participant.predictions.filter(p => p.points === 3).length;
              const partial = participant.predictions.filter(p => p.points === 1).length;

              const panelHeader = (
                <Row align="middle" gutter={12} wrap={false}>
                  <Col>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: rankColor(rank),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0
                    }}>
                      {rank}
                    </div>
                  </Col>
                  <Col>
                    <Avatar size={32} src={getAvatarSrc(participant.avatar_url)}>
                      {participant.username?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </Col>
                  <Col flex="auto">
                    <Text strong style={{ color: textColor }}>{participant.username}</Text>
                  </Col>
                  <Col>
                    <Tag color="blue" icon={<TrophyOutlined />}>
                      {participant.total_points} pts
                    </Tag>
                  </Col>
                  {!isMobile && (
                    <>
                      <Col>
                        <Tag color="green">✓ Exacto: {exact}</Tag>
                      </Col>
                      <Col>
                        <Tag color="gold">~ Ganador: {partial}</Tag>
                      </Col>
                    </>
                  )}
                </Row>
              );

              const columns = [
                {
                  title: 'Partido',
                  key: 'match',
                  render: (_, row) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {row.home_logo && <img src={getAvatarSrc(row.home_logo)} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
                      <Text style={{ fontSize: 12, color: textColor }}>{row.home_team}</Text>
                      <Text style={{ color: subtleColor, fontSize: 11 }}>vs</Text>
                      <Text style={{ fontSize: 12, color: textColor }}>{row.away_team}</Text>
                      {row.away_logo && <img src={getAvatarSrc(row.away_logo)} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
                    </div>
                  ),
                  responsive: ['md'],
                },
                {
                  title: 'Pronóstico',
                  key: 'prediction',
                  align: 'center',
                  render: (_, row) => (
                    <Tag color="blue" style={{ fontWeight: 700, fontSize: 13 }}>
                      {row.predicted_home} - {row.predicted_away}
                    </Tag>
                  ),
                },
                {
                  title: 'Real',
                  key: 'actual',
                  align: 'center',
                  render: (_, row) => {
                    const st = String(row.match_status || '').toLowerCase();
                    const isFinished = st.includes('finalizado') || st === 'finished';
                    if (!isFinished) return <Tag>Pendiente</Tag>;
                    return (
                      <Tag color="default" style={{ fontWeight: 700, fontSize: 13 }}>
                        {row.actual_home ?? '-'} - {row.actual_away ?? '-'}
                      </Tag>
                    );
                  },
                },
                {
                  title: '',
                  key: 'result',
                  width: 36,
                  align: 'center',
                  render: (_, row) => resultIcon(getPredictionResult(row)),
                },
              ];

              // Mobile: team names in one row
              const mobileColumns = [
                {
                  title: 'Partido',
                  key: 'match',
                  render: (_, row) => (
                    <div>
                      <Text style={{ fontSize: 11, color: textColor }}>{row.home_team} vs {row.away_team}</Text>
                    </div>
                  ),
                },
                ...columns.slice(1),
              ];

              return (
                <Panel
                  key={participant.bet_id}
                  header={panelHeader}
                  style={{
                    marginBottom: 8,
                    background: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  <Table
                    dataSource={participant.predictions.map(p => ({ ...p, key: p.match_id }))}
                    columns={isMobile ? mobileColumns : columns}
                    pagination={false}
                    size="small"
                    style={{ background: 'transparent' }}
                  />
                  {isMobile && (
                    <Row gutter={8} style={{ marginTop: 8 }}>
                      <Col><Tag color="green">Exacto: {exact}</Tag></Col>
                      <Col><Tag color="gold">Ganador: {partial}</Tag></Col>
                    </Row>
                  )}
                </Panel>
              );
            })}
          </Collapse>
        )}
      </div>
    </div>
  );
};

export default CommunityPredictionsPage;
