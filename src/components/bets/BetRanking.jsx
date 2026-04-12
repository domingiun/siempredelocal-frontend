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

      // Auto-seleccionar la última fecha finalizada si no viene betDateId externo
      if (!betDateId) {
        const lastFinished = ordered.find(d => {
          const s = normalizeMatchStatus(d.status);
          return s === 'finished' || s.includes('finalizada') || s.includes('finalizado');
        });
        if (lastFinished) setSelectedBetDateId(lastFinished.id);
      }
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
      title: 'Pos',
      dataIndex: 'position',
      key: 'position',
      render: (position) => (
        <div style={{ textAlign: 'center', width: 28 }}>
          {getPositionIcon(position)}
        </div>
      ),
      width: 44,
    },
    {
      title: 'Usuario',
      key: 'user',
      render: (_, record) => {
        const isWinner = record.position === 1 && record.points >= 13;
        const avatarSrc = getAvatarSrc(
          record.user_id === user?.id ? user?.avatar_url : userAvatars[record.user_id]
        );
        return (
          <Space size={6}>
            <Avatar
              size={26}
              src={avatarSrc}
              icon={!avatarSrc ? <UserOutlined /> : undefined}
              style={{ backgroundColor: record.user_id === user?.id ? '#1890ff' : '#d9d9d9', flexShrink: 0 }}
            />
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: record.user_id === user?.id ? 700 : 400 }}>
                  {record.username}
                </span>
                {record.user_id === user?.id && (
                  <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', lineHeight: '15px', margin: 0 }}>Tú</Tag>
                )}
                {isWinner && (
                  <Tag color="gold" style={{ fontSize: 10, padding: '0 4px', lineHeight: '15px', margin: 0 }}>Ganador</Tag>
                )}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Pts',
      dataIndex: 'points',
      key: 'points',
      render: (points, record) => {
        const isWinner = record.position === 1 && points >= 13;
        return (
          <Badge
            count={points}
            style={{
              backgroundColor: isWinner ? '#d97706' : points >= 8 ? '#52c41a' : '#1890ff',
              fontSize: '13px',
            }}
          />
        );
      },
      width: 56,
    },
    {
      title: 'Premio',
      key: 'prize',
      responsive: ['md'],
      render: (_, record) => {
        if (record.position === 1 && record.points >= 13) {
          return (
            <Text strong style={{ color: '#52c41a', fontSize: 12 }}>
              ${Number(prizePaidTotal || 0).toLocaleString()}
            </Text>
          );
        }
        return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
      },
      width: 100,
    },
    {
      title: 'Exactos',
      dataIndex: 'exact_scores',
      key: 'exact_predictions',
      responsive: ['md'],
      render: (exact, record) => (
        <Space size={3}>
          <FireOutlined style={{ fontSize: 11 }} />
          <Text style={{ fontSize: 12 }}>{(exact ?? record.exact_predictions ?? 0)}/10</Text>
        </Space>
      ),
      width: 80,
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
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 4px 12px rgba(245,158,11,0.4)'
          }}>
            <TrophyOutlined style={{ color: '#fff' }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Ranking — {betDate?.name || '...'}
            </Title>
          </div>
        </div>

        {dateOptions.length > 0 && (
          <Select
            style={{ width: '100%', maxWidth: 320 }}
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
        )}
      </div>

      {/* Card posición del usuario */}
      {userRanking && (
        <div style={{
          marginBottom: 20,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f2557 0%, #1e3a8a 50%, #0f766e 100%)',
          padding: '20px 24px',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(30,58,138,0.35)',
        }}>
          {/* orbs decorativos */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(14,165,233,0.15)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: 80, width: 70, height: 70, borderRadius: '50%', background: 'rgba(20,184,166,0.12)' }} />

          <Row align="middle" gutter={[16, 12]}>
            {/* Posición */}
            <Col flex="none">
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'rgba(255,255,255,0.12)',
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{userPosition}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 1 }}>LUGAR</span>
              </div>
            </Col>

            {/* Stats */}
            <Col flex="auto">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                Tu posición
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {userRanking.points}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>puntos</span>
                <span style={{ fontSize: 13, color: '#67e8f9', fontWeight: 600, marginLeft: 4 }}>
                  · {(userRanking.exact_scores ?? userRanking.exact_predictions ?? 0)} exactos
                </span>
              </div>
            </Col>

            {/* Badge estado */}
            <Col flex="none">
              {userRanking.points >= 13 && userPosition === 1 ? (
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  borderRadius: 10, padding: '8px 16px',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 4px 14px rgba(245,158,11,0.5)',
                }}>
                  <TrophyOutlined style={{ color: '#fff', fontSize: 16 }} />
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>GANADOR</span>
                </div>
              ) : (
                <div style={{
                  background: userRanking.points >= 13 ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${userRanking.points >= 13 ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 10, padding: '8px 14px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {userRanking.points >= 13 ? 'Calificado' : 'Meta'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: userRanking.points >= 13 ? '#34d399' : '#fff' }}>
                    {userRanking.points >= 13 ? '✓ Premio' : `${13 - userRanking.points} pts más`}
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </div>
      )}

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
        <>
          <div style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 6, textAlign: 'right' }}>
            Toca una fila para ver el pronóstico
          </div>
          <Table
            columns={columns}
            dataSource={ranking}
            rowKey="bet_id"
            pagination={{ pageSize: 50 }}
            size="small"
            onRow={(record) => ({
              onClick: () => openBetPreview(record),
              style: { cursor: 'pointer' },
            })}
          />
        </>
      )}

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        title={null}
        width={600}
        style={{ top: 20 }}
        styles={{ body: { padding: 0 } }}
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : previewPredictions.length === 0 ? (
          <div style={{ padding: 24 }}>
            <Alert type="info" showIcon message="No hay pronósticos para mostrar." />
          </div>
        ) : (
          <div style={{ background: isDark ? '#0a0f16' : '#f8fafc' }}>
            {/* Header del modal */}
            <div style={{
              background: 'linear-gradient(135deg, #0f2557 0%, #1e3a8a 100%)',
              padding: '20px 24px',
              borderRadius: '8px 8px 0 0',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Pronóstico de
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                  {previewBet?.username || 'Usuario'}
                </span>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 10, padding: '6px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <TrophyOutlined style={{ color: '#fbbf24' }} />
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>
                    {previewPredictions.reduce((s, p) => s + (p.points || 0), 0)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>pts</span>
                </div>
              </div>
            </div>

            {/* Lista de predicciones */}
            <div style={{ padding: '12px 16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {previewPredictions.map((row, idx) => {
                const match = row.match;
                const home = match?.home_team?.name || match?.home_team || '?';
                const away = match?.away_team?.name || match?.away_team || '?';
                const homeLogo = match?.home_team?.logo_url || match?.home_logo;
                const awayLogo = match?.away_team?.logo_url || match?.away_logo;
                const result = row.finished && match ? `${match.home_score} - ${match.away_score}` : null;
                const pred = `${row.predicted_home_score} - ${row.predicted_away_score}`;
                const pts = row.points || 0;
                const ptColor = pts === 3 ? '#22c55e' : pts === 1 ? '#60a5fa' : '#475569';
                const ptBg   = pts === 3 ? 'rgba(34,197,94,0.15)' : pts === 1 ? 'rgba(96,165,250,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)');

                return (
                  <div key={`${row.match_id}-${idx}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    marginBottom: 8,
                    borderRadius: 12,
                    background: isDark ? '#0f1824' : '#fff',
                    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                  }}>
                    {/* Nº */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', width: 18, flexShrink: 0, textAlign: 'center' }}>
                      {idx + 1}
                    </div>

                    {/* Local */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 44, flexShrink: 0 }}>
                      {homeLogo
                        ? <img src={homeLogo} alt={home} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                        : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94a3b8' }}>{home.charAt(0)}</div>
                      }
                      <span style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', maxWidth: 44, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{home}</span>
                    </div>

                    {/* Scores */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      {result && (
                        <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? '#e2e8f0' : '#0f172a', letterSpacing: 1 }}>
                          {result}
                        </div>
                      )}
                      <div style={{
                        fontSize: 11,
                        color: isDark ? '#94a3b8' : '#64748b',
                      }}>
                        Pronóstico: <strong>{pred}</strong>
                      </div>
                    </div>

                    {/* Visitante */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 44, flexShrink: 0 }}>
                      {awayLogo
                        ? <img src={awayLogo} alt={away} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                        : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94a3b8' }}>{away.charAt(0)}</div>
                      }
                      <span style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', maxWidth: 44, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{away}</span>
                    </div>

                    {/* Puntos */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: ptBg, border: `1px solid ${ptColor}40`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: ptColor, lineHeight: 1 }}>{pts}</span>
                      <span style={{ fontSize: 8, color: ptColor, fontWeight: 600, opacity: 0.8 }}>pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BetRanking;
