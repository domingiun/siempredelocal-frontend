// frontend/src/pages/polla/PollaPredictionsPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Spin, message, Progress } from 'antd';
import { CheckOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import pollaService from '../../services/pollaService';
import './PollaPredictionsPage.css';

const PHASE_LABELS = {
  groups: 'Fase de Grupos',
  r32: 'Ronda de 32',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinales',
  third: 'Tercer Puesto',
  final: 'Final',
};

const RESULT_OPTIONS = [
  { key: 'L', label: 'Local gana', color: '#3b82f6' },
  { key: 'E', label: 'Empate', color: '#94a3b8' },
  { key: 'V', label: 'Visitante gana', color: '#ef4444' },
];

function formatCountdown(closeAt) {
  const diff = new Date(closeAt) - Date.now();
  if (diff <= 0) return 'Cerrado';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

export default function PollaPredictionsPage() {
  const navigate = useNavigate();
  const [pollaId, setPollaId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [predictions, setPredictions] = useState({});  // polla_match_id → { prediction_result, predicted_winner_id }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState({});               // polla_match_id → true si guardado

  useEffect(() => {
    (async () => {
      try {
        const list = await pollaService.listPollas();
        const active = list.find(p => p.status !== 'cancelled') || list[0];
        if (!active) { setLoading(false); return; }
        setPollaId(active.id);

        const [nextMatches, myPreds] = await Promise.all([
          pollaService.getNextMatches(active.id, 50),
          pollaService.getMyPredictions(active.id).catch(() => []),
        ]);

        setMatches(nextMatches);

        // Pre-fill existing predictions
        const prefill = {};
        const savedInit = {};
        for (const pred of myPreds) {
          prefill[pred.polla_match_id] = {
            prediction_result: pred.prediction_result,
            predicted_winner_id: pred.predicted_winner_id,
          };
          savedInit[pred.polla_match_id] = true;
        }
        setPredictions(prefill);
        setSaved(savedInit);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentMatch = matches[current];

  const handleSelectResult = (pmId, key) => {
    setPredictions(prev => ({ ...prev, [pmId]: { prediction_result: key, predicted_winner_id: null } }));
    setSaved(prev => ({ ...prev, [pmId]: false }));
  };

  const handleSelectWinner = (pmId, teamId) => {
    setPredictions(prev => ({ ...prev, [pmId]: { prediction_result: null, predicted_winner_id: teamId } }));
    setSaved(prev => ({ ...prev, [pmId]: false }));
  };

  const handleSave = async () => {
    if (!currentMatch || !pollaId) return;
    const pmId = currentMatch.id;
    const pred = predictions[pmId];
    if (!pred || (!pred.prediction_result && !pred.predicted_winner_id)) {
      message.warning('Selecciona una predicción antes de guardar');
      return;
    }

    setSaving(true);
    try {
      await pollaService.submitPrediction(pollaId, {
        polla_match_id: pmId,
        prediction_result: pred.prediction_result || null,
        predicted_winner_id: pred.predicted_winner_id || null,
      });
      setSaved(prev => ({ ...prev, [pmId]: true }));
      message.success('Predicción guardada');
      if (current < matches.length - 1) {
        setCurrent(c => c + 1);
      }
    } catch (err) {
      message.error(err?.response?.data?.detail || 'Error al guardar predicción');
    } finally {
      setSaving(false);
    }
  };

  const savedCount = Object.values(saved).filter(Boolean).length;
  const progress = matches.length > 0 ? Math.round((savedCount / matches.length) * 100) : 0;

  if (loading) {
    return (
      <div className="polla-predict-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className="polla-predict-empty">
        <CheckOutlined style={{ fontSize: 48, color: '#22c55e' }} />
        <h2>¡Todo al día!</h2>
        <p>No hay partidos pendientes de predicción en este momento.</p>
        <Button type="primary" onClick={() => navigate('/mundial/dashboard')}>
          Ver mi dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="polla-predict">
      {/* Header */}
      <div className="polla-predict-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/mundial/dashboard')}
          type="text"
          style={{ color: '#94a3b8' }}
        >
          Dashboard
        </Button>
        <div className="polla-predict-progress-wrap">
          <span className="polla-predict-progress-label">
            {savedCount}/{matches.length} guardadas
          </span>
          <Progress
            percent={progress}
            strokeColor="#22c55e"
            trailColor="rgba(255,255,255,0.08)"
            showInfo={false}
            style={{ width: 160 }}
            size="small"
          />
        </div>
      </div>

      {/* Navegación de partidos */}
      <div className="polla-predict-nav">
        {matches.map((pm, i) => {
          const isSaved = saved[pm.id];
          const hasLocal = !!predictions[pm.id];
          return (
            <button
              key={pm.id}
              className={[
                'polla-predict-dot',
                i === current ? 'active' : '',
                isSaved ? 'saved' : hasLocal ? 'local' : '',
              ].join(' ')}
              onClick={() => setCurrent(i)}
              title={`${pm.home_team} vs ${pm.away_team}`}
            />
          );
        })}
      </div>

      {/* Tarjeta del partido actual */}
      {currentMatch && (
        <MatchCard
          pm={currentMatch}
          prediction={predictions[currentMatch.id]}
          isSaved={saved[currentMatch.id]}
          onSelectResult={handleSelectResult}
          onSelectWinner={handleSelectWinner}
          onSave={handleSave}
          saving={saving}
          onPrev={current > 0 ? () => setCurrent(c => c - 1) : null}
          onNext={current < matches.length - 1 ? () => setCurrent(c => c + 1) : null}
          matchIndex={current + 1}
          matchTotal={matches.length}
        />
      )}

      {/* Resumen final */}
      {savedCount === matches.length && (
        <div className="polla-predict-done">
          <CheckOutlined style={{ color: '#22c55e', fontSize: 20 }} />
          <span>Todas las predicciones guardadas</span>
          <Button type="primary" onClick={() => navigate('/mundial/dashboard')} style={{ marginLeft: 12 }}>
            Ver mi dashboard
          </Button>
        </div>
      )}
    </div>
  );
}

function MatchCard({
  pm, prediction, isSaved,
  onSelectResult, onSelectWinner, onSave, saving,
  onPrev, onNext, matchIndex, matchTotal,
}) {
  const isGroups = pm.phase === 'groups';
  const closeAt = pm.close_at ? new Date(pm.close_at) : null;
  const countdown = closeAt ? formatCountdown(closeAt) : null;
  const matchDate = pm.match_date
    ? new Date(pm.match_date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  const selectedResult = prediction?.prediction_result;
  const selectedWinner = prediction?.predicted_winner_id;

  return (
    <div className="polla-match-card">
      {/* Fase + contador */}
      <div className="polla-card-top">
        <Tag color="blue">{PHASE_LABELS[pm.phase] || pm.phase}</Tag>
        {countdown && (
          <span className={`polla-countdown ${countdown === 'Cerrado' ? 'closed' : ''}`}>
            ⏱ {countdown}
          </span>
        )}
        <span className="polla-card-num">{matchIndex}/{matchTotal}</span>
      </div>

      {/* Equipos */}
      <div className="polla-card-teams">
        <div className="polla-card-team">
          {pm.home_logo && (
            <img src={pm.home_logo} alt={pm.home_team} className="polla-team-logo" />
          )}
          <span className="polla-team-name">{pm.home_team || '—'}</span>
        </div>
        <div className="polla-card-vs">VS</div>
        <div className="polla-card-team away">
          <span className="polla-team-name">{pm.away_team || '—'}</span>
          {pm.away_logo && (
            <img src={pm.away_logo} alt={pm.away_team} className="polla-team-logo" />
          )}
        </div>
      </div>

      {matchDate && <div className="polla-card-date">{matchDate}</div>}

      {/* Opciones de predicción */}
      <div className="polla-card-options">
        {isGroups ? (
          // Grupos: L / E / V
          <div className="polla-lev-options">
            {RESULT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className={`polla-lev-btn ${selectedResult === opt.key ? 'selected' : ''}`}
                style={selectedResult === opt.key ? { borderColor: opt.color, color: opt.color } : {}}
                onClick={() => onSelectResult(pm.id, opt.key)}
              >
                <span className="polla-lev-key">{opt.key}</span>
                <span className="polla-lev-label">{opt.label}</span>
              </button>
            ))}
          </div>
        ) : (
          // Eliminatorias: elegir equipo ganador
          <div className="polla-winner-options">
            <p className="polla-winner-label">¿Quién avanza?</p>
            <div className="polla-winner-btns">
              {[
                { id: pm.home_team_id, name: pm.home_team, logo: pm.home_logo },
                { id: pm.away_team_id, name: pm.away_team, logo: pm.away_logo },
              ].map(team => (
                <button
                  key={team.id}
                  className={`polla-winner-btn ${selectedWinner === team.id ? 'selected' : ''}`}
                  onClick={() => onSelectWinner(pm.id, team.id)}
                >
                  {team.logo && (
                    <img src={team.logo} alt={team.name} className="polla-winner-logo" />
                  )}
                  <span>{team.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Estado guardado */}
      {isSaved && (
        <div className="polla-card-saved">
          <CheckOutlined /> Predicción guardada
        </div>
      )}

      {/* Acciones */}
      <div className="polla-card-actions">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onPrev}
          disabled={!onPrev}
          type="text"
          style={{ color: '#64748b' }}
        >
          Anterior
        </Button>
        <Button
          type="primary"
          onClick={onSave}
          loading={saving}
          disabled={!prediction || (!prediction.prediction_result && !prediction.predicted_winner_id)}
          className="polla-save-btn"
          icon={isSaved ? <CheckOutlined /> : null}
        >
          {isSaved ? 'Actualizar' : 'Guardar predicción'}
        </Button>
        <Button
          icon={<ArrowRightOutlined />}
          onClick={onNext}
          disabled={!onNext}
          type="text"
          style={{ color: '#64748b' }}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
