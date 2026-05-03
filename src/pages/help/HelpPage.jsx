// frontend/src/pages/help/HelpPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FireOutlined, TrophyOutlined, CreditCardOutlined,
  QuestionCircleOutlined, CheckCircleOutlined, StarOutlined,
  ThunderboltOutlined, GiftOutlined, TeamOutlined,
  CalendarOutlined, RightOutlined, DollarOutlined,
} from '@ant-design/icons';
import './HelpPage.css';

const SECTIONS = [
  { id: 'creditos',     label: 'Créditos',      icon: <CreditCardOutlined /> },
  { id: 'pronosticos',  label: 'Pronósticos',   icon: <FireOutlined /> },
  { id: 'polla',        label: 'Polla Mundial', icon: <TrophyOutlined /> },
  { id: 'faq',          label: 'Preguntas',     icon: <QuestionCircleOutlined /> },
];

const FAQ = [
  {
    q: '¿Puedo participar en las dos modalidades al mismo tiempo?',
    a: 'Sí. Pronósticos y Polla Mundial son completamente independientes. Puedes estar activo en ambas usando los créditos de tu cuenta.',
  },
  {
    q: '¿Qué pasa si hay empate en puntos al final?',
    a: 'En Pronósticos, si dos o más jugadores terminan con el mismo puntaje, el premio se divide en partes iguales entre ellos. Lo mismo aplica para la Polla Mundial.',
  },
  {
    q: '¿Puedo cambiar mi predicción después de enviarla?',
    a: 'No. Una vez enviada tu predicción queda registrada y no se puede modificar. Asegúrate de revisarla bien antes de confirmar.',
  },
  {
    q: '¿Hasta cuándo puedo hacer mis predicciones?',
    a: 'En Pronósticos, hasta 1 hora antes del primer partido de la fecha. En Polla Mundial, hasta 1 hora antes del inicio de cada partido individual.',
  },
  {
    q: '¿Cómo recargo mis créditos?',
    a: 'Ve a "Mi Cuenta" → "Recargar créditos". Selecciona el plan que prefieras y sigue las instrucciones de pago por Nequi. Un administrador aprueba la recarga manualmente.',
  },
  {
    q: '¿Cuándo se entregan los premios?',
    a: 'En Pronósticos, al finalizar y cerrar oficialmente cada fecha. En Polla Mundial, al terminar el torneo completo. El pago se coordina directamente con el administrador.',
  },
  {
    q: '¿Qué pasa si un partido se suspende o aplaza?',
    a: 'Los partidos suspendidos o aplazados no se puntúan. Solo cuentan los partidos que terminan oficialmente.',
  },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="help-page">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="help-hero">
        <div className="help-hero-glow" />
        <div className="help-hero-content">
          <div className="help-hero-badge">
            <QuestionCircleOutlined /> Centro de ayuda
          </div>
          <h1 className="help-hero-title">¿Cómo funciona<br /><span>SiempreDeLocal?</span></h1>
          <p className="help-hero-sub">
            Todo lo que necesitas saber para jugar, ganar puntos y cobrar premios.
          </p>
          <div className="help-nav-pills">
            {SECTIONS.map(s => (
              <button key={s.id} className="help-pill" onClick={() => scrollTo(s.id)}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="help-body">

        {/* ── Créditos ─────────────────────────────────────────── */}
        <section id="creditos" className="help-section">
          <div className="help-section-header">
            <CreditCardOutlined className="help-section-icon blue" />
            <div>
              <h2>Créditos</h2>
              <p>La moneda interna del juego</p>
            </div>
          </div>

          <div className="help-cards-row">
            <div className="help-card help-card--blue">
              <div className="help-card-icon"><DollarOutlined /></div>
              <div className="help-card-val">$5.000 COP</div>
              <div className="help-card-lbl">valor por crédito</div>
            </div>
            <div className="help-card help-card--green">
              <div className="help-card-icon"><CreditCardOutlined /></div>
              <div className="help-card-val">Nequi</div>
              <div className="help-card-lbl">forma de pago</div>
            </div>
            <div className="help-card help-card--purple">
              <div className="help-card-icon"><CheckCircleOutlined /></div>
              <div className="help-card-val">Manual</div>
              <div className="help-card-lbl">aprobación admin</div>
            </div>
          </div>

          <div className="help-info-box">
            <div className="help-info-row">
              <span className="help-info-label">¿Cómo compro créditos?</span>
              <span className="help-info-val">Mi Cuenta → Recargar créditos → elige tu plan → paga por Nequi → espera aprobación</span>
            </div>
            <div className="help-info-row">
              <span className="help-info-label">¿Cuánto demora la aprobación?</span>
              <span className="help-info-val">Generalmente menos de 24 horas en días hábiles</span>
            </div>
            <div className="help-info-row">
              <span className="help-info-label">¿Los créditos vencen?</span>
              <span className="help-info-val">No. Tus créditos permanecen en tu cuenta hasta que los uses</span>
            </div>
          </div>
        </section>

        {/* ── Pronósticos ──────────────────────────────────────── */}
        <section id="pronosticos" className="help-section">
          <div className="help-section-header">
            <FireOutlined className="help-section-icon orange" />
            <div>
              <h2>Pronósticos</h2>
              <p>Predice marcadores, acumula puntos, gana el pozo</p>
            </div>
          </div>

          {/* Datos rápidos */}
          <div className="help-cards-row">
            <div className="help-card help-card--orange">
              <div className="help-card-icon"><CalendarOutlined /></div>
              <div className="help-card-val">2×</div>
              <div className="help-card-lbl">fechas por semana</div>
            </div>
            <div className="help-card help-card--blue">
              <div className="help-card-icon"><FireOutlined /></div>
              <div className="help-card-val">10</div>
              <div className="help-card-lbl">partidos por fecha</div>
            </div>
            <div className="help-card help-card--green">
              <div className="help-card-icon"><CreditCardOutlined /></div>
              <div className="help-card-val">1 crédito</div>
              <div className="help-card-lbl">$5.000 COP por fecha</div>
            </div>
            <div className="help-card help-card--purple">
              <div className="help-card-icon"><TrophyOutlined /></div>
              <div className="help-card-val">Pozo</div>
              <div className="help-card-lbl">acumulado entre fechas</div>
            </div>
          </div>

          {/* Pasos */}
          <h3 className="help-subtitle">¿Cómo funciona?</h3>
          <div className="help-steps">
            {[
              { n: '1', title: 'Inscríbete a la fecha', desc: 'Cada fecha cuesta 1 crédito ($5.000 COP). Puedes inscribirte desde que abre hasta 1 hora antes del primer partido.' },
              { n: '2', title: 'Predice los 10 marcadores', desc: 'Ingresa el marcador exacto que crees que tendrá cada partido. Por ejemplo: Colombia 2 – 1 Argentina.' },
              { n: '3', title: 'Espera los resultados', desc: 'Los marcadores se actualizan en tiempo real. Tus puntos se calculan automáticamente al finalizar cada partido.' },
              { n: '4', title: 'Gana el pozo', desc: 'Quien más puntos acumule al cerrar la fecha se lleva el pozo. Si hay empate, el premio se divide en partes iguales.' },
            ].map(s => (
              <div key={s.n} className="help-step">
                <div className="help-step-num orange">{s.n}</div>
                <div className="help-step-body">
                  <div className="help-step-title">{s.title}</div>
                  <div className="help-step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla de puntos */}
          <h3 className="help-subtitle">Sistema de puntos</h3>
          <div className="help-score-table">
            <div className="help-score-head">
              <span>Tipo de acierto</span>
              <span>Ejemplo</span>
              <span>Puntos</span>
            </div>
            <div className="help-score-row">
              <div className="help-score-type">
                <span className="help-dot" style={{ background: '#22c55e' }} />
                <div>
                  <strong>Marcador exacto</strong>
                  <div className="help-score-sub">Acertaste el resultado y los goles exactos</div>
                </div>
              </div>
              <div className="help-score-ex">Colombia 2–1 → predijiste 2–1 ✓</div>
              <div className="help-score-pts green">+3 pts</div>
            </div>
            <div className="help-score-row">
              <div className="help-score-type">
                <span className="help-dot" style={{ background: '#60a5fa' }} />
                <div>
                  <strong>Resultado correcto</strong>
                  <div className="help-score-sub">Acertaste quién gana o si empata, pero no los goles</div>
                </div>
              </div>
              <div className="help-score-ex">Colombia 2–1 → predijiste 1–0 ✓</div>
              <div className="help-score-pts blue">+1 pt</div>
            </div>
            <div className="help-score-row">
              <div className="help-score-type">
                <span className="help-dot" style={{ background: '#475569' }} />
                <div>
                  <strong>Incorrecto</strong>
                  <div className="help-score-sub">El resultado fue diferente a tu predicción</div>
                </div>
              </div>
              <div className="help-score-ex">Colombia 2–1 → predijiste empate ✗</div>
              <div className="help-score-pts muted">0 pts</div>
            </div>
          </div>

          <div className="help-tip">
            <StarOutlined style={{ color: '#fbbf24' }} />
            <span>Máximo posible en una fecha: <strong>30 puntos</strong> (10 marcadores exactos × 3 pts)</span>
          </div>

          {/* Premio */}
          <h3 className="help-subtitle">El premio</h3>
          <div className="help-prize-box orange">
            <GiftOutlined className="help-prize-icon" />
            <div>
              <p>El pozo se forma con <strong>el 100% de las inscripciones</strong> de cada fecha. A más participantes, mayor el premio.</p>
              <p>El jugador con más puntos al cierre de la fecha <strong>gana el pozo completo</strong>. Si hay empate en el primer lugar, el premio se divide en partes iguales entre los empatados.</p>
            </div>
          </div>
        </section>

        {/* ── Polla Mundial ─────────────────────────────────────── */}
        <section id="polla" className="help-section">
          <div className="help-section-header">
            <TrophyOutlined className="help-section-icon green" />
            <div>
              <h2>Polla Mundial</h2>
              <p>Un torneo completo, una sola inscripción, un gran premio</p>
            </div>
          </div>

          {/* Datos rápidos */}
          <div className="help-cards-row">
            <div className="help-card help-card--gold">
              <div className="help-card-icon"><TrophyOutlined /></div>
              <div className="help-card-val">8 créditos</div>
              <div className="help-card-lbl">$40.000 COP — una vez</div>
            </div>
            <div className="help-card help-card--green">
              <div className="help-card-icon"><CalendarOutlined /></div>
              <div className="help-card-val">104</div>
              <div className="help-card-lbl">partidos en el Mundial</div>
            </div>
            <div className="help-card help-card--blue">
              <div className="help-card-icon"><TeamOutlined /></div>
              <div className="help-card-val">48</div>
              <div className="help-card-lbl">selecciones</div>
            </div>
            <div className="help-card help-card--purple">
              <div className="help-card-icon"><GiftOutlined /></div>
              <div className="help-card-val">Mín. $1M</div>
              <div className="help-card-lbl">premio garantizado</div>
            </div>
          </div>

          {/* Pasos */}
          <h3 className="help-subtitle">¿Cómo funciona?</h3>
          <div className="help-steps">
            {[
              { n: '1', title: 'Inscríbete una sola vez', desc: 'Paga 8 créditos ($40.000 COP) antes del inicio del torneo. Esa única inscripción te da acceso a todos los partidos del Mundial.' },
              { n: '2', title: 'Predice partido a partido', desc: 'Hasta 1 hora antes de cada partido cierra la ventana. En grupos predices Local / Empate / Visitante. En eliminatorias predices quién avanza.' },
              { n: '3', title: 'Acumula puntos en cada fase', desc: 'Los puntos aumentan conforme avanza el torneo. Cuartos, semis y final valen más que la fase de grupos.' },
              { n: '4', title: 'Gana el gran pozo al final', desc: 'Quien más puntos tenga al terminar el último partido del Mundial se lleva el acumulado total.' },
            ].map(s => (
              <div key={s.n} className="help-step">
                <div className="help-step-num green">{s.n}</div>
                <div className="help-step-body">
                  <div className="help-step-title">{s.title}</div>
                  <div className="help-step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla de fases */}
          <h3 className="help-subtitle">Puntos por fase</h3>
          <div className="help-phases">
            {[
              { fase: 'Fase de Grupos', partidos: '72 partidos', tipo: 'Local · Empate · Visitante', pts: 1, color: '#3b82f6', sub: 'Predices el resultado del partido (L/E/V)' },
              { fase: 'Ronda de 32 · Octavos', partidos: '24 partidos', tipo: '¿Quién avanza?', pts: 2, color: '#8b5cf6', sub: 'Predices el equipo que pasa a la siguiente ronda' },
              { fase: 'Cuartos · Semis · Final', partidos: '8 partidos', tipo: '¿Quién avanza?', pts: 3, color: '#22c55e', sub: 'Más puntos porque es más difícil de predecir' },
            ].map((row, i) => (
              <div key={i} className="help-phase-row">
                <div className="help-phase-left">
                  <span className="help-dot" style={{ background: row.color }} />
                  <div>
                    <div className="help-phase-name">{row.fase}</div>
                    <div className="help-phase-sub">{row.sub}</div>
                    <div className="help-phase-count">{row.partidos} · {row.tipo}</div>
                  </div>
                </div>
                <div className="help-phase-pts" style={{ color: row.color }}>+{row.pts} pt{row.pts > 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>

          {/* Bonificaciones */}
          <h3 className="help-subtitle">Bonificaciones</h3>
          <div className="help-bonuses">
            <div className="help-bonus-item">
              <div className="help-bonus-icon"><ThunderboltOutlined /></div>
              <div>
                <div className="help-bonus-title">Racha de aciertos</div>
                <div className="help-bonus-desc">
                  Si aciertas <strong>3 predicciones seguidas</strong> dentro de la misma fase → <span className="help-hl green">+1 punto</span><br />
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Solo se da una vez por fase. Si fallas, el contador se reinicia.</span>
                </div>
              </div>
            </div>
            <div className="help-bonus-item">
              <div className="help-bonus-icon"><StarOutlined /></div>
              <div>
                <div className="help-bonus-title">Mejor de la fase</div>
                <div className="help-bonus-desc">
                  Quien más aciertos tenga en la fase de grupos o ronda de 32 → <span className="help-hl gold">+5 puntos</span><br />
                  En octavos en adelante → <span className="help-hl gold">+3 puntos</span><br />
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Si hay empate, todos los empatados reciben la bonificación.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premio */}
          <h3 className="help-subtitle">El premio</h3>
          <div className="help-prize-box green">
            <GiftOutlined className="help-prize-icon" />
            <div>
              <p>El pozo garantizado mínimo es <strong>$1.000.000 COP</strong>. Cada inscripción de 8 créditos suma al acumulado — entre más participantes, mayor el premio.</p>
              <p>El jugador con más puntos al finalizar el último partido del Mundial <strong>gana el pozo total</strong>. En caso de empate, el premio se divide en partes iguales.</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section id="faq" className="help-section">
          <div className="help-section-header">
            <QuestionCircleOutlined className="help-section-icon blue" />
            <div>
              <h2>Preguntas frecuentes</h2>
              <p>Las dudas más comunes resueltas</p>
            </div>
          </div>

          <div className="help-faq">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className={`help-faq-item ${openFaq === i ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="help-faq-q">
                  <span>{item.q}</span>
                  <RightOutlined className="help-faq-arrow" />
                </div>
                {openFaq === i && (
                  <div className="help-faq-a">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA final ────────────────────────────────────────── */}
        <div className="help-cta">
          <p>¿Listo para jugar?</p>
          <div className="help-cta-btns">
            <button className="help-cta-btn orange" onClick={() => navigate('/bets')}>
              <FireOutlined /> Ir a Pronósticos
            </button>
            <button className="help-cta-btn green" onClick={() => navigate('/mundial/dashboard')}>
              <TrophyOutlined /> Ir a Polla Mundial
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
