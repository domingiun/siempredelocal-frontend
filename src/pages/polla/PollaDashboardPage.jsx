// frontend/src/pages/polla/PollaDashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table, Tag, Progress, Button, Spin, Avatar, Tabs, Grid, message, Modal,
} from 'antd';

const { useBreakpoint } = Grid;
import {
  TrophyOutlined, EditOutlined, UserOutlined, StarOutlined,
  ThunderboltOutlined, TeamOutlined, CalendarOutlined, ArrowLeftOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import pollaService from '../../services/pollaService';
import './PollaDashboardPage.css';

const PHASE_LABELS = {
  groups: 'Fase de Grupos',
  r32:    'Ronda de 32',
  r16:    'Octavos de Final',
  qf:     'Cuartos de Final',
  sf:     'Semifinales',
  third:  'Tercer Puesto',
  final:  'Final',
};

const PHASE_PTS = {
  groups: '1 pt por partido',
  r32:    '2 pts por partido',
  r16:    '2 pts por partido',
  qf:     '3 pts por partido',
  sf:     '3 pts por partido',
  third:  '3 pts por partido',
  final:  '3 pts por partido',
};

const PHASE_ORDER = ['groups', 'r32', 'r16', 'qf', 'sf', 'third', 'final'];

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(n || 0);

const formatDate = (d) => {
  if (!d) return '—';
  const utc = d.endsWith('Z') || d.includes('+') ? d : d + 'Z';
  return new Date(utc).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
};

// ── Router raíz ────────────────────────────────────────────────────────────
export default function PollaDashboardPage() {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');

  if (!idParam) return <PollaSelector />;
  return <PollaDashboard pollaId={Number(idParam)} />;
}

// ── Selector de pollas ─────────────────────────────────────────────────────
const STATUS_META = {
  upcoming:    { label: 'Próximamente', color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' },
  open:        { label: 'Abierta',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)' },
  in_progress: { label: 'En curso',     color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)' },
  finished:    { label: 'Finalizada',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
};

function PollaSelector() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pollas, setPollas]   = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await pollaService.listPollas();
        const active = list.filter(p => p.status !== 'cancelled' && p.status !== 'hidden');
        setPollas(active);

        if (user && active.length > 0) {
          const results = await Promise.all(
            active.map(p =>
              pollaService.getMyStatus(p.id)
                .then(s => [p.id, s])
                .catch(() => [p.id, { is_participant: false }])
            )
          );
          setStatuses(Object.fromEntries(results));
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [user]);

  const handleJoin = async (polla) => {
    if (!user) { navigate('/login?redirect=/mundial/dashboard'); return; }
    setJoining(polla.id);
    try {
      await pollaService.joinPolla(polla.id);
      message.success('¡Inscripción exitosa!');
      navigate(`/mundial/dashboard?id=${polla.id}`);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      message.error(typeof detail === 'string' ? detail : 'Error al inscribirse');
    } finally {
      setJoining(null);
    }
  };

  if (loading) return <div className="polla-db-loading"><Spin size="large" /></div>;

  if (!pollas.length) return (
    <div className="polla-db-empty">
      <TrophyOutlined style={{ fontSize: 48, color: '#22c55e' }} />
      <p>No hay ninguna Polla disponible en este momento.</p>
    </div>
  );

  return (
    <div className="polla-db">
      <div className="polla-selector-header">
        <h1 className="polla-selector-title">
          <TrophyOutlined style={{ color: '#22c55e' }} /> Mis Pollas
        </h1>
        <p className="polla-selector-sub">
          Selecciona la polla en la que quieres participar
        </p>
      </div>

      <div className="polla-selector-grid">
        {pollas.map(polla => {
          const myStatus = statuses[polla.id];
          const enrolled = myStatus?.is_participant;
          const s = STATUS_META[polla.status] || STATUS_META.upcoming;
          const canJoin = polla.status === 'open' || polla.status === 'in_progress';

          return (
            <div
              key={polla.id}
              className={`polla-selector-card ${enrolled ? 'polla-selector-card--enrolled' : ''}`}
            >
              {/* Header */}
              <div className="polla-selector-card-top">
                <span
                  className="polla-selector-status"
                  style={{ color: s.color, background: s.bg, borderColor: s.border }}
                >
                  {s.label}
                </span>
                {enrolled && (
                  <span className="polla-selector-enrolled-badge">✓ Inscrito</span>
                )}
              </div>

              <h2 className="polla-selector-card-name">{polla.name}</h2>

              {/* Info rows */}
              <div className="polla-selector-info">
                <div className="polla-selector-info-row">
                  <span>Premio acumulado</span>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>
                    {formatCOP(polla.current_prize_cop)}
                  </span>
                </div>
                <div className="polla-selector-info-row">
                  <span>Participantes</span>
                  <span>{polla.participant_count}</span>
                </div>
                <div className="polla-selector-info-row">
                  <span>Costo de entrada</span>
                  <span style={{ color: '#60a5fa' }}>
                    {polla.entry_credits} crédito{polla.entry_credits !== 1 ? 's' : ''}
                  </span>
                </div>
                {enrolled && myStatus?.rank && (
                  <div className="polla-selector-info-row">
                    <span>Mi posición</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>#{myStatus.rank}</span>
                  </div>
                )}
                {enrolled && (
                  <div className="polla-selector-info-row">
                    <span>Mis puntos</span>
                    <span style={{ color: '#22c55e', fontWeight: 700 }}>
                      {myStatus?.total_points || 0} pts
                    </span>
                  </div>
                )}
                {enrolled && (myStatus?.predictions_pending || 0) > 0 && (
                  <div className="polla-selector-info-row">
                    <span>Predicciones pendientes</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                      {myStatus.predictions_pending}
                    </span>
                  </div>
                )}
              </div>

              {/* CTA */}
              {enrolled ? (
                <button
                  className="polla-selector-btn polla-selector-btn--enter"
                  onClick={() => navigate(`/mundial/dashboard?id=${polla.id}`)}
                >
                  Ver mi dashboard →
                </button>
              ) : canJoin ? (
                <button
                  className="polla-selector-btn polla-selector-btn--join"
                  onClick={() => handleJoin(polla)}
                  disabled={joining === polla.id}
                >
                  {joining === polla.id
                    ? 'Inscribiendo…'
                    : `Inscribirme — ${polla.entry_credits} crédito${polla.entry_credits !== 1 ? 's' : ''}`}
                </button>
              ) : (
                <button className="polla-selector-btn polla-selector-btn--disabled" disabled>
                  {polla.status === 'upcoming' ? 'Próximamente disponible' : 'Polla finalizada'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Dashboard de polla específica ──────────────────────────────────────────
function PollaDashboard({ pollaId }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const [polla, setPolla]               = useState(null);
  const [myStatus, setMyStatus]         = useState(null);
  const [pollaMatches, setPollaMatches] = useState([]);
  const [loading, setLoading]           = useState(true);

  // Modal de predicciones de otro participante
  const [viewUser, setViewUser]         = useState(null); // { user_id, username }
  const [viewData, setViewData]         = useState(null);
  const [viewLoading, setViewLoading]   = useState(false);

  const openParticipantModal = async (row) => {
    setViewUser({ user_id: row.user_id, username: row.username });
    setViewData(null);
    setViewLoading(true);
    try {
      const data = await pollaService.getParticipantPredictions(pollaId, row.user_id);
      setViewData(data);
    } catch {
      message.error('No se pudieron cargar las predicciones');
    } finally {
      setViewLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [detail, status, matches] = await Promise.all([
          pollaService.getPolla(pollaId),
          pollaService.getMyStatus(pollaId).catch(() => ({ is_participant: false })),
          pollaService.getPollaMatches(pollaId).catch(() => []),
        ]);
        setPolla(detail);
        setMyStatus(status);
        setPollaMatches(matches);
      } catch (err) {
        // Solo llega aquí si getPolla falla (polla inexistente o error red)
        // polla queda null → muestra "Polla no encontrada"
      }
      finally { setLoading(false); }
    })();
  }, [pollaId]);

  if (loading) return <div className="polla-db-loading"><Spin size="large" /></div>;

  if (!polla) return (
    <div className="polla-db-empty">
      <TrophyOutlined style={{ fontSize: 48, color: '#22c55e' }} />
      <p>Polla no encontrada.</p>
      <Button onClick={() => navigate('/mundial/dashboard')}>Volver</Button>
    </div>
  );

  if (!myStatus?.is_participant) {
    navigate('/mundial/dashboard');
    return null;
  }

  const phaseStats = {};
  for (const pm of pollaMatches) {
    if (!phaseStats[pm.phase]) phaseStats[pm.phase] = { total: 0, scored: 0 };
    phaseStats[pm.phase].total++;
    if (pm.is_scored) phaseStats[pm.phase].scored++;
  }

  const myRank  = myStatus?.rank;
  const myTotal = myStatus?.total_points  || 0;
  const myBase  = myStatus?.base_points   || 0;
  const myBonus = myStatus?.bonus_points  || 0;
  const pending = myStatus?.predictions_pending || 0;

  const leaderboardCols = [
    {
      title: '#',
      dataIndex: 'rank',
      width: 52,
      render: (rank) => {
        if (rank === 1) return <span className="polla-rank gold">🥇</span>;
        if (rank === 2) return <span className="polla-rank silver">🥈</span>;
        if (rank === 3) return <span className="polla-rank bronze">🥉</span>;
        return <span className="polla-rank">{rank}</span>;
      },
    },
    {
      title: 'Jugador',
      dataIndex: 'username',
      render: (name, row) => (
        <div className="polla-player">
          <Avatar src={row.avatar_url} icon={!row.avatar_url && <UserOutlined />} size={30} />
          <span className={row.user_id === user?.id ? 'polla-me' : ''}>{name}</span>
          {row.user_id === user?.id && (
            <Tag color="green" style={{ marginLeft: 2, fontSize: '0.7rem' }}>Tú</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Base',
      dataIndex: 'base_points',
      align: 'right',
      render: (v) => <span style={{ color: '#94a3b8' }}>{v}</span>,
    },
    {
      title: 'Bonos',
      dataIndex: 'bonus_points',
      align: 'right',
      render: (v) => (
        <span style={{ color: v > 0 ? '#fbbf24' : '#475569', fontWeight: v > 0 ? 700 : 400 }}>
          {v > 0 ? `+${v}` : v}
        </span>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total_points',
      align: 'right',
      render: (v) => <strong style={{ color: '#22c55e', fontSize: '1rem' }}>{v}</strong>,
    },
    {
      title: '',
      width: 44,
      render: (_, row) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          size="small"
          style={{ color: '#475569' }}
          onClick={() => openParticipantModal(row)}
          title="Ver picks jugados"
        />
      ),
    },
  ];

  return (
    <div className="polla-db">

      {/* Back link */}
      <button
        className="polla-db-back"
        onClick={() => navigate('/mundial/dashboard')}
      >
        <ArrowLeftOutlined /> Mis Pollas
      </button>

      {/* Hero */}
      <div className="polla-db-hero">
        <div>
          <h1 className="polla-db-title">⚽ {polla.name}</h1>
          <p className="polla-db-subtitle">Dashboard mundialista</p>
          <div className="polla-db-prize-inline">
            <TrophyOutlined style={{ color: '#fbbf24' }} />
            <span>Premio acumulado: <strong>{formatCOP(polla.current_prize_cop)}</strong></span>
            <span style={{ color: '#334155' }}>·</span>
            <TeamOutlined style={{ color: '#60a5fa' }} />
            <span style={{ color: '#60a5fa' }}>{polla.participant_count} participantes</span>
          </div>
        </div>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/mundial/predict?id=${pollaId}`)}
          className="polla-predict-btn"
          disabled={pending === 0}
        >
          {pending > 0 ? `Predecir (${pending} pendientes)` : 'Sin predicciones pendientes'}
        </Button>
      </div>

      {/* Mis stats */}
      <div className="polla-db-stats">
        <div className="polla-db-stat">
          <div className="polla-db-stat-icon polla-db-stat-icon--gold">
            <TrophyOutlined />
          </div>
          <div>
            <div className="polla-db-stat-val">{myRank || '—'}</div>
            <div className="polla-db-stat-lbl">Mi posición</div>
          </div>
        </div>
        <div className="polla-db-stat">
          <div className="polla-db-stat-icon polla-db-stat-icon--green">
            <StarOutlined />
          </div>
          <div>
            <div className="polla-db-stat-val" style={{ color: '#22c55e' }}>{myTotal}</div>
            <div className="polla-db-stat-lbl">Puntos totales</div>
          </div>
        </div>
        <div className="polla-db-stat">
          <div className="polla-db-stat-icon polla-db-stat-icon--blue">
            <CalendarOutlined />
          </div>
          <div>
            <div className="polla-db-stat-val">{myBase}</div>
            <div className="polla-db-stat-lbl">Puntos base</div>
          </div>
        </div>
        <div className="polla-db-stat">
          <div className="polla-db-stat-icon polla-db-stat-icon--purple">
            <ThunderboltOutlined />
          </div>
          <div>
            <div className="polla-db-stat-val" style={{ color: myBonus > 0 ? '#fbbf24' : undefined }}>
              {myBonus > 0 ? `+${myBonus}` : myBonus}
            </div>
            <div className="polla-db-stat-lbl">Bonificaciones</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultActiveKey="leaderboard"
        className="polla-db-tabs"
        size={isMobile ? 'small' : 'middle'}
        items={[
          {
            key: 'leaderboard',
            label: isMobile ? '🏆 Ranking' : 'Tabla de posiciones',
            children: (
              <Table
                dataSource={[...(polla.leaderboard || [])].sort((a, b) => b.total_points - a.total_points)}
                columns={leaderboardCols}
                rowKey="user_id"
                pagination={{ pageSize: 20, showSizeChanger: false }}
                size="small"
                className="polla-leaderboard-table"
                rowClassName={(row) => row.user_id === user?.id ? 'polla-my-row' : ''}
                locale={{ emptyText: 'Aún no hay participantes con puntos' }}
              />
            ),
          },
          {
            key: 'phases',
            label: isMobile ? '📊 Fases' : 'Progreso por fase',
            children: (
              <div className="polla-phases-progress">
                {PHASE_ORDER.map((phase) => {
                  const stat = phaseStats[phase];
                  if (!stat) return null;
                  const pct = Math.round((stat.scored / stat.total) * 100);
                  return (
                    <div key={phase} className="polla-phase-progress-item">
                      <div className="polla-phase-progress-header">
                        <span className="polla-phase-progress-name">{PHASE_LABELS[phase]}</span>
                        <span className="polla-phase-progress-count">
                          {stat.scored}/{stat.total} jugados
                        </span>
                      </div>
                      <Progress
                        percent={pct}
                        strokeColor={pct === 100 ? '#22c55e' : '#3b82f6'}
                        trailColor="rgba(255,255,255,0.06)"
                        showInfo={pct > 0}
                        size="small"
                      />
                      <div className="polla-phase-pts">{PHASE_PTS[phase]}</div>
                    </div>
                  );
                })}
              </div>
            ),
          },
          {
            key: 'predictions',
            label: isMobile
              ? `⚽ Mis picks (${myStatus?.predictions_submitted || 0})`
              : `Mis predicciones (${myStatus?.predictions_submitted || 0})`,
            children: <MyPredictionsTab pollaId={pollaId} />,
          },
        ]}
      />

      {/* Modal: picks de otro participante */}
      <Modal
        open={!!viewUser}
        onCancel={() => { setViewUser(null); setViewData(null); }}
        footer={null}
        title={
          viewData
            ? <span>
                <EyeOutlined style={{ marginRight: 8, color: '#60a5fa' }} />
                Picks de <strong style={{ color: '#f1f5f9' }}>{viewData.username}</strong>
                <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 10, fontWeight: 400 }}>
                  — partidos jugados
                </span>
              </span>
            : 'Cargando…'
        }
        width={680}
        styles={{ content: { background: '#0c1525', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 },
                  header: { background: '#0c1525', borderBottom: '1px solid rgba(255,255,255,0.07)' } }}
      >
        {viewLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
        ) : viewData ? (
          <ParticipantPicksModal data={viewData} />
        ) : null}
      </Modal>
    </div>
  );
}

// ── Tarjeta visual compartida ──────────────────────────────────────────────
const PHASE_META = {
  groups: { label: 'Fase de Grupos',  color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
  r32:    { label: 'Ronda de 32',     color: '#60a5fa', bg: 'rgba(96,165,250,0.10)'  },
  r16:    { label: '16avos de Final', color: '#60a5fa', bg: 'rgba(96,165,250,0.10)'  },
  qf:     { label: 'Cuartos de Final',color: '#c084fc', bg: 'rgba(192,132,252,0.10)' },
  sf:     { label: 'Semifinal',       color: '#f59e0b', bg: 'rgba(245,158,11,0.10)'  },
  third:  { label: 'Tercer Puesto',   color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
  final:  { label: 'Final',           color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
};

const MATCH_STATUS_META = {
  'Finalizado':  { label: 'Finalizado',  color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)' },
  'En curso':    { label: 'En curso',    color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.3)' },
  'Programado':  { label: 'Programado',  color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)' },
  'Cancelado':   { label: 'Cancelado',   color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
  'Aplazado':    { label: 'Aplazado',    color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
};

function PredMatchCard({ pred, compact = false }) {
  const RESULT_LABELS = { L: 'Local', E: 'Empate', V: 'Visitante' };
  const m = pred.match || {};
  const isFinalized = m.match_status === 'Finalizado';
  const hasScore    = m.home_score != null;
  const isCorrect   = pred.is_correct;
  const pts         = pred.points || 0;

  // Badge de resultado del usuario
  let borderColor, bgGlow, resultBadge;
  if (isCorrect === true) {
    borderColor = 'rgba(34,197,94,0.4)';
    bgGlow      = 'rgba(34,197,94,0.04)';
    resultBadge = { label: '✓ ACERTASTE', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' };
  } else if (isCorrect === false) {
    borderColor = 'rgba(239,68,68,0.4)';
    bgGlow      = 'rgba(239,68,68,0.04)';
    resultBadge = { label: '✗ FALLASTE',  color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.3)' };
  } else {
    borderColor = 'rgba(255,255,255,0.08)';
    bgGlow      = 'transparent';
    resultBadge = null;
  }

  // Estado del partido
  const statusMeta = MATCH_STATUS_META[m.match_status] || MATCH_STATUS_META['Programado'];

  // Resultado del partido (L/E/V) — solo para Finalizado y phase groups
  let matchResultLabel = null;
  if (isFinalized && hasScore && pred.phase === 'groups') {
    matchResultLabel = m.home_score > m.away_score ? 'Local'
      : m.away_score > m.home_score ? 'Visitante'
      : 'Empate';
  }

  const pickText = pred.prediction_result
    ? RESULT_LABELS[pred.prediction_result]
    : (pred.predicted_winner_name || '—');

  const logoSize = compact ? 24 : 30;
  const nameSz   = compact ? '0.78rem' : '0.875rem';

  return (
    <div style={{
      background: bgGlow,
      border: `1px solid ${borderColor}`,
      borderRadius: compact ? 10 : 14,
      padding: compact ? '10px 14px' : '14px 18px',
      transition: 'border-color 0.2s',
    }}>
      {/* Header: fase · fecha · estado partido · badge resultado usuario */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Fase / Jornada */}
          {pred.phase && PHASE_META[pred.phase] && (
            <span style={{
              background: PHASE_META[pred.phase].bg,
              color: PHASE_META[pred.phase].color,
              borderRadius: 20, padding: '1px 8px',
              fontSize: '0.60rem', fontWeight: 700, letterSpacing: '0.03em',
            }}>
              {PHASE_META[pred.phase].label}
            </span>
          )}
          <span style={{ fontSize: '0.68rem', color: '#475569' }}>
            {m.match_date ? formatDate(m.match_date) : '—'}
          </span>
          {/* Estado del partido */}
          <span style={{
            background: statusMeta.bg, color: statusMeta.color,
            border: `1px solid ${statusMeta.border}`,
            borderRadius: 20, padding: '1px 8px',
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.03em',
          }}>
            {statusMeta.label}
          </span>
        </div>
        {/* ACERTASTE / FALLASTE */}
        {resultBadge && (
          <span style={{
            background: resultBadge.bg, color: resultBadge.color,
            border: `1px solid ${resultBadge.border}`,
            borderRadius: 20, padding: '2px 10px',
            fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.04em',
          }}>
            {resultBadge.label}
          </span>
        )}
      </div>

      {/* Equipos + marcador */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {/* Local */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: nameSz, fontWeight: 600, color: '#e2e8f0', textAlign: 'right', lineHeight: 1.2 }}>
            {m.home_team}
          </span>
          {m.home_logo
            ? <img src={m.home_logo} style={{ width: logoSize, height: logoSize, objectFit: 'contain', flexShrink: 0 }} alt="" />
            : <div style={{ width: logoSize, height: logoSize, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
          }
        </div>

        {/* Marcador / VS */}
        <div style={{ textAlign: 'center', minWidth: compact ? 46 : 58 }}>
          {isFinalized && hasScore ? (
            <div>
              <div style={{ fontSize: compact ? '1rem' : '1.15rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>
                {m.home_score} – {m.away_score}
              </div>
              {m.penalty_home != null && m.penalty_away != null && (
                <div style={{ fontSize: '0.60rem', color: '#94a3b8', marginTop: 1 }}>
                  pen. {m.penalty_home} — {m.penalty_away}
                </div>
              )}
              {matchResultLabel && (
                <div style={{ fontSize: '0.60rem', color: '#64748b', marginTop: 2 }}>
                  {matchResultLabel}
                </div>
              )}
            </div>
          ) : (
            <span style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem' }}>vs</span>
          )}
        </div>

        {/* Visitante */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {m.away_logo
            ? <img src={m.away_logo} style={{ width: logoSize, height: logoSize, objectFit: 'contain', flexShrink: 0 }} alt="" />
            : <div style={{ width: logoSize, height: logoSize, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
          }
          <span style={{ fontSize: nameSz, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.2 }}>
            {m.away_team}
          </span>
        </div>
      </div>

      {/* Footer: pick + puntos */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Pick:{' '}
          <span style={{
            color: isCorrect === true ? '#22c55e' : isCorrect === false ? '#ef4444' : '#94a3b8',
            fontWeight: 700,
          }}>
            {pickText}
          </span>
        </span>
        {isCorrect !== null && isCorrect !== undefined ? (
          <span style={{
            background: isCorrect ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)',
            color: isCorrect ? '#22c55e' : '#ef4444',
            border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            borderRadius: 20, padding: '3px 14px',
            fontWeight: 900, fontSize: '0.85rem',
          }}>
            {isCorrect ? `+${pts} pt${pts !== 1 ? 's' : ''}` : '0 pts'}
          </span>
        ) : (
          <span style={{ color: '#475569', fontSize: '0.72rem' }}>Sin resultado</span>
        )}
      </div>
    </div>
  );
}

// ── Modal picks de participante ────────────────────────────────────────────
function ParticipantPicksModal({ data }) {
  const scored = (data.predictions || []).filter(
    p => p.match?.home_score != null || (p.is_correct !== null && p.is_correct !== undefined)
  );

  if (!scored.length) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
        <CalendarOutlined style={{ fontSize: 32, marginBottom: 12, display: 'block' }} />
        <p>Aún no hay partidos jugados con predicciones de este participante.</p>
        <p style={{ fontSize: '0.78rem', color: '#475569' }}>
          Aparecerán aquí una vez que el admin puntúe los partidos finalizados.
        </p>
      </div>
    );
  }

  const correct  = scored.filter(p => p.is_correct === true).length;
  const totalPts = scored.reduce((s, p) => s + (p.points || 0), 0);

  return (
    <div>
      {/* Mini stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Posición',   value: data.rank ? `#${data.rank}` : '—', color: '#fbbf24' },
          { label: 'Pts totales', value: data.total_points ?? '—',         color: '#22c55e' },
          { label: 'Aciertos',   value: `${correct}/${scored.length}`,     color: '#60a5fa' },
          { label: 'Pts ganados', value: totalPts,                          color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, padding: '10px 14px', flex: '1 1 80px', minWidth: 80,
          }}>
            <div style={{ color: s.color, fontWeight: 800, fontSize: '1.05rem' }}>{s.value}</div>
            <div style={{ color: '#64748b', fontSize: '0.68rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Cards — de más reciente a más antigua */}
      <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...scored]
          .sort((a, b) => {
            const da = a.match?.match_date ? new Date(a.match.match_date) : 0;
            const db = b.match?.match_date ? new Date(b.match.match_date) : 0;
            return db - da;
          })
          .map((pred, i) => <PredMatchCard key={i} pred={pred} compact />)}
      </div>
    </div>
  );
}

// ── Tab mis predicciones ───────────────────────────────────────────────────
function MyPredictionsTab({ pollaId }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!pollaId) return;
    pollaService.getMyPredictions(pollaId)
      .then(setPredictions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pollaId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>;

  if (!predictions.length) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
        <CalendarOutlined style={{ fontSize: 36, display: 'block', marginBottom: 12 }} />
        <p>Aún no has hecho predicciones</p>
      </div>
    );
  }

  const finalized = predictions.filter(p => p.match?.match_status === 'Finalizado');
  const scored    = predictions.filter(p => p.is_correct !== null && p.is_correct !== undefined);
  const correct   = scored.filter(p => p.is_correct === true).length;
  const totalPts  = scored.reduce((s, p) => s + (p.points || 0), 0);
  const pending   = predictions.filter(p => p.match?.match_status !== 'Finalizado').length;

  return (
    <div>
      {/* Resumen rápido */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { label: 'Mis picks',    value: predictions.length, color: '#60a5fa' },
          { label: 'Finalizados',  value: finalized.length,    color: '#94a3b8' },
          { label: 'Acertados',    value: correct,            color: '#22c55e' },
          { label: 'Mis puntos',   value: totalPts,           color: '#fbbf24' },
          ...(pending > 0 ? [{ label: 'Pendientes', value: pending, color: '#f59e0b' }] : []),
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '10px 16px', flex: '1 1 80px',
          }}>
            <div style={{ color: s.color, fontWeight: 800, fontSize: '1.15rem' }}>{s.value}</div>
            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tarjetas por partido — ordenadas de más reciente a más antigua */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[...predictions]
          .sort((a, b) => {
            const da = a.match?.match_date ? new Date(a.match.match_date) : 0;
            const db = b.match?.match_date ? new Date(b.match.match_date) : 0;
            return db - da;
          })
          .map(pred => (
            <PredMatchCard key={pred.id} pred={pred} />
          ))}
      </div>
    </div>
  );
}
