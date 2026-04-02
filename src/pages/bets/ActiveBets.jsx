// frontend/src/pages/bets/ActiveBets.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Card, Typography, Tag, Spin, Alert, Space, Collapse, DatePicker, Divider, Row, Col, Switch } from 'antd';
import { FireOutlined, TrophyOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import betService from '../../services/betService';
import matchService from '../../services/matchService';
import { calculatePredictionPoints } from '../../utils/betCalculations';
import { formatDateTimeShort as formatDateTimeShortUTC, formatForInputUTC } from '../../utils/dateFormatter';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ActiveBets = () => {
  const { user } = useAuth();
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserBets();
    }
  }, [user]);

  const fetchUserBets = async () => {
    setLoading(true);
    try {
      const response = await betService.getUserBets(user.id);
      const rawBets = response.data || [];
      const betDateIds = Array.from(new Set(rawBets.map(b => b.bet_date_id)));
      const betDateNameMap = {};
      const betDateStatusMap = {};
      await Promise.all(
        betDateIds.map(async (betDateId) => {
          try {
            const res = await betService.getBetDateDetails(betDateId);
            betDateNameMap[betDateId] = res.data?.name || `Fecha #${betDateId}`;
            const resolvedStatus = deriveBetDateStatus(res.data);
            betDateStatusMap[betDateId] = resolvedStatus;
          } catch (error) {
            betDateNameMap[betDateId] = `Fecha #${betDateId}`;
            betDateStatusMap[betDateId] = '';
          }
        })
      );
      const matchIds = Array.from(
        new Set(
          rawBets.flatMap(bet => (bet.predictions || []).map(p => p.match_id))
        )
      );
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

      const enrichedBets = rawBets.map(bet => {
        const predictions = (bet.predictions || []).map(pred => {
          const match = matchMap[pred.match_id];
          const status = match?.status ? String(match.status).toLowerCase() : '';
          const isFinished = status === 'finalizado' || status === 'finished';
          const hasResult = isFinished && match && match.home_score !== null && match.away_score !== null;
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
            isFinished,
            points
          };
        });

        const totalPoints = predictions.reduce((sum, p) => sum + (p.points || 0), 0);
        return {
          ...bet,
          bet_date_name: betDateNameMap[bet.bet_date_id] || bet.bet_date_name,
          bet_date_status: betDateStatusMap[bet.bet_date_id] || bet.bet_date_status,
          predictions,
          totalPoints
        };
      });

      setBets(enrichedBets);
    } catch (error) {
      console.error('Error cargando pronósticos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchStatusInfo = (status) => {
    const statusConfig = {
      Programado: {
        label: 'Programado',
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : '#bae7ff',
        borderColor: isDark ? 'rgba(59, 130, 246, 0.45)' : '#1890ff',
        textColor: isDark ? '#93c5fd' : '#003a8c',
      },
      Finalizado: {
        label: 'Finalizado',
        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : '#dcfcae',
        borderColor: isDark ? 'rgba(34, 197, 94, 0.45)' : '#8ccf2d',
        textColor: isDark ? '#86efac' : '#569101'
      },
      'En Juego': {
        label: 'En Juego',
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#d9f7be',
        borderColor: isDark ? 'rgba(16, 185, 129, 0.45)' : '#52c41a',
        textColor: isDark ? '#6ee7b7' : '#135200'
      },
      Cancelado: {
        label: 'Cancelado',
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#ffccc7',
        borderColor: isDark ? 'rgba(239, 68, 68, 0.45)' : '#f5222d',
        textColor: isDark ? '#fca5a5' : '#820014'
      }
    };

    if (!status) {
      return {
        label: 'Desconocido',
        backgroundColor: isDark ? '#111b2a' : '#f5f5f5',
        borderColor: isDark ? '#1f2b3a' : '#d9d9d9',
        textColor: isDark ? '#e6edf3' : '#000000'
      };
    }

    const statusLower = String(status).toLowerCase().trim();

    if (statusLower.includes('programado') || statusLower === 'scheduled') {
      return statusConfig.Programado;
    }
    if (statusLower.includes('finalizado') || statusLower === 'finished') {
      return statusConfig.Finalizado;
    }
    if (statusLower.includes('curso') || statusLower.includes('progress')) {
      return statusConfig['En Juego'];
    }
    if (statusLower.includes('aplazado') || statusLower === 'postponed') {
      return {
        label: 'Aplazado',
        backgroundColor: isDark ? 'rgba(249, 115, 22, 0.18)' : '#fff7e6',
        borderColor: isDark ? 'rgba(249, 115, 22, 0.45)' : '#fa8c16',
        textColor: isDark ? '#fdba74' : '#873800'
      };
    }
    if (statusLower.includes('cancelado') || statusLower === 'cancelled') {
      return statusConfig.Cancelado;
    }

    return {
      label: status,
      backgroundColor: isDark ? '#111b2a' : '#f5f5f5',
      borderColor: isDark ? '#1f2b3a' : '#d9d9d9',
      textColor: isDark ? '#e6edf3' : '#000000'
    };
  };

  const getBetDateStatusTag = (status) => {
    const value = String(status || '').toLowerCase().trim();
    if (value === 'open' || value.includes('abierta')) {
      return { label: 'Abierta', color: 'green' };
    }
    if (value === 'closed' || value.includes('cerrada')) {
      return { label: 'Cerrada', color: 'orange' };
    }
    if (value === 'finished' || value.includes('finalizada')) {
      return { label: 'Finalizada', color: 'blue' };
    }
    if (value === 'cancelled' || value.includes('cancelada')) {
      return { label: 'Cancelada', color: 'red' };
    }
    return { label: status || 'Desconocida', color: 'default' };
  };

  const normalizeMatchStatus = (status) => {
    if (!status) return '';
    return String(status).toLowerCase().trim();
  };

  const isMatchFinished = (status) => {
    const normalized = normalizeMatchStatus(status);
    return normalized === 'finished' || normalized.includes('finalizado');
  };

  const deriveBetDateStatus = (betDate) => {
    if (!betDate) return '';
    const matches = betDate.matches || [];
    if (matches.length === 0) return betDate.status || '';

    const allFinished = matches.every(m => isMatchFinished(m.status));
    if (allFinished) return 'finished';

    const now = new Date();
    const hasPastMatch = matches.some(m => {
      if (!m.match_date) return false;
      const matchDate = new Date(m.match_date);
      return matchDate < now;
    });

    if (hasPastMatch) return 'closed';
    return betDate.status || 'open';
  };

  const groupedBets = useMemo(() => {
    const grouped = {};
    bets.forEach(bet => {
      const key = bet.bet_date_id;
      if (!grouped[key]) {
        grouped[key] = {
          bet_date_id: bet.bet_date_id,
          bet_date_name: bet.bet_date_name || `Fecha No.${bet.bet_date_id}`,
          bet_date_status: bet.bet_date_status,
          items: [],
        };
      }
      grouped[key].items.push(bet);
    });

    const groups = Object.values(grouped).map(group => {
      const totalBets = group.items.length;
      const totalPoints = group.items.reduce((sum, b) => sum + (b.totalPoints || 0), 0);
      const lastBetDate = group.items
        .map(b => new Date(b.submitted_at || b.created_at).getTime())
        .filter(Boolean)
        .sort((a, b) => b - a)[0];
      return {
        ...group,
        totalBets,
        totalPoints,
        lastBetDate: lastBetDate ? new Date(lastBetDate) : null
      };
    });

    return groups.sort((a, b) => {
      const aTime = a.lastBetDate ? a.lastBetDate.getTime() : 0;
      const bTime = b.lastBetDate ? b.lastBetDate.getTime() : 0;
      return bTime - aTime;
    });
  }, [bets]);

  const filteredGroups = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return groupedBets;
    const start = dateRange[0].startOf('day');
    const end = dateRange[1].endOf('day');
    return groupedBets
      .map(group => {
        const items = group.items.filter(bet => {
          const date = bet.submitted_at || bet.created_at;
          if (!date) return false;
          const d = new Date(date);
          return d >= start.toDate() && d <= end.toDate();
        });
        return { ...group, items };
      })
      .filter(group => group.items.length > 0);
  }, [groupedBets, dateRange]);

  return (
    <div className={isDark ? 'active-bets active-bets--dark' : 'active-bets'} style={{ padding: '24px' }}>

      <style>{`
        .active-bets {
          min-height: 100vh;
        }
        .active-bets--dark {
          background: linear-gradient(180deg, #0b0f16 0%, #0f1824 100%);
          color: #e6edf3;
        }
        .active-bets--dark .ant-card {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .active-bets--dark .ant-card-head {
          background: #0c141f;
          border-bottom-color: #1f2b3a;
        }
        .active-bets--dark .ant-card-head-title,
        .active-bets--dark .ant-card-extra {
          color: #e6edf3;
        }
        .active-bets--dark .ant-typography,
        .active-bets--dark .ant-typography-secondary {
          color: #cbd5e1;
        }
        .active-bets--dark .ant-divider {
          border-color: #1f2b3a;
        }
        .active-bets--dark .ant-collapse {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .active-bets--dark .ant-collapse-header {
          color: #e6edf3;
        }
        .active-bets--dark .ant-collapse-content {
          background: #0c141f;
          border-top-color: #1f2b3a;
        }
        .active-bets--dark .ant-alert {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .active-bets--dark .ant-alert-message,
        .active-bets--dark .ant-alert-description {
          color: #e6edf3;
        }
        .active-bets--dark .ant-picker {
          background: #0c141f;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .active-bets--dark .ant-picker-input > input {
          color: #e6edf3;
        }
        .active-bets--dark .ant-picker-input > input::placeholder {
          color: #9fb0c2;
        }
        .active-bets--dark .toggle-dark {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .active-bets--dark .toggle-dark .ant-switch-inner .ant-switch-inner-checked {
          color: #93c5fd;
        }
        .active-bets--dark .ant-tag {
          background: #111b2a;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .active-bets--dark .ant-tag-green {
          background: rgba(34, 197, 94, 0.18);
          border-color: rgba(34, 197, 94, 0.35);
          color: #86efac;
        }
        .active-bets--dark .ant-tag-blue {
          background: rgba(59, 130, 246, 0.18);
          border-color: rgba(59, 130, 246, 0.35);
          color: #93c5fd;
        }
        .active-bets--dark .ant-tag-orange {
          background: rgba(249, 115, 22, 0.18);
          border-color: rgba(249, 115, 22, 0.35);
          color: #fdba74;
        }
        .active-bets--dark .ant-tag-red {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }
      `}</style>

      <Card style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src="/siempredelocal-logo.png"
          alt="SiempreDeLocal"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            maxWidth: '70%',
            height: 'auto',
            opacity: 0.08,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Title level={2}>
            <FireOutlined style={{ marginRight: 8 }} />
            Mis Pronósticos
          </Title>

          <Row justify="end" align="middle" gutter={[12, 12]} style={{ marginTop: 4 }}>
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

          <Divider />
          
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <Alert
              title="No tienes pronósticos activos"
              description="¡Haz pronósticos en alguna fecha disponible para aparecer aquí!"
              type="info"
              showIcon
            />
          ) : (
            <Collapse
              accordion
              items={filteredGroups.map(group => ({
                key: String(group.bet_date_id),
              label: (
                <Space wrap>
                  <Text strong>{group.bet_date_name}</Text>
                  <Tag color="green">
                    {group.totalBets} pronósticos
                  </Tag>
                  {group.bet_date_status ? (
                    <Tag color={getBetDateStatusTag(group.bet_date_status).color}>
                      {getBetDateStatusTag(group.bet_date_status).label}
                    </Tag>
                  ) : null}
                </Space>
              ),
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {group.items.map(bet => (
                      <Card key={bet.id} size="small">
                        <Space wrap>
                          <span
                            style={{
                              background: isDark ? '#0c141f' : 'linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 100%)',
                              border: isDark ? '1px solid #1f2b3a' : '1px solid #91caff',
                              color: isDark ? '#93c5fd' : '#0958d9',
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontWeight: 600,
                              fontSize: 12
                            }}
                          >
                            <strong>Pronóstico No. {bet.id}</strong>
                          </span>
                          <Tag color="blue" style={{ fontWeight: 700, fontSize: 14, background: '#0958d9', color: '#fff', borderColor: '#0958d9' }}>
                            <TrophyOutlined /> {bet.totalPoints || 0} puntos
                          </Tag>
                          <Tag color="green">
                            <CalendarOutlined /> {new Date(bet.submitted_at || bet.created_at).toLocaleDateString()}
                          </Tag>
                        </Space>

                        <div style={{ marginTop: 8 }}>
                          <Row gutter={[12, 12]}>
                            {[0, 1].map((columnIndex) => {
                              const sortedPredictions = [...(bet.predictions || [])].sort((a, b) => {
                                const aTime = a.match?.match_date ? new Date(a.match.match_date).getTime() : Number.POSITIVE_INFINITY;
                                const bTime = b.match?.match_date ? new Date(b.match.match_date).getTime() : Number.POSITIVE_INFINITY;
                                return aTime - bTime;
                              });
                              const columnPredictions = sortedPredictions.slice(columnIndex * 5, columnIndex * 5 + 5);
                              return (
                                <Col key={`col-${bet.id}-${columnIndex}`} xs={24} md={12}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {columnPredictions.map((pred, index) => {
                                      const match = pred.match;
                                      const hasResult = pred.isFinished && match && match.home_score !== null && match.away_score !== null;
                                      const homeLogo = match?.home_team?.logo_url;
                                      const awayLogo = match?.away_team?.logo_url;
                                      return (
                                        <Card key={`${bet.id}-${pred.match_id}-${columnIndex}-${index}`} size="small">
                                          <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                                            <Space align="center" wrap>
                                              {homeLogo ? (
                                                <img
                                                  src={homeLogo}
                                                  alt={match?.home_team?.name || 'Local'}
                                                  style={{ width: 32, height: 32, borderRadius: '50%' }}
                                                />
                                              ) : null}
                                              <Text strong>
                                                {match ? `${match.home_team?.name || ''} vs ${match.away_team?.name || ''}` : `Partido ${pred.match_id}`}
                                              </Text>
                                              {awayLogo ? (
                                                <img
                                                  src={awayLogo}
                                                  alt={match?.away_team?.name || 'Visitante'}
                                                  style={{ width: 32, height: 32, borderRadius: '50%' }}
                                                />
                                              ) : null}
                                            </Space>
                                            <Space size={8} align="center" wrap>
                                              {match?.match_date && (
                                                <Text type="secondary">
                                                  {formatDateTimeShortUTC(formatForInputUTC(match.match_date))}
                                                </Text>
                                              )}
                                              <Space size={6} align="center" wrap>
                                                <Text type="secondary"><strong>Estado:</strong></Text>
                                                <Tag
                                                  style={{
                                                    margin: 0,
                                                    border: `1px solid ${getMatchStatusInfo(match?.status).borderColor}`,
                                                    color: getMatchStatusInfo(match?.status).textColor,
                                                    backgroundColor: getMatchStatusInfo(match?.status).backgroundColor
                                                  }}
                                                >
                                                  {getMatchStatusInfo(match?.status).label}
                                                </Tag>
                                              </Space>
                                            </Space>
                                            <Text>
                                              Tu pronóstico: <strong>{pred.predicted_home_score} - {pred.predicted_away_score}</strong>
                                            </Text>
                                            {hasResult ? (
                                              <Text>
                                                <strong>Resultado del Partido: • {match.home_score} - {match.away_score}</strong> • 
                                                <Tag color={pred.points === 3 ? 'green' : pred.points === 1 ? 'blue' : 'default'} style={{ marginLeft: 8, fontWeight: 700, fontSize: 14 }}>
                                                  {pred.points} pts
                                                  {pred.points === 3 && (
                                                    <span style={{ marginLeft: 6, color: '#52c41a' }}>Excelente</span>
                                                  )}
                                                  {pred.points === 1 && (
                                                    <span style={{ marginLeft: 6, color: '#1677ff' }}>Muy bien!</span>
                                                  )}
                                                </Tag>
                                              </Text>
                                            ) : (
                                              <Text type="secondary">Resultado pendiente</Text>
                                            )}
                                          </Space>
                                        </Card>
                                      );
                                    })}
                                  </div>
                                </Col>
                              );
                            })}
                          </Row>
                        </div>
                      </Card>
                    ))}
                  </div>
                )
              }))}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default ActiveBets;
