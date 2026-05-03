// frontend/src/pages/polla/PollaDashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table, Tag, Progress, Button, Spin, Avatar, Tabs, Grid, message,
} from 'antd';

const { useBreakpoint } = Grid;
import {
  TrophyOutlined, EditOutlined, UserOutlined, StarOutlined,
  ThunderboltOutlined, TeamOutlined, CalendarOutlined, ArrowLeftOutlined,
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
        const active = list.filter(p => p.status !== 'cancelled');
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [detail, status, matches] = await Promise.all([
          pollaService.getPolla(pollaId),
          pollaService.getMyStatus(pollaId).catch(() => ({ is_participant: false })),
          pollaService.getPollaMatches(pollaId),
        ]);
        setPolla(detail);
        setMyStatus(status);
        setPollaMatches(matches);
      } catch {}
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
      sorter: (a, b) => b.total_points - a.total_points,
      defaultSortOrder: 'descend',
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
                dataSource={polla.leaderboard}
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
    </div>
  );
}

// ── Tab mis predicciones ───────────────────────────────────────────────────
function MyPredictionsTab({ pollaId }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  useEffect(() => {
    if (!pollaId) return;
    pollaService.getMyPredictions(pollaId)
      .then(setPredictions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pollaId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>;

  const RESULT_LABELS = { L: 'Local', E: 'Empate', V: 'Visitante' };
  const RESULT_SHORT  = { L: 'L', E: 'E', V: 'V' };

  const cols = [
    {
      title: 'Partido',
      render: (_, row) => (
        <div>
          <div className="polla-match-row">
            {row.match?.home_logo && <img src={row.match.home_logo} className="polla-mini-logo" alt="" />}
            <span style={{ fontSize: isMobile ? '0.78rem' : '0.875rem' }}>{row.match?.home_team}</span>
            <span className="polla-vs">vs</span>
            <span style={{ fontSize: isMobile ? '0.78rem' : '0.875rem' }}>{row.match?.away_team}</span>
            {row.match?.away_logo && <img src={row.match.away_logo} className="polla-mini-logo" alt="" />}
          </div>
          <div className="polla-match-date">
            {row.match?.match_date
              ? new Date(row.match.match_date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
              : '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Pick',
      width: isMobile ? 50 : 130,
      render: (_, row) => {
        if (row.prediction_result) {
          return (
            <Tag color="blue" style={{ fontSize: '0.72rem', padding: '0 4px' }}>
              {isMobile ? RESULT_SHORT[row.prediction_result] : (RESULT_LABELS[row.prediction_result] || row.prediction_result)}
            </Tag>
          );
        }
        return <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{row.predicted_winner_name?.split(' ')[0] || '—'}</span>;
      },
    },
    ...(!isMobile ? [{
      title: 'Resultado',
      width: 120,
      render: (_, row) => {
        const m = row.match;
        if (!m || m.match_status !== 'Finalizado') {
          return <Tag style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#64748b' }}>Pendiente</Tag>;
        }
        if (row.phase === 'groups') {
          const r = m.home_score > m.away_score ? 'L' : m.away_score > m.home_score ? 'V' : 'E';
          return <span style={{ fontSize: '0.8rem' }}>{m.home_score}–{m.away_score} <span style={{ color: '#64748b' }}>({RESULT_LABELS[r]})</span></span>;
        }
        return <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{m.home_score}–{m.away_score}</span>;
      },
    }] : []),
    {
      title: 'Pts',
      dataIndex: 'points',
      align: 'right',
      width: 50,
      render: (pts, row) => {
        if (row.is_correct === null) return <span style={{ color: '#475569' }}>—</span>;
        return (
          <Tag color={row.is_correct ? 'green' : 'red'} style={{ fontSize: '0.78rem', padding: '0 4px' }}>
            {row.is_correct ? `+${pts}` : '0'}
          </Tag>
        );
      },
    },
  ];

  return (
    <Table
      dataSource={predictions}
      columns={cols}
      rowKey="id"
      pagination={{ pageSize: 20, showSizeChanger: false }}
      size="small"
      className="polla-predictions-table"
      locale={{ emptyText: 'Aún no has hecho predicciones' }}
    />
  );
}
