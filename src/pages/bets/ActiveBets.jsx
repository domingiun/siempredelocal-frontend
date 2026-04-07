// frontend/src/pages/bets/ActiveBets.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Typography, Spin, Alert, Collapse } from 'antd';
import { FireOutlined, TrophyOutlined, CalendarOutlined, RightOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import betService from '../../services/betService';
import matchService from '../../services/matchService';
import { calculatePredictionPoints } from '../../utils/betCalculations';
import { formatDateTimeShort as formatDateTimeShortUTC, formatForInputUTC } from '../../utils/dateFormatter';

const { Title, Text } = Typography;

/* ─── helpers de color ─── */
const betDateTagStyle = (status, isDark) => {
  const v = String(status || '').toLowerCase();
  if (v === 'open' || v.includes('abierta'))
    return isDark
      ? { bg: 'rgba(34,197,94,.15)', border: 'rgba(34,197,94,.35)', text: '#86efac', label: 'Abierta' }
      : { bg: '#f6ffed', border: '#b7eb8f', text: '#389e0d', label: 'Abierta' };
  if (v === 'finished' || v.includes('finalizada') || v.includes('finished'))
    return isDark
      ? { bg: 'rgba(96,165,250,.15)', border: 'rgba(96,165,250,.3)', text: '#93c5fd', label: 'Finalizada' }
      : { bg: '#e6f4ff', border: '#91caff', text: '#0958d9', label: 'Finalizada' };
  if (v === 'closed' || v.includes('cerrada'))
    return isDark
      ? { bg: 'rgba(249,115,22,.15)', border: 'rgba(249,115,22,.3)', text: '#fdba74', label: 'Cerrada' }
      : { bg: '#fff7e6', border: '#ffd591', text: '#d46b08', label: 'Cerrada' };
  return isDark
    ? { bg: 'rgba(100,116,139,.15)', border: 'rgba(100,116,139,.3)', text: '#94a3b8', label: status || '—' }
    : { bg: '#f5f5f5', border: '#d9d9d9', text: '#595959', label: status || '—' };
};

const matchStatusStyle = (status, isDark) => {
  const v = String(status || '').toLowerCase();
  if (v.includes('finalizado') || v === 'finished')
    return isDark
      ? { bg: 'rgba(34,197,94,.12)', border: 'rgba(34,197,94,.3)', text: '#86efac', label: 'Finalizado' }
      : { bg: '#f6ffed', border: '#b7eb8f', text: '#389e0d', label: 'Finalizado' };
  if (v.includes('programado') || v === 'scheduled')
    return isDark
      ? { bg: 'rgba(96,165,250,.12)', border: 'rgba(96,165,250,.28)', text: '#93c5fd', label: 'Programado' }
      : { bg: '#e6f4ff', border: '#91caff', text: '#0958d9', label: 'Programado' };
  if (v.includes('curso') || v.includes('progress'))
    return isDark
      ? { bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.28)', text: '#6ee7b7', label: 'En Juego' }
      : { bg: '#f6ffed', border: '#95de64', text: '#135200', label: 'En Juego' };
  return isDark
    ? { bg: 'rgba(100,116,139,.12)', border: 'rgba(100,116,139,.25)', text: '#94a3b8', label: status || '—' }
    : { bg: '#f5f5f5', border: '#d9d9d9', text: '#595959', label: status || '—' };
};

const Pill = ({ s }) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    background: s.bg,
    border: `1px solid ${s.border}`,
    color: s.text,
    lineHeight: '18px',
  }}>
    {s.label}
  </span>
);

