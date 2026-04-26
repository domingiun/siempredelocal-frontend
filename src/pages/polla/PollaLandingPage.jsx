// frontend/src/pages/polla/PollaLandingPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Spin, message } from 'antd';
import {
  TrophyOutlined, TeamOutlined, CalendarOutlined,
  StarOutlined, ThunderboltOutlined, GiftOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import pollaService from '../../services/pollaService';
import './PollaLandingPage.css';

const POLLA_ID = 1; // ID de la Polla Mundial 2026 en la BD

const phaseLabels = {
  groups: 'Fase de Grupos',
  r32: 'Ronda de 32',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinales',
  third: 'Tercer Puesto',
  final: 'Final',
};

const phasePoints = {
  groups: '1 pt (L/E/V)',
  r32: '2 pts (quién avanza)',
  r16: '2 pts (quién avanza)',
  qf: '3 pts (quién avanza)',
  sf: '3 pts (quién avanza)',
  third: '3 pts (quién avanza)',
  final: '3 pts (quién avanza)',
};

export default function PollaLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [polla, setPolla] = useState(null);
  const [myStatus, setMyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    pollaService.listPollas()
      .then(list => {
        const found = list.find(p => p.status !== 'cancelled') || list[0];
        if (found) {
          setPolla(found);
          if (user) {
            return pollaService.getMyStatus(found.id)
              .then(setMyStatus)
              .catch(() => setMyStatus({ is_participant: false }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleJoin = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!polla) return;
    setJoining(true);
    try {
      await pollaService.joinPolla(polla.id);
      message.success('¡Te inscribiste exitosamente!');
      navigate(`/mundial/dashboard`);
    } catch (err) {
      message.error(err?.response?.data?.detail || 'Error al inscribirse');
    } finally {
      setJoining(false);
    }
  };

  const formatCOP = (n) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
      .format(n);

  if (loading) {
    return (
      <div className="polla-landing-loading">
        <Spin size="large" />
      </div>
    );
  }

  const prize = polla?.current_prize_cop || 1_000_000;
  const participants = polla?.participant_count || 0;
  const isOpen = polla?.status === 'open';
  const isParticipant = myStatus?.is_participant;

  return (
    <div className="polla-landing">
      {/* Hero */}
      <section className="polla-hero">
        <div className="polla-hero-bg" />
        <div className="polla-hero-content">
          <div className="polla-badge">
            <span>⚽</span> Mundial 2026
          </div>
          <h1 className="polla-title">
            Polla <span className="polla-title-highlight">Mundial</span> 2026
          </h1>
          <p className="polla-subtitle">
            Predice los resultados del Mundial y gana el pozo acumulado.
            104 partidos. Una sola inscripción.
          </p>

          {/* Stats */}
          <div className="polla-stats">
            <div className="polla-stat">
              <TrophyOutlined className="polla-stat-icon gold" />
              <div>
                <div className="polla-stat-value">{formatCOP(prize)}</div>
                <div className="polla-stat-label">Premio acumulado</div>
              </div>
            </div>
            <div className="polla-stat">
              <TeamOutlined className="polla-stat-icon blue" />
              <div>
                <div className="polla-stat-value">{participants}</div>
                <div className="polla-stat-label">Participantes</div>
              </div>
            </div>
            <div className="polla-stat">
              <CalendarOutlined className="polla-stat-icon green" />
              <div>
                <div className="polla-stat-value">104</div>
                <div className="polla-stat-label">Partidos</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          {isParticipant ? (
            <Button
              type="primary"
              size="large"
              className="polla-cta-btn"
              onClick={() => navigate('/mundial/dashboard')}
            >
              Ir a mi Dashboard →
            </Button>
          ) : isOpen ? (
            <Button
              type="primary"
              size="large"
              className="polla-cta-btn"
              onClick={handleJoin}
              loading={joining}
            >
              Inscribirme — {polla?.entry_credits || 8} créditos
            </Button>
          ) : (
            <Button size="large" className="polla-cta-btn" disabled>
              {polla?.status === 'upcoming' ? 'Próximamente' : 'Inscripciones cerradas'}
            </Button>
          )}

          {isOpen && !isParticipant && (
            <p className="polla-entry-note">
              8 créditos = $40,000 COP · Premio garantizado mínimo: $1,000,000 COP
            </p>
          )}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="polla-how">
        <div className="polla-section-inner">
          <h2 className="polla-section-title">¿Cómo funciona?</h2>
          <div className="polla-steps">
            <div className="polla-step">
              <div className="polla-step-num">1</div>
              <h3>Inscríbete</h3>
              <p>Paga una sola vez con 8 créditos ($40,000 COP). El 80% va al premio.</p>
            </div>
            <div className="polla-step">
              <div className="polla-step-num">2</div>
              <h3>Predice partido a partido</h3>
              <p>Hasta 1 hora antes de cada partido cierra la ventana de predicción.</p>
            </div>
            <div className="polla-step">
              <div className="polla-step-num">3</div>
              <h3>Acumula puntos</h3>
              <p>Puntos base + bonificaciones por racha y fase. Tabla de posiciones en vivo.</p>
            </div>
            <div className="polla-step">
              <div className="polla-step-num">4</div>
              <h3>Gana el pozo</h3>
              <p>El/los líderes al final del mundial se llevan el acumulado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fases y puntos */}
      <section className="polla-phases">
        <div className="polla-section-inner">
          <h2 className="polla-section-title">Sistema de puntuación</h2>
          <div className="polla-phases-grid">
            {Object.entries(phaseLabels).map(([key, label]) => (
              <div key={key} className="polla-phase-card">
                <div className="polla-phase-name">{label}</div>
                <div className="polla-phase-pts">{phasePoints[key]}</div>
              </div>
            ))}
          </div>

          <div className="polla-bonuses">
            <h3>Bonificaciones por fase</h3>
            <div className="polla-bonus-list">
              <div className="polla-bonus-item">
                <ThunderboltOutlined className="polla-bonus-icon" />
                <div>
                  <strong>Racha</strong>
                  <p>3 aciertos consecutivos en la misma fase → +1 punto (una vez por fase)</p>
                </div>
              </div>
              <div className="polla-bonus-item">
                <StarOutlined className="polla-bonus-icon" />
                <div>
                  <strong>Más aciertos</strong>
                  <p>Quién acierte más en la fase de grupos o R32 → +5 pts · Octavos en adelante → +3 pts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premio */}
      <section className="polla-prize">
        <div className="polla-section-inner">
          <h2 className="polla-section-title">El premio</h2>
          <div className="polla-prize-box">
            <GiftOutlined className="polla-prize-icon" />
            <div>
              <p>
                Premio mínimo garantizado: <strong>$1,000,000 COP</strong>.<br />
                A partir del participante 33, el pozo crece <strong>$32,000 COP</strong> por cada nuevo inscrito.<br />
                Premio actual estimado: <strong>{formatCOP(prize)}</strong>
              </p>
              <p className="polla-prize-note">
                El 80% del total recaudado va al ganador. El 20% a la plataforma.<br />
                Si hay empate en puntos, el premio se divide en partes iguales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      {isOpen && !isParticipant && (
        <section className="polla-cta-final">
          <Button
            type="primary"
            size="large"
            className="polla-cta-btn"
            onClick={handleJoin}
            loading={joining}
          >
            Inscribirme ahora — {polla?.entry_credits || 8} créditos
          </Button>
        </section>
      )}
    </div>
  );
}
