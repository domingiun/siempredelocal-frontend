// frontend/src/components/teams/TeamDetail.jsx
import React, { useState, useEffect } from 'react';
import { Button, Modal, message, Tag } from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  TeamOutlined, EnvironmentOutlined, TrophyOutlined,
  CalendarOutlined, GlobalOutlined, LinkOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import { useTheme } from '../../context/ThemeContext';
import { formatDateTimeShort, formatForInputUTC } from '../../utils/dateFormatter';

const TABS = [
  { key: 'info',    label: 'Información',  icon: <TeamOutlined />    },
  { key: 'stats',   label: 'Estadísticas', icon: <TrophyOutlined />  },
  { key: 'matches', label: 'Partidos',     icon: <HistoryOutlined /> },
];

const TeamDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teamsInfo, setTeamsInfo] = useState({});
  const [activeTab, setActiveTab] = useState('info');

  const card = isDark
    ? { bg: '#0c141f', border: '#1f2b3a', sub: '#64748b', text: '#e6edf3', muted: '#94a3b8', row: '#0f1824' }
    : { bg: '#ffffff', border: '#e5e7eb', sub: '#6b7280', text: '#111827', muted: '#9ca3af', row: '#f8fafc' };

  useEffect(() => { if (id) fetchTeamDetails(); }, [id]);

  const fetchTeamDetails = async () => {
    setLoading(true);
    try {
      const res = await competitionService.getTeam(id);
      setTeam(res.data);
      fetchRecentMatches();
    } catch {
      message.error('Error al cargar el equipo');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMatches = async () => {
    try {
      let data = [], skip = 0;
      while (true) {
        const res = await competitionService.getMatches({ limit: 100, skip, team_id: id });
        const batch = res.data || [];
        data = data.concat(batch);
        if (batch.length < 100) break;
        skip += 100;
      }
      const sorted = data.sort((a, b) => new Date(b.match_date || 0) - new Date(a.match_date || 0));
      setMatches(sorted);
      // cargar info de equipos rivales
      const ids = [...new Set([...sorted.map(m => m.home_team_id), ...sorted.map(m => m.away_team_id)])].filter(tid => tid && String(tid) !== String(id));
      const info = {};
      await Promise.all(ids.slice(0, 20).map(async tid => {
        try { info[tid] = (await competitionService.getTeam(tid)).data; } catch {}
      }));
      setTeamsInfo(info);
    } catch {}
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '¿Eliminar equipo?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar', okType: 'danger', cancelText: 'Cancelar',
      onOk: async () => {
        try { await competitionService.deleteTeam(id); message.success('Equipo eliminado'); navigate('/teams'); }
        catch { message.error('Error al eliminar'); }
      },
    });
  };

  const calcStats = () => {
    if (!team) return {};
    const p = team.matches_played || 0;
    return {
      winRate:   p > 0 ? (team.matches_won    / p * 100).toFixed(1) : '0.0',
      drawRate:  p > 0 ? (team.matches_drawn  / p * 100).toFixed(1) : '0.0',
      lossRate:  p > 0 ? (team.matches_lost   / p * 100).toFixed(1) : '0.0',
      avgGF:     p > 0 ? (team.goals_for      / p).toFixed(2)       : '0.00',
      avgGC:     p > 0 ? (team.goals_against  / p).toFixed(2)       : '0.00',
      ppm:       p > 0 ? (team.points         / p).toFixed(2)       : '0.00',
      perf:      p > 0 ? (team.points / (p * 3) * 100).toFixed(1)   : '0.0',
    };
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: card.muted }}>Cargando...</div>;
  if (!team)   return <div style={{ padding: 24 }}><Button onClick={() => navigate('/teams')}>Volver</Button></div>;

  const s = calcStats();
  const websiteUrl = team.website ? (team.website.startsWith('http') ? team.website : `https://${team.website}`) : null;

  /* ── mini helpers de render ── */
  const InfoRow = ({ icon, label, value }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      borderBottom: `1px solid ${card.border}`,
    }}>
      <span style={{ color: card.sub, fontSize: 13, width: 20, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 12, color: card.muted, width: 90, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: card.text, flex: 1 }}>{value || '—'}</span>
    </div>
  );

  const StatBox = ({ label, value, color }) => (
    <div style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '12px 6px',
      borderRight: `1px solid ${card.border}`,
    }}>
      <span style={{ fontSize: 20, fontWeight: 800, color: color || card.text, lineHeight: 1 }}>{value ?? '—'}</span>
      <span style={{ fontSize: 9, color: card.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3, textAlign: 'center' }}>{label}</span>
    </div>
  );

  const matchStatusColor = (status) => {
    const v = String(status || '').toLowerCase();
    if (v.includes('finaliz')) return { bg: 'rgba(34,197,94,.13)', border: 'rgba(34,197,94,.3)', text: '#86efac' };
    if (v.includes('aplazad') || v.includes('cancel')) return { bg: 'rgba(249,115,22,.13)', border: 'rgba(249,115,22,.3)', text: '#fdba74' };
    return { bg: 'rgba(59,130,246,.13)', border: 'rgba(59,130,246,.3)', text: '#93c5fd' };
  };

  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#0b0f16' : '#f0f2f5' }}>

      {/* ── Hero ── */}
      <div style={{ background: card.bg, borderBottom: `1px solid ${card.border}` }}>
        {/* Barra de color */}
        <div style={{ height: 4, background: team.is_active ? '#22c55e' : '#64748b' }} />

        <div style={{ padding: '12px 16px' }}>
          {/* Back */}
          <button onClick={() => navigate('/teams')} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: card.sub, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, padding: 0,
          }}>
            <ArrowLeftOutlined /> Volver a equipos
          </button>

          {/* Logo + nombre + acciones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo */}
            <div style={{
              width: 56, height: 56, borderRadius: 12, flexShrink: 0,
              background: isDark ? '#0f1824' : '#f1f5f9',
              border: `1px solid ${card.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {team.logo_url
                ? <img src={team.logo_url} alt="" style={{ width: 44, height: 44, objectFit: 'contain' }} />
                : <TeamOutlined style={{ fontSize: 24, color: card.muted }} />}
            </div>

            {/* Nombre */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: card.text, lineHeight: 1.2 }}>{team.name}</div>
              {team.short_name && <div style={{ fontSize: 12, color: card.muted, marginTop: 2 }}>{team.short_name}</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                {team.city && team.country && (
                  <span style={{ fontSize: 11, color: card.sub }}>
                    <EnvironmentOutlined style={{ marginRight: 3 }} />{team.city}, {team.country}
                  </span>
                )}
                {team.stadium && (
                  <span style={{ fontSize: 11, color: card.sub }}>
                    <CalendarOutlined style={{ marginRight: 3 }} />{team.stadium}
                  </span>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => navigate(`/teams/${id}/edit`)}>
                Editar
              </Button>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={handleDelete} />
            </div>
          </div>

          {/* Stat strip */}
          <div style={{
            display: 'flex', marginTop: 12, borderRadius: 10, overflow: 'hidden',
            border: `1px solid ${card.border}`, background: isDark ? '#0a1220' : '#f8fafc',
          }}>
            <StatBox label="Partidos"  value={team.matches_played || 0} />
            <StatBox label="Puntos"    value={team.points || 0}         color="#1677ff" />
            <StatBox label="GF"        value={team.goals_for || 0}      color="#22c55e" />
            <StatBox label="GC"        value={team.goals_against || 0}  color="#ef4444" />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 6px' }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#1677ff', lineHeight: 1 }}>{s.perf}%</span>
              <span style={{ fontSize: 9, color: card.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3, textAlign: 'center' }}>Rend.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 4, padding: '8px 14px',
        background: isDark ? 'rgba(11,15,22,.9)' : 'rgba(255,255,255,.9)',
        borderBottom: `1px solid ${card.border}`,
        position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            background: activeTab === tab.key ? '#1677ff' : 'transparent',
            color: activeTab === tab.key ? '#fff' : card.muted,
            transition: 'background .15s, color .15s',
          }}>
            {tab.icon}<span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Contenido ── */}
      <div style={{ padding: '12px 0' }}>

        {/* INFORMACIÓN */}
        {activeTab === 'info' && (
          <div style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 12, margin: '0 14px', overflow: 'hidden' }}>
            <InfoRow icon={<TeamOutlined />}       label="Nombre"      value={team.name} />
            <InfoRow icon={<TeamOutlined />}       label="Nombre corto" value={team.short_name} />
            <InfoRow icon={<GlobalOutlined />}     label="País"        value={team.country} />
            <InfoRow icon={<EnvironmentOutlined />}label="Ciudad"      value={team.city} />
            <InfoRow icon={<CalendarOutlined />}   label="Estadio"     value={team.stadium} />
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${card.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: card.sub, fontSize: 13, width: 20 }}><LinkOutlined /></span>
              <span style={{ fontSize: 12, color: card.muted, width: 90, flexShrink: 0 }}>Sitio web</span>
              {websiteUrl
                ? <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#1677ff', flex: 1 }}>{team.website}</a>
                : <span style={{ fontSize: 13, color: card.text }}>—</span>}
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: card.sub, fontSize: 13, width: 20 }}><TrophyOutlined /></span>
              <span style={{ fontSize: 12, color: card.muted, width: 90, flexShrink: 0 }}>Estado</span>
              <span style={{
                padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                background: team.is_active ? 'rgba(34,197,94,.13)' : 'rgba(100,116,139,.13)',
                border: `1px solid ${team.is_active ? 'rgba(34,197,94,.3)' : 'rgba(100,116,139,.3)'}`,
                color: team.is_active ? '#86efac' : '#94a3b8',
              }}>{team.is_active ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>
        )}

        {/* ESTADÍSTICAS */}
        {activeTab === 'stats' && (
          <div style={{ margin: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Resultados */}
            <div style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: card.sub, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${card.border}` }}>Resultados</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center' }}>
                {[
                  { l: 'Victorias', v: team.matches_won   || 0, c: '#22c55e' },
                  { l: 'Empates',   v: team.matches_drawn || 0, c: '#f59e0b' },
                  { l: 'Derrotas',  v: team.matches_lost  || 0, c: '#ef4444' },
                  { l: 'Diferencia',v: (team.goal_difference > 0 ? '+' : '') + (team.goal_difference || 0), c: team.goal_difference > 0 ? '#22c55e' : team.goal_difference < 0 ? '#ef4444' : card.muted },
                ].map((it, i) => (
                  <div key={i} style={{ padding: '14px 8px', borderRight: i < 3 ? `1px solid ${card.border}` : 'none' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: it.c, lineHeight: 1 }}>{it.v}</div>
                    <div style={{ fontSize: 10, color: card.muted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{it.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promedios */}
            <div style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: card.sub, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${card.border}` }}>Promedios</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {[
                  { l: '% Victorias',   v: `${s.winRate}%`,  c: '#22c55e' },
                  { l: 'Rendimiento',   v: `${s.perf}%`,     c: '#1677ff' },
                  { l: 'Prom. GF',      v: s.avgGF,          c: '#22c55e' },
                  { l: 'Prom. GC',      v: s.avgGC,          c: '#ef4444' },
                  { l: 'Puntos/Partido',v: s.ppm,            c: card.text },
                  { l: '% Empates',     v: `${s.drawRate}%`, c: '#f59e0b' },
                ].map((it, i) => (
                  <div key={i} style={{
                    padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: i < 4 ? `1px solid ${card.border}` : 'none',
                    borderRight: i % 2 === 0 ? `1px solid ${card.border}` : 'none',
                  }}>
                    <span style={{ fontSize: 12, color: card.muted }}>{it.l}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: it.c }}>{it.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PARTIDOS */}
        {activeTab === 'matches' && (
          <div style={{ margin: '0 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {matches.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: card.muted }}>No hay partidos registrados</div>
              : matches.map(match => {
                  const homeN = match.home_team?.name || teamsInfo[match.home_team_id]?.name || `Equipo ${match.home_team_id}`;
                  const awayN = match.away_team?.name || teamsInfo[match.away_team_id]?.name || `Equipo ${match.away_team_id}`;
                  const homeLogo = match.home_team?.logo_url || teamsInfo[match.home_team_id]?.logo_url;
                  const awayLogo = match.away_team?.logo_url || teamsInfo[match.away_team_id]?.logo_url;
                  const sc = matchStatusColor(match.status);
                  const finished = String(match.status || '').toLowerCase().includes('finaliz');
                  return (
                    <div key={match.id} style={{
                      background: card.bg, border: `1px solid ${card.border}`,
                      borderRadius: 10, padding: '10px 14px',
                    }}>
                      {/* Meta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: card.muted }}>
                          {match.match_date ? formatDateTimeShort(formatForInputUTC(match.match_date)) : 'Fecha por definir'}
                          {match.round_name ? ` · ${match.round_name}` : ''}
                        </span>
                        <span style={{ padding: '1px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                          {match.status || 'Programado'}
                        </span>
                      </div>
                      {/* Equipos y marcador */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Local */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: card.text, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{homeN}</span>
                          {homeLogo ? <img src={homeLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} /> : null}
                        </div>
                        {/* Marcador */}
                        <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 52 }}>
                          {finished
                            ? <span style={{ fontSize: 15, fontWeight: 800, color: card.text }}>{match.home_score ?? 0} - {match.away_score ?? 0}</span>
                            : <span style={{ fontSize: 13, color: card.muted }}>vs</span>}
                        </div>
                        {/* Visitante */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 6, minWidth: 0 }}>
                          {awayLogo ? <img src={awayLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} /> : null}
                          <span style={{ fontSize: 12, fontWeight: 600, color: card.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{awayN}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;
