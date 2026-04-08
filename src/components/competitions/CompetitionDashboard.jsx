// frontend/src/components/competitions/CompetitionDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Spin, Button, message } from 'antd';
import {
  TrophyOutlined, TeamOutlined, CalendarOutlined,
  TableOutlined, EyeOutlined, FireOutlined,
  EnvironmentOutlined, RightOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import { useTheme } from '../../context/ThemeContext';
import './CompetitionDashboard.css';

import CompetitionTeams from './CompetitionTeams';
import CompetitionMatches from './CompetitionMatches';
import CompetitionRounds from './CompetitionRounds';
import CompetitionStandings from './CompetitionStandings';
import CompetitionStats from './CompetitionStats';

/* ─── helpers ─── */
const STATUS = {
  ongoing:   { bar: '#22c55e', bg: 'rgba(34,197,94,.15)',  border: 'rgba(34,197,94,.35)',  text: '#86efac', label: 'En curso'    },
  active:    { bar: '#22c55e', bg: 'rgba(34,197,94,.15)',  border: 'rgba(34,197,94,.35)',  text: '#86efac', label: 'En curso'    },
  scheduled: { bar: '#3b82f6', bg: 'rgba(59,130,246,.15)', border: 'rgba(59,130,246,.3)',  text: '#93c5fd', label: 'Programado'  },
  draft:     { bar: '#f59e0b', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.3)',  text: '#fde68a', label: 'Borrador'    },
  completed: { bar: '#64748b', bg: 'rgba(100,116,139,.15)',border: 'rgba(100,116,139,.3)', text: '#94a3b8', label: 'Finalizado'  },
  cancelled: { bar: '#ef4444', bg: 'rgba(239,68,68,.15)',  border: 'rgba(239,68,68,.3)',   text: '#fca5a5', label: 'Cancelado'   },
};
const getStatus = (s) => STATUS[String(s||'').toLowerCase()] || { bar:'#64748b', bg:'rgba(100,116,139,.1)', border:'rgba(100,116,139,.3)', text:'#94a3b8', label: s||'—' };

const TYPE_LABEL = { league:'Liga', cup:'Copa', league_cup:'Liga + Copa', groups_playoff:'Grupos + Playoff' };

const Pill = ({ children, color = '#1677ff' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
    background: `${color}22`, border: `1px solid ${color}55`, color,
    whiteSpace: 'nowrap',
  }}>{children}</span>
);

const TABS = [
  { key: 'overview',   label: 'Resumen',            icon: <EyeOutlined />       },
  { key: 'teams',      label: 'Equipos',             icon: <TeamOutlined />      },
  { key: 'matches',    label: 'Partidos',            icon: <CalendarOutlined />  },
  { key: 'standings',  label: 'Tabla',               icon: <TableOutlined />     },
  { key: 'rounds',     label: 'Jornadas',            icon: <CalendarOutlined />  },
];