/* ─── componente principal ─── */
const ActiveBets = () => {
  const { user } = useAuth();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchUserBets(); }, [user]);

  const isMatchFinished = (s) => {
    const v = String(s || '').toLowerCase().trim();
    return v === 'finished' || v.includes('finalizado');
  };

  const deriveBetDateStatus = (betDate) => {
    if (!betDate) return '';
    const matches = betDate.matches || [];
    if (!matches.length) return betDate.status || '';
    if (matches.every(m => isMatchFinished(m.status))) return 'finished';
    const now = new Date();
    if (matches.some(m => m.match_date && new Date(m.match_date) < now)) return 'closed';
    return betDate.status || 'open';
  };

  const fetchUserBets = async () => {
    setLoading(true);
    try {
      const response = await betService.getUserBets(user.id);
      const rawBets = response.data || [];
      const betDateIds = Array.from(new Set(rawBets.map(b => b.bet_date_id)));

      const betDateNameMap = {};
      const betDateStatusMap = {};
      await Promise.all(betDateIds.map(async (id) => {
        try {
          const res = await betService.getBetDateDetails(id);
          betDateNameMap[id] = res.data?.name || `Fecha #${id}`;
          betDateStatusMap[id] = deriveBetDateStatus(res.data);
        } catch {
          betDateNameMap[id] = `Fecha #${id}`;
          betDateStatusMap[id] = '';
        }
      }));

      const matchIds = Array.from(new Set(
        rawBets.flatMap(b => (b.predictions || []).map(p => p.match_id))
      ));
      const matchMap = {};
      await Promise.all(matchIds.map(async (id) => {
        try { matchMap[id] = (await matchService.getById(id)).data; }
        catch { matchMap[id] = null; }
      }));

      const enriched = rawBets.map(bet => {
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
          return { ...pred, match, status, isFinished, hasResult, points };
        });
        return {
          ...bet,
          bet_date_name: betDateNameMap[bet.bet_date_id] || bet.bet_date_name,
          bet_date_status: betDateStatusMap[bet.bet_date_id] || bet.bet_date_status,
          predictions,
          totalPoints: predictions.reduce((s, p) => s + (p.points || 0), 0),
        };
      });
      setBets(enriched);
    } catch (err) {
      console.error('Error cargando pronósticos:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupedBets = useMemo(() => {
    const grouped = {};
    bets.forEach(bet => {
      if (!grouped[bet.bet_date_id]) {
        grouped[bet.bet_date_id] = {
          bet_date_id: bet.bet_date_id,
          bet_date_name: bet.bet_date_name || `Fecha #${bet.bet_date_id}`,
          bet_date_status: bet.bet_date_status,
          items: [],
        };
      }
      grouped[bet.bet_date_id].items.push(bet);
    });
    return Object.values(grouped)
      .map(g => ({ ...g, totalBets: g.items.length }))
      .sort((a, b) => b.bet_date_id - a.bet_date_id);
  }, [bets]);

  /* ── Render ── */
  const card = isDark
    ? { bg: '#0f1824', border: '#1f2b3a', headerBg: '#0c141f' }
    : { bg: '#ffffff', border: '#e5e7eb', headerBg: '#f8fafc' };

  return (
    <div style={{
      padding: '16px',
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(180deg,#0b0f16 0%,#0f1824 100%)'
        : undefined,
    }}>
      {/* Encabezado */}
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, color: isDark ? '#e6edf3' : undefined }}>
          <FireOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          Mis Pronósticos
        </Title>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
      ) : groupedBets.length === 0 ? (
        <Alert description="¡Haz pronósticos en alguna fecha disponible para aparecer aquí!" type="info" showIcon />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {groupedBets.map(group => {
            const statusStyle = betDateTagStyle(group.bet_date_status, isDark);
            return (
              <Collapse
                key={group.bet_date_id}
                accordion={false}
                style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 12 }}
                expandIcon={({ isActive }) => (
                  <RightOutlined style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', transform: isActive ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
                )}
                items={[{
                  key: String(group.bet_date_id),
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <Text strong style={{ fontSize: 14, color: isDark ? '#e6edf3' : undefined }}>
                        {group.bet_date_name}
                      </Text>
                      <Pill s={{ bg: isDark ? 'rgba(22,119,255,.15)' : '#e6f4ff', border: isDark ? 'rgba(22,119,255,.3)' : '#91caff', text: isDark ? '#60a5fa' : '#0958d9', label: `${group.totalBets} pronósticos` }} />
                      {group.bet_date_status && <Pill s={statusStyle} />}
                    </div>
                  ),
                  style: { background: card.bg, borderRadius: 12 },
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                      {group.items.map(bet => {
                        const sorted = [...(bet.predictions || [])].sort((a, b) => {
                          const at = a.match?.match_date ? new Date(a.match.match_date).getTime() : Infinity;
                          const bt = b.match?.match_date ? new Date(b.match.match_date).getTime() : Infinity;
                          return at - bt;
                        });
                        return (
                          <div key={bet.id}>
                            {/* Sub-encabezado del pronóstico */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '4px 0', borderBottom: `1px solid ${card.border}` }}>
                              <CalendarOutlined style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 13 }} />
                              <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                                {new Date(bet.submitted_at || bet.created_at).toLocaleDateString()}
                              </Text>
                              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 13, color: '#1677ff' }}>
                                <TrophyOutlined />
                                {bet.totalPoints || 0} pts
                              </span>
                            </div>

                            {/* Lista de predicciones */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                              {sorted.map((pred, idx) => {
                                const match = pred.match;
                                const ms = matchStatusStyle(match?.status, isDark);
                                const isLast = idx === sorted.length - 1;
                                const pointColor = pred.points === 3 ? '#52c41a' : pred.points === 1 ? '#1677ff' : isDark ? '#475569' : '#94a3b8';
                                return (
                                  <div
                                    key={`${bet.id}-${pred.match_id}`}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      padding: '7px 0',
                                      borderBottom: isLast ? 'none' : `1px solid ${isDark ? 'rgba(31,43,58,.7)' : '#f1f5f9'}`,
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    {/* Logos */}
                                    {match?.home_team?.logo_url
                                      ? <img src={match.home_team.logo_url} alt="" style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 }} />
                                      : null}

                                    {/* Equipos */}
                                    <Text style={{ fontSize: 11, flex: 1, minWidth: 0, color: isDark ? '#cbd5e1' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {match
                                        ? `${match.home_team?.name || ''} vs ${match.away_team?.name || ''}`
                                        : `Partido ${pred.match_id}`}
                                    </Text>

                                    {/* Pronóstico */}
                                    <Text style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#60a5fa' : '#0958d9', flexShrink: 0 }}>
                                      {pred.predicted_home_score}-{pred.predicted_away_score}
                                    </Text>

                                    {/* Resultado real */}
                                    {pred.hasResult && (
                                      <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#6b7280', flexShrink: 0 }}>
                                        ({match.home_score}-{match.away_score})
                                      </Text>
                                    )}

                                    {/* Estado */}
                                    <Pill s={ms} />

                                    {/* Puntos */}
                                    {pred.isFinished && (
                                      <span style={{ fontSize: 12, fontWeight: 800, color: pointColor, flexShrink: 0, minWidth: 28, textAlign: 'right' }}>
                                        {pred.points}pt
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ),
                }]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveBets;
