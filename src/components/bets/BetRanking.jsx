// frontend/src/components/bets/BetRanking.jsx
import React, { useState, useEffect } from 'react';
import {
  Table, Card, Typography, Tag, Avatar, Space,
  Badge, Spin, Alert, Row, Col, Button, Modal, Divider, Select, Switch
} from 'antd';
import {
  TrophyOutlined, CrownOutlined,
  FireOutlined, UserOutlined, EyeOutlined
} from '@ant-design/icons';
import betService from '../../services/betService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import matchService from '../../services/matchService';
import { calculatePredictionPoints } from '../../utils/betCalculations';
import { formatDateTimeShortUTC } from '../../utils/dateFormatter';
import userService from '../../services/userService';

const { Title, Text } = Typography;

const BetRanking = ({ betDateId }) => {
  const { user } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [betDate, setBetDate] = useState(null);
  const [isDateFinished, setIsDateFinished] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedBetDateId, setSelectedBetDateId] = useState(betDateId || null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewBet, setPreviewBet] = useState(null);
  const [previewPredictions, setPreviewPredictions] = useState([]);
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  const [userAvatars, setUserAvatars] = useState({});
  const [prizePaidTotal, setPrizePaidTotal] = useState(0);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getAvatarSrc = (avatarUrl) => {
    if (!avatarUrl) return undefined;
    return avatarUrl.startsWith('http') ? avatarUrl : `${apiBaseUrl}${avatarUrl}`;
  };

  useEffect(() => {
    if (betDateId) {
      setSelectedBetDateId(betDateId);
    }
  }, [betDateId]);

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  useEffect(() => {
    if (!selectedBetDateId && availableDates.length > 0) {
      setSelectedBetDateId(availableDates[0].id);
    }
    if (!selectedBetDateId && availableDates.length === 0) {
      setLoading(false);
    }
  }, [availableDates, selectedBetDateId]);

  useEffect(() => {
    if (selectedBetDateId) {
      fetchRanking();
    }
  }, [selectedBetDateId]);

  const normalizeMatchStatus = (status) => {
    if (!status) return '';
    return String(status).toLowerCase().trim();
  };

  const isMatchFinished = (status) => {
    const normalized = normalizeMatchStatus(status);
    return normalized === 'finished' || normalized.includes('finalizado');
  };

  const deriveBetDateFinished = (dateData) => {
    const matches = dateData?.matches || [];
    if (matches.length > 0) {
      return matches.every((m) => isMatchFinished(m.status));
    }

    const status = normalizeMatchStatus(dateData?.status);
    return status === 'finished' || status.includes('finalizado');
  };

  const deriveBetDateStatus = (dateData) => {
    const matches = dateData?.matches || [];
    if (matches.length === 0) {
      return dateData?.status || '';
    }

    const allFinished = matches.every((m) => isMatchFinished(m.status));
    if (allFinished) return 'finished';

    const now = new Date();
    const hasPastMatch = matches.some((m) => {
      if (!m.match_date) return false;
      const matchDate = new Date(m.match_date);
      return matchDate < now;
    });

    if (hasPastMatch) return 'closed';
    return dateData?.status || 'open';
  };

  const getBetDateStatusLabel = (status) => {
    const value = normalizeMatchStatus(status);
    if (!value) return '';
    if (value === 'open' || value.includes('abierta')) return 'Abierta';
    if (value === 'closed' || value.includes('cerrada')) return 'Cerrada';
    if (value === 'finished' || value.includes('finalizada')) return 'Finalizada';
    if (value === 'cancelled' || value.includes('cancelada')) return 'Cancelada';
    return status;
  };

  const fetchRanking = async () => {
    setLoading(true);
    try {
      // Obtener fecha con detalle de partidos para validar estado real.
      const dateRes = await betService.getBetDateDetails(selectedBetDateId);
      const dateData = dateRes.data || {};
      setBetDate(dateData);

      let finished = deriveBetDateFinished(dateData);
      setIsDateFinished(finished);

      if (!finished) {
        setRanking([]);
        return;
      }

      try {
        const rankingRes = await betService.getRanking(selectedBetDateId, { silent404: true });
        const rankingData = rankingRes.data?.data || rankingRes.data || {};
        const list = rankingData.ranking || [];
        setRanking(list);
        setPrizePaidTotal(
          rankingData.prize_paid_total ??
          rankingData.total_prize ??
          0
        );
        await loadUserAvatars(list);
      } catch (error) {
        const status = error?.response?.status;
        if (status === 400 || status === 404) {
          setRanking([]);
          setPrizePaidTotal(0);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error cargando ranking:', error);
      setRanking([]);
      setIsDateFinished(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDates = async () => {
    try {
      const response = await betService.getBetDates({ limit: 100 });
      const dates = response.data || [];
      const enriched = await Promise.all(
        dates.map(async (date) => {
          try {
            const detailRes = await betService.getBetDateDetails(date.id);
            const detail = detailRes.data || date;
            return { ...date, status: deriveBetDateStatus(detail) };
          } catch (error) {
            return date;
          }
        })
      );
      const ordered = enriched.slice().sort((a, b) => {
        const aTime = a?.start_datetime ? new Date(a.start_datetime).getTime() : (a?.id || 0);
        const bTime = b?.start_datetime ? new Date(b.start_datetime).getTime() : (b?.id || 0);
        return bTime - aTime;
      });
      setAvailableDates(ordered);
    } catch (error) {
      console.error('Error cargando fechas para ranking:', error);
      setAvailableDates([]);
    }
  };

  const loadUserAvatars = async (list) => {
    if (!Array.isArray(list) || list.length === 0) return;
    const ids = Array.from(new Set(list.map((r) => r.user_id).filter(Boolean)));
    const missing = ids.filter((id) => !userAvatars[id]);
    if (missing.length === 0) return;

    try {
      const responses = await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await userService.getUserById(id);
            return { id, avatar_url: res.data?.avatar_url || null };
          } catch (error) {
            return { id, avatar_url: null };
          }
        })
      );
      setUserAvatars((prev) => {
        const next = { ...prev };
        responses.forEach((r) => {
          next[r.id] = r.avatar_url;
        });
        return next;
      });
    } catch (error) {
      // Silencioso: si falla, mantenemos los iconos por defecto
    }
  };

  const openBetPreview = async (record) => {
    const betId = record?.bet_id;
    if (!betId) return;

    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewBet({ bet_id: betId, username: record?.username, user_id: record?.user_id });
    setPreviewPredictions([]);

    try {
      const betRes = await betService.getBetPredictions(betId);
      const predictions = betRes.data || [];

      const matchIds = Array.from(new Set(predictions.map((p) => p.match_id).filter(Boolean)));
      const matchMap = {};
      await Promise.all(
        matchIds.map(async (matchId) => {
          try {
            const res = await matchService.getById(matchId);
            matchMap[matchId] = res.data;
          } catch (error) {
            matchMap[matchId] = null;
          }
        })
      );

      const enriched = predictions.map((pred) => {
        const match = matchMap[pred.match_id];
        const status = match?.status ? String(match.status).toLowerCase() : '';
        const finished = isMatchFinished(status);
        const hasResult = finished && match && match.home_score !== null && match.away_score !== null;
        const points = hasResult
          ? calculatePredictionPoints(
              { home_score: pred.predicted_home_score, away_score: pred.predicted_away_score },
              { home_score: match.home_score, away_score: match.away_score }
            )
          : 0;

        return {
          ...pred,
          match,
          status,
          finished,
          points,
        };
      });

      setPreviewBet({
        bet_id: betId,
        username: record?.username,
        user_id: record?.user_id,
      });
      setPreviewPredictions(enriched);
    } catch (error) {
      console.error('Error cargando pronósticos:', error);
      setPreviewPredictions([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getPositionIcon = (position) => {
    if (position === 1) return <CrownOutlined style={{ color: '#FFD700' }} />;
    if (position === 2) return <TrophyOutlined style={{ color: '#C0C0C0' }} />;
    if (position === 3) return <TrophyOutlined style={{ color: '#CD7F32' }} />;
    return <span>{position}</span>;
  };

  const columns = [
    {
      title: 'Posición',
      dataIndex: 'position',
      key: 'position',
      render: (position) => (
        <div style={{ textAlign: 'center', width: 40 }}>
          {getPositionIcon(position)}
        </div>
      ),
      width: 80,
    },
    {
      title: 'Usuario',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar
            size="small"
            src={getAvatarSrc(
              record.user_id === user?.id ? user?.avatar_url : userAvatars[record.user_id]
            )}
            icon={
              !(record.user_id === user?.id ? user?.avatar_url : userAvatars[record.user_id])
                ? <UserOutlined />
                : undefined
            }
            style={{
              backgroundColor: record.user_id === user?.id ? '#1890ff' : '#d9d9d9'
            }}
          />
          <div>
            <Text strong={record.user_id === user?.id}>
              {record.username}
              {record.user_id === user?.id && (
                <Tag color="blue" style={{ marginLeft: 8 }}>Tu</Tag>
              )}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Puntos',
      dataIndex: 'points',
      key: 'points',
      render: (points) => (
        <Badge
          count={points}
          style={{
            backgroundColor: points >= 13 ? '#52c41a' : '#1890ff',
            fontSize: '14px'
          }}
        />
      ),
      width: 100,
    },
    {
      title: 'Premio',
      key: 'prize',
      render: (_, record) => {
        if (record.position === 1 && record.points >= 13) {
          return (
            <Text strong style={{ color: '#52c41a' }}>
              {Number(prizePaidTotal || 0).toLocaleString()} PTS
            </Text>
          );
        }
        return <Text type="secondary">-</Text>;
      },
      width: 120,
    },
    {
      title: 'Aciertos Exactos',
      dataIndex: 'exact_scores',
      key: 'exact_predictions',
      render: (exact, record) => (
        <Space>
          <FireOutlined />
          <Text>{(exact ?? record.exact_predictions ?? 0)}/10</Text>
        </Space>
      ),
      width: 120,
    },
    {
      title: 'Ver',
      key: 'view',
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => openBetPreview(record)}
        >
          Ver
        </Button>
      ),
      width: 90,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <p>Cargando ranking...</p>
      </div>
    );
  }


  const dateOptions = (() => {
    const list = availableDates.slice();
    if (betDate && !list.some((d) => d.id === betDate.id)) {
      list.unshift(betDate);
    }
    return list;
  })();

  const userPosition = ranking.findIndex(r => r.user_id === user?.id) + 1;
  const userRanking = ranking.find(r => r.user_id === user?.id);

  return (
    <div className={isDark ? 'bet-ranking bet-ranking--dark' : 'bet-ranking'}>
      <style>{`
        .bet-ranking--dark {
          background: radial-gradient(1200px 600px at 10% -10%, #0c141f 0%, #0a0f16 50%, #0a0f14 100%);
          color: #e6edf3;
          padding: 16px;
          border-radius: 12px;
        }
        .bet-ranking--dark .ant-card {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .bet-ranking--dark .ant-card-head {
          border-bottom-color: #1f2b3a;
          background: #0c141f;
        }
        .bet-ranking--dark .ant-card-head-title,
        .bet-ranking--dark .ant-card-extra {
          color: #e6edf3;
        }
        .bet-ranking--dark .ant-typography,
        .bet-ranking--dark .ant-typography-secondary {
          color: #e6edf3;
        }
        .bet-ranking--dark .ant-typography-secondary {
          color: #9fb0c2;
        }
        .bet-ranking--dark .ant-table {
          background: #0f1824;
          color: #e6edf3;
        }
        .bet-ranking--dark .ant-table-container {
          background: #0f1824;
        }
        .bet-ranking--dark .ant-table-thead > tr > th {
          background: #0c141f;
          color: #cbd5e1;
          border-bottom: 1px solid #1f2b3a;
        }
        .bet-ranking--dark .ant-table-tbody > tr > td {
          border-bottom: 1px solid #1f2b3a;
          color: #e6edf3;
        }
        .bet-ranking--dark .ant-table-tbody > tr.ant-table-row:hover > td {
          background: #0f1b2a;
        }
        .bet-ranking--dark .ant-table-placeholder .ant-table-cell {
          background: #0f1824;
          color: #9fb0c2;
        }
        .bet-ranking--dark .ant-pagination-item,
        .bet-ranking--dark .ant-pagination-prev,
        .bet-ranking--dark .ant-pagination-next {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .bet-ranking--dark .ant-pagination-item a {
          color: #e6edf3;
        }
        .bet-ranking--dark .ant-modal-content,
        .bet-ranking--dark .ant-modal-header {
          background: #0f1824;
          color: #e6edf3;
        }
        .bet-ranking--dark .ant-modal-title {
          color: #e6edf3;
        }
        .bet-ranking--dark .ant-divider {
          border-color: #1f2b3a;
        }
        .toggle-dark {
          background: #e5e7eb;
          border-color: #cbd5e1;
        }
        .toggle-dark .ant-switch-inner .ant-switch-inner-unchecked {
          color: #111827;
        }
        .toggle-dark.ant-switch-checked .ant-switch-inner .ant-switch-inner-checked {
          color: #ffffff;
        }
        .bet-ranking--dark .toggle-dark {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .bet-ranking--dark .toggle-dark.ant-switch-checked .ant-switch-inner .ant-switch-inner-checked {
          color: #93c5fd;
        }
        .bet-ranking--dark .ant-tag {
          border-color: #1f2b3a;
          background: #111b28;
          color: #cbd5e1;
        }
        .bet-ranking--dark .ant-badge-count {
          box-shadow: 0 0 0 1px #1f2b3a;
        }
        .bet-ranking--dark .ant-btn {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .bet-ranking--dark .ant-btn:hover {
          background: #162233;
          border-color: #2a3a4f;
          color: #ffffff;
        }
        .bet-ranking--dark .ranking-alert {
          background: #0f1824 !important;
          border-color: #1f2b3a;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
        }
        .bet-ranking--dark .ranking-alert .ant-typography,
        .bet-ranking--dark .ranking-alert .ant-typography-secondary {
          color: #e6edf3;
        }
        .bet-ranking--dark .ranking-alert .ant-typography-secondary {
          color: #9fb0c2;
        }
        @media (max-width: 480px) {
          .bet-ranking {
            padding: 12px;
          }
          .bet-ranking .ant-typography {
            font-size: 13px !important;
          }
          .bet-ranking .ant-typography-secondary,
          .bet-ranking p,
          .bet-ranking small,
          .bet-ranking span {
            font-size: 11.5px !important;
          }
          .bet-ranking .ant-table {
            font-size: 11px;
          }
          .bet-ranking .ant-table-thead > tr > th,
          .bet-ranking .ant-table-tbody > tr > td {
            padding: 6px 8px;
          }
          .bet-ranking .ant-btn {
            font-size: 11px !important;
            padding: 4px 10px !important;
            height: 28px !important;
            border-radius: 8px !important;
          }
          .bet-ranking .ant-btn .anticon {
            font-size: 12px !important;
          }
        }
      `}</style>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={4}>
              <TrophyOutlined style={{ marginRight: 8 }} />
              Ranking - {betDate?.name} 
            </Title>
            <Text>
              Una vez <strong>finalizada la fecha</strong>, podrás ver los resultados de todos los participantes, junto con sus predicciones y su puntuación.
            </Text>
          </Col>

          {dateOptions.length > 0 && (
            <Col span={24}>
              <Row justify="space-between" align="middle" gutter={[12, 12]}>
                <Col>
                  <Space wrap>
                    <Text type="secondary">Selecciona aqui la Fecha de Pronóstico para ver el <strong>Ranking</strong>:</Text>
                    <Select
                      style={{ minWidth: 260 }}
                      value={selectedBetDateId}
                      onChange={(value) => setSelectedBetDateId(value)}
                      options={dateOptions.map((d) => ({
                        value: d.id,
                        label: (() => {
                          const base = d.name || `Fecha #${d.id}`;
                          const statusLabel = getBetDateStatusLabel(d.status);
                          return statusLabel ? `${base} (${statusLabel})` : base;
                        })()
                      }))}
                    />
                  </Space>
                </Col>
                <Col>
                  <Space size="small">
                    <Text type="secondary">Vista oscura</Text>
                    <Switch
                      checked={isDark}
                      onChange={(checked) => setMode(checked ? 'dark' : 'light')}
                      className="toggle-dark"
                      checkedChildren="ON"
                      unCheckedChildren="OFF"
                    />
                  </Space>
                </Col>
              </Row>
            </Col>
          )}

          {userRanking && (
            <Col span={24}>
              <Card
                style={{
                  background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
                  color: 'white'
                }}
              >
                <Row justify="space-between" align="middle">
                  <Col>
                    <Space>
                      <Title level={3} style={{ color: 'white', margin: 0 }}>
                        {userPosition}
                      </Title>
                      <div>
                        <Text strong style={{ color: 'white', display: 'block' }}>
                          Tu posición.
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '18px' }}>
                          {userRanking.points} puntos - {(userRanking.exact_scores ?? userRanking.exact_predictions ?? 0)} aciertos exactos
                        </Text>
                      </div>
                    </Space>
                  </Col>
                  <Col>
                    {userRanking.points >= 13 && userPosition === 1 ? (
                      <Tag color="gold" style={{ fontSize: '16px', padding: '8px 16px' }}>
                        <TrophyOutlined /> GANADOR
                      </Tag>
                    ) : (
                      <Text style={{ color: 'white', fontSize: '14px' }}>
                        {userRanking.points >= 13 ? 'Calificado para premio' : 'Necesitas 13+ puntos'}
                      </Text>
                    )}
                  </Col>
                </Row>
              </Card>
            </Col>
          )}
        </Row>
      </Card>

      {!isDateFinished && (
        <Card
          className="ranking-alert ranking-alert--info"
          style={{
            marginBottom: 16,
            borderLeft: '6px solid #1677ff',
            background: 'linear-gradient(135deg, #eef4ff 0%, #ffffff 100%)',
            boxShadow: '0 10px 24px rgba(24, 119, 255, 0.12)',
            borderRadius: 12
          }}
        >
          <Space align="start">
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#1677ff',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 14px rgba(22, 119, 255, 0.35)'
            }}>
              <EyeOutlined />
            </div>
            <div>
              <Text strong style={{ fontSize: 20 }}>EL RANKING AÚN NO ESTÁ DISPONIBLE PARA ESTA FECHA.</Text>
              <div>
                <Text type="secondary">
                  El ranking se mostrará cuando la fecha esté finalizada, Ahora ya puedes ver las fechas anteriores finalizadas!
                </Text>
              </div>
            </div>
          </Space>
        </Card>
      )}

      {isDateFinished && ranking.length === 0 && (
        <Card
          className="ranking-alert ranking-alert--warn"
          style={{
            marginBottom: 16,
            borderLeft: '6px solid #fa8c16',
            background: 'linear-gradient(135deg, #fff4e6 0%, #ffffff 100%)',
            boxShadow: '0 10px 24px rgba(250, 140, 22, 0.12)',
            borderRadius: 12
          }}
        >
          <Space align="start">
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#fa8c16',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 14px rgba(250, 140, 22, 0.35)'
            }}>
              <FireOutlined />
            </div>
            <div>
              <Text strong style={{ fontSize: 15 }}>Sin apuestas en esta jornada</Text>
              <div>
                <Text type="secondary">
                  Ningún participante realizó pronósticos en esta fecha.
                </Text>
              </div>
            </div>
          </Space>
        </Card>
      )}

      {isDateFinished && ranking.length > 0 && (
        <Table
          columns={columns}
          dataSource={ranking}
          rowKey="bet_id"
          pagination={{ pageSize: 20 }}
          size="small"
          scroll={{ x: 560 }}
        />
      )}

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        title="Pronóstico del usuario"
        width={900}
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : previewPredictions.length === 0 ? (
          <Alert
            type="info"
            showIcon
            title="No hay pronósticos para mostrar."
          />
        ) : (
          <>
            <Space wrap>
              <Tag color="blue">Usuario: {previewBet?.username || 'N/D'}</Tag>
              <Tag color="geekblue">Bet ID: {previewBet?.bet_id}</Tag>
              <Tag color="green">
                Total puntos: {previewPredictions.reduce((sum, p) => sum + (p.points || 0), 0)}
              </Tag>
            </Space>
            <Divider />
            <Table
              size="small"
              pagination={false}
              rowKey={(row, idx) => `${row.match_id}-${idx}`}
              dataSource={previewPredictions}
              columns={[
                {
                  title: 'Partido',
                  key: 'match',
                  render: (_, row) => {
                    const match = row.match;
                    if (!match) return `Partido ${row.match_id}`;
                    const home = match.home_team?.name || match.home_team;
                    const away = match.away_team?.name || match.away_team;
                    const homeLogo = match.home_team?.logo_url || match.home_logo;
                    const awayLogo = match.away_team?.logo_url || match.away_logo;
                    return (
                      <Space align="center" wrap>
                        {homeLogo ? (
                          <img
                            src={homeLogo}
                            alt={home || 'Local'}
                            style={{ width: 28, height: 28, borderRadius: '50%' }}
                          />
                        ) : null}
                        <Text strong>{home}</Text>
                        <Text type="secondary">vs</Text>
                        <Text strong>{away}</Text>
                        {awayLogo ? (
                          <img
                            src={awayLogo}
                            alt={away || 'Visitante'}
                            style={{ width: 28, height: 28, borderRadius: '50%' }}
                          />
                        ) : null}
                      </Space>
                    );
                  },
                },
                {
                  title: 'Fecha',
                  key: 'date',
                  render: (_, row) => {
                    const match = row.match;
                    return match?.match_date ? formatDateTimeShortUTC(match.match_date) : '-';
                  },
                  width: 160,
                },
                {
                  title: 'Pronóstico',
                  key: 'pred',
                  render: (_, row) => (
                    <span>
                      {row.predicted_home_score} - {row.predicted_away_score}
                    </span>
                  ),
                  width: 120,
                },
                {
                  title: 'Resultado',
                  key: 'result',
                  render: (_, row) => {
                    const match = row.match;
                    if (!row.finished || !match) return 'Pendiente';
                    return `${match.home_score} - ${match.away_score}`;
                  },
                  width: 120,
                },
                {
                  title: 'Puntos',
                  key: 'points',
                  render: (_, row) => (
                    <Tag color={row.points === 3 ? 'green' : row.points === 1 ? 'blue' : 'default'}>
                      {row.points} pts
                    </Tag>
                  ),
                  width: 100,
                },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default BetRanking;
