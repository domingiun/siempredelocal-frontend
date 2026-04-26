// frontend/src/pages/polla/PollaDashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Tag, Progress, Button, Spin, Avatar, Tabs, Statistic, Row, Col, Card,
} from 'antd';
import {
  TrophyOutlined, EditOutlined, UserOutlined, StarOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import pollaService from '../../services/pollaService';
import './PollaDashboardPage.css';

const PHASE_LABELS = {
  groups: 'Grupos',
  r32: 'Ronda 32',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semis',
  third: '3er Puesto',
  final: 'Final',
};

const PHASE_ORDER = ['groups', 'r32', 'r16', 'qf', 'sf', 'third', 'final'];

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(n);

export default function PollaDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [polla, setPolla] = useState(null);
  const [myStatus, setMyStatus] = useState(null);
  const [pollaMatches, setPollaMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pollaId, setPollaId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await pollaService.listPollas();
        const active = list.find(p => p.status !== 'cancelled') || list[0];
        if (!active) { setLoading(false); return; }

        setPollaId(active.id);
        const [detail, status, matches] = await Promise.all([
          pollaService.getPolla(active.id),
          pollaService.getMyStatus(active.id).catch(() => ({ is_participant: false })),
          pollaService.getPollaMatches(active.id),
        ]);
        setPolla(detail);
        setMyStatus(status);
        setPollaMatches(matches);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="polla-db-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!polla) {
    return (
      <div className="polla-db-empty">
        <TrophyOutlined style={{ fontSize: 48, color: '#22c55e' }} />
        <p>No hay ninguna Polla activa en este momento.</p>
        <Button onClick={() => navigate('/mundial')}>Volver</Button>
      </div>
    );
  }

  if (!myStatus?.is_participant) {
    navigate('/mundial');
    return null;
  }

  // ── Calcular progreso por fase ─────────────────────────────────────────
  const phaseStats = {};
  for (const pm of pollaMatches) {
    if (!phaseStats[pm.phase]) phaseStats[pm.phase] = { total: 0, scored: 0 };
    phaseStats[pm.phase].total++;
    if (pm.is_scored) phaseStats[pm.phase].scored++;
  }

  // ── Leaderboard columns ────────────────────────────────────────────────
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
          <Avatar
            src={row.avatar_url}
            icon={!row.avatar_url && <UserOutlined />}
            size={32}
          />
          <span className={row.user_id === user?.id ? 'polla-me' : ''}>{name}</span>
          {row.user_id === user?.id && <Tag color="green" style={{ marginLeft: 4 }}>Tú</Tag>}
        </div>
      ),
    },
    {
      title: 'Pts base',
      dataIndex: 'base_points',
      align: 'right',
      sorter: (a, b) => b.base_points - a.base_points,
    },
    {
      title: 'Bonos',
      dataIndex: 'bonus_points',
      align: 'right',
      render: (v) => <Tag color={v > 0 ? 'gold' : 'default'}>{v > 0 ? `+${v}` : v}</Tag>,
    },
    {
      title: 'Total',
      dataIndex: 'total_points',
      align: 'right',
      render: (v) => <strong style={{ color: '#22c55e' }}>{v}</strong>,
      sorter: (a, b) => b.total_points - a.total_points,
      defaultSortOrder: 'descend',
    },
  ];

  const myRank = myStatus?.rank;
  const myTotal = myStatus?.total_points || 0;
  const myBase = myStatus?.base_points || 0;
  const myBonus = myStatus?.bonus_points || 0;

  return (
    <div className="polla-db">
      {/* Header */}
      <div className="polla-db-header">
        <div>
          <h1 className="polla-db-title">
            <span>⚽</span> {polla.name}
          </h1>
          <p className="polla-db-subtitle">Dashboard mundialista</p>
        </div>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate('/mundial/predict')}
          className="polla-predict-btn"
          disabled={myStatus?.predictions_pending === 0}
        >
          {myStatus?.predictions_pending > 0
            ? `Predecir (${myStatus.predictions_pending} pendientes)`
            : 'Sin predicciones pendientes'}
        </Button>
      </div>

      {/* Mis stats */}
      <Row gutter={[16, 16]} className="polla-db-stats">
        <Col xs={12} sm={6}>
          <Card className="polla-stat-card">
            <Statistic
              title="Mi posición"
              value={myRank || '—'}
              prefix={<TrophyOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f1f5f9' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="polla-stat-card">
            <Statistic
              title="Pts totales"
              value={myTotal}
              prefix={<StarOutlined style={{ color: '#22c55e' }} />}
              valueStyle={{ color: '#22c55e' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="polla-stat-card">
            <Statistic
              title="Pts base"
              value={myBase}
              valueStyle={{ color: '#94a3b8' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="polla-stat-card">
            <Statistic
              title="Bonificaciones"
              value={myBonus}
              prefix={<ThunderboltOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Premio */}
      <div className="polla-db-prize">
        <TrophyOutlined style={{ fontSize: 24, color: '#f59e0b', marginRight: 12 }} />
        <span>Premio acumulado: <strong>{formatCOP(polla.current_prize_cop)}</strong></span>
        <Tag color="green" style={{ marginLeft: 12 }}>
          {polla.participant_count} participantes
        </Tag>
      </div>

      <Tabs
        defaultActiveKey="leaderboard"
        className="polla-db-tabs"
        items={[
          {
            key: 'leaderboard',
            label: 'Tabla de posiciones',
            children: (
              <Table
                dataSource={polla.leaderboard}
                columns={leaderboardCols}
                rowKey="user_id"
                pagination={{ pageSize: 20, showSizeChanger: false }}
                size="small"
                className="polla-leaderboard-table"
                rowClassName={(row) =>
                  row.user_id === user?.id ? 'polla-my-row' : ''
                }
              />
            ),
          },
          {
            key: 'phases',
            label: 'Progreso por fase',
            children: (
              <div className="polla-phases-progress">
                {PHASE_ORDER.map((phase) => {
                  const stat = phaseStats[phase];
                  if (!stat) return null;
                  const pct = Math.round((stat.scored / stat.total) * 100);
                  return (
                    <div key={phase} className="polla-phase-progress-item">
                      <div className="polla-phase-progress-header">
                        <span>{PHASE_LABELS[phase]}</span>
                        <span className="polla-phase-progress-count">
                          {stat.scored}/{stat.total} partidos
                        </span>
                      </div>
                      <Progress
                        percent={pct}
                        strokeColor={pct === 100 ? '#22c55e' : '#3b82f6'}
                        trailColor="rgba(255,255,255,0.08)"
                        showInfo={false}
                        size="small"
                      />
                      {pct === 100 && (
                        <Tag color="green" style={{ marginTop: 4 }}>Fase completada</Tag>
                      )}
                    </div>
                  );
                })}
              </div>
            ),
          },
          {
            key: 'predictions',
            label: `Mis predicciones (${myStatus?.predictions_submitted || 0})`,
            children: <MyPredictionsTab pollaId={pollaId} />,
          },
        ]}
      />
    </div>
  );
}

function MyPredictionsTab({ pollaId }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pollaId) return;
    pollaService.getMyPredictions(pollaId)
      .then(setPredictions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pollaId]);

  if (loading) return <Spin />;

  const RESULT_LABELS = { L: 'Local gana', E: 'Empate', V: 'Visitante gana' };

  const cols = [
    {
      title: 'Partido',
      render: (_, row) => (
        <div>
          <div>
            <img src={row.match?.home_logo} className="polla-mini-logo" alt="" />
            {row.match?.home_team}
            <span className="polla-vs"> vs </span>
            {row.match?.away_team}
            <img src={row.match?.away_logo} className="polla-mini-logo" alt="" />
          </div>
          <div className="polla-match-date">
            {row.match?.match_date
              ? new Date(row.match.match_date).toLocaleString('es-CO', {
                  dateStyle: 'short', timeStyle: 'short',
                })
              : '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Fase',
      dataIndex: 'phase',
      render: (v) => <Tag>{PHASE_LABELS[v] || v}</Tag>,
    },
    {
      title: 'Mi predicción',
      render: (_, row) => {
        if (row.prediction_result) return RESULT_LABELS[row.prediction_result] || row.prediction_result;
        return row.predicted_winner_name || '—';
      },
    },
    {
      title: 'Resultado real',
      render: (_, row) => {
        const m = row.match;
        if (!m || m.match_status !== 'Finalizado') return <Tag>Pendiente</Tag>;
        if (row.phase === 'groups') {
          const r = m.home_score > m.away_score ? 'L' : m.away_score > m.home_score ? 'V' : 'E';
          return `${m.home_score}-${m.away_score} (${RESULT_LABELS[r]})`;
        }
        return row.match?.actual_winner_name || `${m.home_score}-${m.away_score}`;
      },
    },
    {
      title: 'Pts',
      dataIndex: 'points',
      align: 'right',
      render: (pts, row) => {
        if (row.is_correct === null) return '—';
        return (
          <Tag color={row.is_correct ? 'green' : 'red'}>
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
    />
  );
}
