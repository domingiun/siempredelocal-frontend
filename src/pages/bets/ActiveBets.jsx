// frontend/src/pages/bets/ActiveBets.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Typography, Spin, Alert, Grid } from 'antd';
import { FireOutlined, TrophyOutlined, CalendarOutlined, RightOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import betService from '../../services/betService';
import api from '../../services/api';
import { calculatePredictionPoints } from '../../utils/betCalculations';

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
    padding: '1px 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
    background: s.bg,
    border: `1px solid ${s.border}`,
    color: s.text,
    lineHeight: '17px',
  }}>
    {s.label}
  </span>
);

/* ─── Acordeón custom (sin Ant Design Collapse) ─── */
const AccordionItem = ({ header, children, card }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: card.bg,
      border: `1px solid ${card.border}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: card.bg,
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <RightOutlined style={{
          fontSize: 10,
          color: card.iconColor,
          transform: open ? 'rotate(90deg)' : 'none',
          transition: 'transform .2s',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>{header}</div>
      </button>
      {open && (
        <div style={{
          background: card.bg,
          borderTop: `1px solid ${card.border}`,
          padding: '8px 14px 12px',
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

/* ─── componente principal ─── */
const ActiveBets = () => {
  const { user } = useAuth();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const screens = Grid.useBreakpoint();
  const isDesktop = screens.md;
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
      const response = await api.get('/bet-integration/me/bets');
      const rawBets = response.data || [];

      const enriched = rawBets.map(bet => {
        const predictions = (bet.predictions || []).map(pred => {
          const match = pred.match;
          const status = match?.status ? String(match.status).toLowerCase() : '';
          const isFinished = status === 'finalizado' || status === 'finished';
          const hasResult = isFinished && match && match.home_score !== null && match.away_score !== null;
          const points = hasResult
            ? calculatePredictionPoints(
                { home_score: pred.predicted_home_score, away_score: pred.predicted_away_score },
                { home_score: match.home_score, away_score: match.away_score }
              )
            : pred.points || 0;
          return { ...pred, match, status, isFinished, hasResult, points };
        });
        return {
          ...bet,
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
    ? { bg: '#0f1824', border: '#1f2b3a', iconColor: '#64748b' }
    : { bg: '#ffffff', border: '#e5e7eb', iconColor: '#94a3b8' };

  /* ── render de una predicción en desktop ── */
  const renderPredictionDesktop = (pred, idx, total, bet) => {
    const match = pred.match;
    const ms = matchStatusStyle(match?.status, isDark);
    const isLast = idx === total - 1;
    const pointColor = pred.points === 3 ? '#52c41a' : pred.points === 1 ? '#1677ff' : isDark ? '#475569' : '#94a3b8';
    const homeName = match?.home_team?.name || `Equipo ${pred.match_id}`;
    const awayName = match?.away_team?.name || '';
    const rowBg = idx % 2 === 0
      ? (isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.015)')
      : 'transparent';

    return (
      <div key={`${bet.id}-${pred.match_id}`} style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 90px 1fr 32px  80px 110px 52px',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: rowBg,
        borderBottom: isLast ? 'none' : `1px solid ${isDark ? 'rgba(31,43,58,.6)' : '#f1f5f9'}`,
      }}>
        {/* Logo local */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {match?.home_team?.logo_url
            ? <img src={match.home_team.logo_url} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: isDark ? '#1f2b3a' : '#e5e7eb' }} />}
        </div>
        {/* Nombre local */}
        <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1f2937', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {homeName}
        </span>
        {/* Pronóstico / resultado */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? '#60a5fa' : '#1677ff', lineHeight: 1 }}>
            {pred.predicted_home_score} – {pred.predicted_away_score}
          </div>
          {pred.hasResult && (
            <div style={{ fontSize: 11, color: isDark ? '#64748b' : '#9ca3af', marginTop: 2 }}>
              ({match.home_score}–{match.away_score})
            </div>
          )}
        </div>
        {/* Nombre visitante */}
        <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {awayName}
        </span>
        {/* Logo visitante */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {match?.away_team?.logo_url
            ? <img src={match.away_team.logo_url} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: isDark ? '#1f2b3a' : '#e5e7eb' }} />}
        </div>
        {/* Fecha del partido */}
        <span style={{ fontSize: 11, color: isDark ? '#64748b' : '#9ca3af', textAlign: 'center' }}>
          {match?.match_date ? new Date(match.match_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
        </span>
        {/* Estado */}
        <div style={{ display: 'flex', justifyContent: 'center' }}><Pill s={ms} /></div>
        {/* Puntos */}
        <div style={{ textAlign: 'right' }}>
          {pred.isFinished && (
            <span style={{ fontSize: 14, fontWeight: 800, color: pointColor }}>{pred.points}pt</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: isDesktop ? '24px 32px' : '16px',
      minHeight: '100vh',
      background: isDark ? 'linear-gradient(180deg,#0b0f16 0%,#0f1824 100%)' : undefined,
    }}>
      {/* Encabezado */}
      <div style={{ maxWidth: isDesktop ? 900 : undefined, margin: isDesktop ? '0 auto 20px' : '0 0 16px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: isDesktop ? 900 : undefined, margin: isDesktop ? '0 auto' : undefined }}>
          {groupedBets.map(group => {
            const statusStyle = betDateTagStyle(group.bet_date_status, isDark);
            return (
              <AccordionItem
                key={group.bet_date_id}
                card={card}
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text strong style={{ fontSize: isDesktop ? 14 : 13, color: isDark ? '#e6edf3' : undefined }}>
                      {group.bet_date_name}
                    </Text>
                    <Pill s={{ bg: isDark ? 'rgba(22,119,255,.15)' : '#e6f4ff', border: isDark ? 'rgba(22,119,255,.3)' : '#91caff', text: isDark ? '#60a5fa' : '#0958d9', label: `${group.totalBets} pronósticos` }} />
                    {group.bet_date_status && <Pill s={statusStyle} />}
                  </div>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.items.map(bet => {
                    const sorted = [...(bet.predictions || [])].sort((a, b) => {
                      const at = a.match?.match_date ? new Date(a.match.match_date).getTime() : Infinity;
                      const bt = b.match?.match_date ? new Date(b.match.match_date).getTime() : Infinity;
                      return at - bt;
                    });
                    return (
                      <div key={bet.id}>
                        {/* Sub-encabezado */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: isDesktop ? '6px 16px' : '3px 0', borderBottom: `1px solid ${card.border}` }}>
                          <CalendarOutlined style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }} />
                          <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                            {new Date(bet.submitted_at || bet.created_at).toLocaleDateString()}
                          </Text>
                          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 13, color: '#1677ff' }}>
                            <TrophyOutlined /> {bet.totalPoints || 0} pts
                          </span>
                        </div>

                        {/* Cabecera de columnas (solo desktop) */}
                        {isDesktop && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '32px 1fr 90px 1fr 32px  80px 110px 52px',
                            gap: 8, padding: '4px 16px 6px',
                            fontSize: 10, fontWeight: 700, color: isDark ? '#475569' : '#9ca3af',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                          }}>
                            <span></span>
                            <span style={{ textAlign: 'right' }}>Local</span>
                            <span style={{ textAlign: 'center' }}>Pronóstico</span>
                            <span>Visitante</span>
                            <span></span>
                            <span style={{ textAlign: 'center' }}>Fecha</span>
                            <span style={{ textAlign: 'center' }}>Estado</span>
                            <span style={{ textAlign: 'right' }}>Pts</span>
                          </div>
                        )}

                        {/* Filas */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {isDesktop
                            ? sorted.map((pred, idx) => renderPredictionDesktop(pred, idx, sorted.length, bet))
                            : sorted.map((pred, idx) => {
                                const match = pred.match;
                                const ms = matchStatusStyle(match?.status, isDark);
                                const isLast = idx === sorted.length - 1;
                                const pointColor = pred.points === 3 ? '#52c41a' : pred.points === 1 ? '#1677ff' : isDark ? '#475569' : '#94a3b8';
                                const homeName = match?.home_team?.name || '';
                                const awayName = match?.away_team?.name || '';
                                return (
                                  <div key={`${bet.id}-${pred.match_id}`} style={{ padding: '6px 0', borderBottom: isLast ? 'none' : `1px solid ${isDark ? 'rgba(31,43,58,.8)' : '#f1f5f9'}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                      {match?.home_team?.logo_url && <img src={match.home_team.logo_url} alt="" style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0 }} />}
                                      <Text style={{ fontSize: 11, color: isDark ? '#cbd5e1' : '#374151', flex: 1, lineHeight: 1.3 }}>
                                        {match ? `${homeName} vs ${awayName}` : `Partido ${pred.match_id}`}
                                      </Text>
                                      {match?.away_team?.logo_url && <img src={match.away_team.logo_url} alt="" style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0 }} />}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingLeft: 21 }}>
                                      <Text style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#60a5fa' : '#0958d9' }}>{pred.predicted_home_score}-{pred.predicted_away_score}</Text>
                                      {pred.hasResult && <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#9ca3af' }}>({match.home_score}-{match.away_score})</Text>}
                                      <Pill s={ms} />
                                      {pred.isFinished && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: pointColor }}>{pred.points}pt</span>}
                                    </div>
                                  </div>
                                );
                              })
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionItem>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveBets;