/* ─── componente principal ─── */
const CompetitionDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});

  useEffect(() => { if (id) fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const compRes = await competitionService.getCompetition(id);
      setCompetition(compRes.data);
      try {
        const statsRes = await competitionService.getStats(id);
        setStats(statsRes.data || {});
      } catch { /* stats opcionales */ }
    } catch {
      message.error('Error al cargar la competencia');
    } finally {
      setLoading(false);
    }
  };

  /* ── paleta ── */
  const card = isDark
    ? { bg: '#0c141f', border: '#1f2b3a', sub: '#64748b', text: '#e6edf3', muted: '#94a3b8' }
    : { bg: '#ffffff', border: '#e5e7eb', sub: '#6b7280', text: '#111827', muted: '#9ca3af' };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Spin size="large" />
    </div>
  );

  if (!competition) return (
    <div style={{ padding: 24 }}>
      <p>Competencia no encontrada.</p>
      <Button type="primary" onClick={() => navigate('/competitions')}>Volver</Button>
    </div>
  );

  const sc = getStatus(competition.status);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const logoSrc = competition.logo_url
    ? (competition.logo_url.startsWith('http') ? competition.logo_url : `${apiBase}${competition.logo_url}`)
    : null;

  const tabContent = {
    overview:  <CompetitionStats competition={competition} stats={stats} />,
    teams:     <CompetitionTeams competitionId={id} teams={competition?.teams || []} />,
    matches:   <CompetitionMatches competitionId={id} competitionName={competition?.name} />,
    standings: <CompetitionStandings competitionId={id} competitionType={competition?.competition_type} />,
    rounds:    <CompetitionRounds competitionId={id} />,
  };

  return (
    <div className="cdash" style={{ '--cdash-bg': card.bg, '--cdash-border': card.border }}>

      {/* ── Hero header ── */}
      <div className="cdash__hero" style={{
        background: card.bg,
        borderBottom: `1px solid ${card.border}`,
      }}>
        {/* Barra de color de estado */}
        <div style={{ height: 4, background: sc.bar, width: '100%' }} />

        <div className="cdash__hero-body">
          {/* Logo + nombre + meta */}
          <div className="cdash__hero-main">
            {/* Logo */}
            <div className="cdash__logo" style={{
              background: isDark ? '#0f1824' : '#f1f5f9',
              border: `1px solid ${card.border}`,
            }}>
              {logoSrc
                ? <img src={logoSrc} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                : <TrophyOutlined style={{ fontSize: 28, color: card.muted }} />}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cdash__name-row">
                <h1 className="cdash__name" style={{ color: card.text }}>{competition.name}</h1>
                <span style={{
                  flexShrink: 0,
                  padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text,
                }}>{sc.label}</span>
              </div>

              {/* Chips meta */}
              <div className="cdash__chips">
                {competition.competition_type && (
                  <Pill color="#1677ff"><TrophyOutlined />{TYPE_LABEL[competition.competition_type] || competition.competition_type}</Pill>
                )}
                {competition.season && (
                  <Pill color="#8b5cf6"><CalendarOutlined />{competition.season}</Pill>
                )}
                {competition.total_teams > 0 && (
                  <Pill color="#0ea5e9"><TeamOutlined />{competition.total_teams} equipos</Pill>
                )}
                {competition.country && (
                  <Pill color="#10b981"><EnvironmentOutlined />{competition.country}</Pill>
                )}
              </div>

              {competition.description && (
                <p className="cdash__desc" style={{ color: card.muted }}>{competition.description}</p>
              )}
            </div>
          </div>

          {/* Stats rápidas */}
          {(stats.matches_played > 0 || stats.goals_scored > 0) && (
            <div className="cdash__quick-stats" style={{ borderLeft: `1px solid ${card.border}` }}>
              <div className="cdash__stat">
                <span className="cdash__stat-val" style={{ color: card.text }}>{stats.matches_played || 0}</span>
                <span className="cdash__stat-lbl" style={{ color: card.muted }}>Partidos</span>
              </div>
              <div className="cdash__stat" style={{ borderLeft: `1px solid ${card.border}` }}>
                <span className="cdash__stat-val" style={{ color: card.text }}>{stats.goals_scored || 0}</span>
                <span className="cdash__stat-lbl" style={{ color: card.muted }}>Goles</span>
              </div>
              {stats.completed_rounds > 0 && (
                <div className="cdash__stat" style={{ borderLeft: `1px solid ${card.border}` }}>
                  <span className="cdash__stat-val" style={{ color: card.text }}>{stats.completed_rounds}/{stats.total_rounds || '?'}</span>
                  <span className="cdash__stat-lbl" style={{ color: card.muted }}>Jornadas</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Barra de pestañas ── */}
      <div className="cdash__tab-bar" style={{
        background: isDark ? 'rgba(11,15,22,.9)' : 'rgba(255,255,255,.9)',
        borderBottom: `1px solid ${card.border}`,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`cdash__tab${activeTab === tab.key ? ' cdash__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            style={activeTab === tab.key
              ? { background: '#1677ff', color: '#fff' }
              : { color: card.muted }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Contenido ── */}
      <div className="cdash__content">
        {tabContent[activeTab]}
      </div>
    </div>
  );
};

export default CompetitionDashboard;
