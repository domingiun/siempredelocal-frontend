// frontend/src/components/bets/PlaceBetForm.jsx
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  Card, Row, Col, Typography, Button,
  InputNumber, Alert,
  message, Spin, Divider, Tag,
  Modal
} from 'antd';
import {
  FireOutlined, TeamOutlined, CheckCircleOutlined,
  ClockCircleOutlined, TrophyOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import betService from '../../services/betService';
import matchService from '../../services/matchService';
import { 
  validatePredictions, 
  calculateTimeRemaining 
} from '../../utils/betCalculations';
import { formatDateTimeShort as formatDateTimeShortUTC, formatForInputUTC } from '../../utils/dateFormatter';

const { Title, Text } = Typography;
const PlaceBetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wallet, placeBet, hasEnoughCredits } = useWallet();
  
  const [betDate, setBetDate] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if (id) {
      fetchBetDateDetails();
    }
  }, [id]);

  const fetchBetDateDetails = async () => {
    setLoading(true);
    try {
      // Obtener detalles de la fecha CON los partidos incluidos
      const response = await betService.getBetDateDetails(id);
      const data = response.data;
      
      console.log('📋 Datos de fecha recibidos:', data);
      
      setBetDate(data);
      
      // Usar los matches que vienen en la respuesta
      const matchDetails = data.matches || [];
      
      console.log('⚽ Partidos recibidos:', matchDetails.length, matchDetails);

      // Obtener logos de equipos por match_id
      const logosByMatchId = {};
      await Promise.all(
        matchDetails.map(async (match) => {
          try {
            const res = await matchService.getById(match.id);
            const matchData = res.data || {};
            logosByMatchId[match.id] = {
              home_team_logo: matchData.home_team?.logo_url || null,
              away_team_logo: matchData.away_team?.logo_url || null
            };
          } catch (error) {
            logosByMatchId[match.id] = {
              home_team_logo: null,
              away_team_logo: null
            };
          }
        })
      );
      
      // Formatear los datos para el componente
      const formattedMatches = matchDetails.map((match, index) => ({
        id: match.id,
        match_id: match.id,
        home_team_name: match.home_team,
        away_team_name: match.away_team,
        match_date: match.match_date,
        stadium: match.stadium,
        competition_name: match.competition,
        status: match.status,
        home_team_logo: logosByMatchId[match.id]?.home_team_logo || null,
        away_team_logo: logosByMatchId[match.id]?.away_team_logo || null
      }));
      const sortedMatches = [...formattedMatches].sort((a, b) => {
        const aTime = a.match_date ? new Date(a.match_date).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.match_date ? new Date(b.match_date).getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      });
      
      setMatches(sortedMatches);
      
      // Inicializar predicciones vacías
      const initialPredictions = {};
      sortedMatches.forEach(match => {
        initialPredictions[match.id] = {
          match_id: match.id,
          home_score: null,
          away_score: null
        };
      });
      
      setPredictions(initialPredictions);
      
      console.log('✅ Predicciones inicializadas:', initialPredictions);
      
    } catch (error) {
      console.error('❌ Error cargando detalles:', error);
      message.error('Error al cargar la fecha de los pronósticos');
      navigate('/bets');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionChange = (matchId, field, value) => {
    lastScrollYRef.current = window.scrollY;
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value ?? null
      }
    }));
  };

  useLayoutEffect(() => {
    if (lastScrollYRef.current > 0) {
      const y = lastScrollYRef.current;
      requestAnimationFrame(() => window.scrollTo({ top: y }));
    }
  }, [predictions]);

  const validateBeforeSubmit = async () => {
    // Verificar que la fecha esté abierta
    if (!betDate || !(betDate.is_betting_open ?? betDate.status === 'open')) {
      message.error('Esta fecha ya no está abierta para los pronósticos');
      return false;
    }
    
    // Verificar créditos
    if (!hasEnoughCredits()) {
      message.error('No tienes créditos suficientes');
      return false;
    }
    
    // Validar predicciones
    const predictionArray = Object.values(predictions);
    const validationErrors = validatePredictions(predictionArray);
    
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => message.error(error));
      return false;
    }
    return true;    
  };

  const handleSubmit = async () => {
    const isValid = await validateBeforeSubmit();
    if (!isValid) return;
    
    setSubmitting(true);
    try {
      const predictionArray = Object.values(predictions).map(p => ({
        match_id: p.match_id,
        predicted_home_score: p.home_score,
        predicted_away_score: p.away_score
      }));
      
      // Mostrar confirmación
      Modal.confirm({
        title: 'Confirmar Pronóstico',
        content: (
          <div>
            <p>¿Estás seguro de enviar esta predicción?</p>
            <ul>
              <li>Se descontará <strong>1 crédito</strong> de tu saldo</li>
              <li>No podrás modificar la predicción después</li>
              <li>El premio potencial es: <strong>${((betDate.total_prize || 0) || ((betDate.prize_PTS || 0) + (betDate.accumulated_prize || 0)) || (betDate.prize_cop || 0)).toLocaleString()} PTS</strong></li>
            </ul>
          </div>
        ),
        okText: 'Sí, apostar',
        cancelText: 'Cancelar',
        okButtonProps: {
          style: {
            backgroundColor: '#0958d9',
            borderColor: '#0958d9',
            color: '#ffffff',
            fontWeight: 600
          }
        },
        onOk: async () => {
          const result = await placeBet(id, predictionArray);
          if (result.success) {
            message.success('¡Pronósticos realizados con éxito!');
            navigate('/active-bets');
          }
        },
        onCancel: () => {
          setSubmitting(false);
        }
      });
      
    } catch (error) {
      console.error('Error enviando apuesta:', error);
      message.error('Error al enviar la apuesta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (matchId, result) => {
    const [home, away] = result.split('-').map(Number);
    handlePredictionChange(matchId, 'home_score', home);
    handlePredictionChange(matchId, 'away_score', away);
  };

  const MatchPredictionCard = ({ match, index }) => {
    const prediction = predictions[match.match_id] || {};
    const filled = prediction.home_score != null && prediction.away_score != null;

    return (
      <Card
        className="match-prediction-card"
        style={{
          marginBottom: 8,
          borderLeft: `3px solid ${filled ? '#52c41a' : '#1677ff'}`,
        }}
        styles={{ body: { padding: '10px 12px' } }}
      >
        {/* Meta: número + competencia + fecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Tag color="blue" style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px' }}>{index + 1}</Tag>
          {match.competition_name && (
            <Text type="secondary" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {match.competition_name}
            </Text>
          )}
          <Text type="secondary" style={{ fontSize: 11, flexShrink: 0, whiteSpace: 'nowrap' }}>
            {match.match_date ? formatDateTimeShortUTC(formatForInputUTC(match.match_date)) : '—'}
          </Text>
        </div>

        {/* Fila de equipos: logo + nombre | vs | nombre + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {/* Local */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            {match.home_team_logo
              ? <img src={match.home_team_logo} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <TeamOutlined style={{ fontSize: 20, flexShrink: 0 }} />}
            <Text style={{ fontSize: 11, lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {match.home_team_name}
            </Text>
          </div>

          <Text type="secondary" style={{ fontSize: 12, flexShrink: 0, padding: '0 2px' }}>vs</Text>

          {/* Visitante — logo a la derecha */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flexDirection: 'row-reverse' }}>
            {match.away_team_logo
              ? <img src={match.away_team_logo} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <TeamOutlined style={{ fontSize: 20, flexShrink: 0 }} />}
            <Text style={{ fontSize: 11, lineHeight: 1.25, overflow: 'hidden', textAlign: 'right', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {match.away_team_name}
            </Text>
          </div>
        </div>

        {/* Inputs centrados */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <InputNumber
            min={0} max={15}
            value={prediction.home_score ?? null}
            onChange={(value) => handlePredictionChange(match.match_id, 'home_score', value)}
            controls={false}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            className="score-input"
            style={{ width: 60, textAlign: 'center', border: '2px solid #1677ff', borderRadius: 8 }}
            size="large"
          />
          <Text strong style={{ fontSize: 18 }}>-</Text>
          <InputNumber
            min={0} max={15}
            value={prediction.away_score ?? null}
            onChange={(value) => handlePredictionChange(match.match_id, 'away_score', value)}
            controls={false}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            className="score-input"
            style={{ width: 60, textAlign: 'center', border: '2px solid #1677ff', borderRadius: 8 }}
            size="large"
          />
        </div>

        {/* Estadio */}
        {match.stadium && (
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <Text type="secondary" style={{ fontSize: 10 }}>{match.stadium}</Text>
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Cargando fecha de los pronósticos...</p>
      </div>
    );
  }

  if (!betDate) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          title="Fecha no encontrada"
          description="La fecha de los pronósticos que buscas no existe o fue eliminada."
          type="error"
          showIcon
        />
        <Button 
          onClick={() => navigate('/bets')}
          style={{ marginTop: 16 }}
        >
          Volver a fechas
        </Button>
      </div>
    );
  }

  const isOpen = betDate.is_betting_open ?? betDate.status === 'open';
  const closedLabel = betDate.status === 'finished' ? 'finalizada' : 'cerrada';
  const completedCount = Object.values(predictions).filter(
    p => p.home_score != null && p.away_score != null
  ).length;


  return (
    <div className={isDark ? 'place-bet place-bet--dark' : 'place-bet'} style={{ padding: '14px', maxWidth: 1200, margin: '0 auto' }} role="main">
      <style>{`
        .place-bet {
          width: 100%;
        }
        .match-prediction-card {
          border-radius: 12px;
        }
        .match-prediction-card .team-name {
          font-size: 12px;
          line-height: 1.2;
          word-break: break-word;
        }
        .place-bet--dark {
          background: radial-gradient(1200px 600px at 10% 0%, #1a2a36 0%, #0c1116 45%, #0b0f14 100%);
          color: #e6edf3;
          border-radius: 16px;
          padding: 18px;
        }
        .place-bet--dark .ant-card {
          background: #0f1720;
          border-color: #1f2a36;
          color: #e6edf3;
        }
        .place-bet--dark .match-prediction-card .ant-card-head {
          background: #0c141c;
        }
        .place-bet--dark .match-prediction-card .ant-card-extra,
        .place-bet--dark .match-prediction-card .ant-card-head-title {
          color: #cbd5e1;
        }
        .place-bet--dark .ant-card-head {
          border-bottom-color: #1f2a36;
        }
        .place-bet--dark .ant-typography,
        .place-bet--dark .ant-typography-secondary {
          color: #e6edf3;
        }
        .place-bet--dark .ant-typography-secondary {
          color: #98a6b3;
        }
        .place-bet--dark .ant-tag {
          border-color: #1f2a36;
          background: #111b26;
          color: #b9c7d6;
        }
        .place-bet--dark .ant-alert {
          background: #0f1720;
          border-color: #2a3948;
          color: #e6edf3;
        }
        .place-bet--dark .ant-alert-message,
        .place-bet--dark .ant-alert-description {
          color: #e6edf3;
        }
        .place-bet--dark .ant-alert-warning {
          background: #1a1306;
          border-color: #6b4b12;
        }
        .place-bet--dark .ant-alert-info {
          background: #0b1522;
          border-color: #1d3b63;
        }
        .place-bet--dark .ant-divider {
          border-color: #1f2a36;
        }
        .place-bet--dark .ant-statistic-title {
          color: #e6edf3;
        }
        .place-bet--dark .ant-statistic-content {
          color: #e6edf3;
        }
        .place-bet--dark .ant-statistic-content-prefix,
        .place-bet--dark .ant-statistic-content-suffix {
          color: #cbd5e1;
        }
        .place-bet--dark .ant-statistic .ant-statistic-title {
          color: #e6edf3 !important;
        }
        .place-bet--dark .ant-alert-warning .ant-alert-message,
        .place-bet--dark .ant-alert-warning .ant-alert-description {
          color: #e6edf3 !important;
        }
        .place-bet--dark .ant-alert-message,
        .place-bet--dark .ant-alert-description {
          color: #e6edf3 !important;
        }
        .score-input .ant-input-number-input {
          height: 38px;
          font-size: 16px;
          text-align: center;
          line-height: 38px;
          padding: 0 6px;
          color: #111827;
          -webkit-text-fill-color: #111827;
          font-weight: 600;
        }
        .score-input input::placeholder {
          color: #9aa5b1;
          -webkit-text-fill-color: #9aa5b1;
        }
        .score-input .ant-input-number-handler-wrap {
          display: none;
        }
        .score-input input {
          color: #111827;
          -webkit-text-fill-color: #111827;
          opacity: 1;
        }
        .place-bet--dark .score-input {
          background: #0b1117;
          border-color: #3b82f6 !important;
          color: #e6edf3;
        }
        .place-bet--dark .score-input input {
          color: #e6edf3;
          -webkit-text-fill-color: #e6edf3;
          opacity: 1;
        }
        .place-bet--dark .score-input input::placeholder {
          color: #94a3b8;
          -webkit-text-fill-color: #94a3b8;
        }
        .place-bet--dark .btn-back {
          background: #0f1720;
          border-color: #2a3948;
          color: #e6edf3;
        }

        @media (max-width: 768px) {
          .place-bet {
            padding: 8px !important;
            max-width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          .score-input .ant-input-number-input {
            height: 34px;
            font-size: 14px;
            line-height: 34px;
          }
          .score-input {
            width: 54px !important;
            min-width: 54px !important;
          }
        }

        /* ── BARRA STICKY MÓVIL ── */
        .place-bet__mobile-bar {
          display: none;
        }
        @media (max-width: 768px) {
          /* Espacio para que la barra no tape el último elemento */
          .place-bet {
            padding-bottom: 80px !important;
          }
          .place-bet__mobile-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 200;
            padding: 10px 16px;
            padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
            background: #ffffff;
            border-top: 1px solid #e8edf3;
            box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.10);
          }
          .place-bet--dark .place-bet__mobile-bar {
            background: #0c141f;
            border-top-color: #1f2b3a;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.40);
          }
          .place-bet__bar-progress {
            display: flex;
            flex-direction: column;
            line-height: 1.2;
          }
          .place-bet__bar-count {
            font-size: 18px;
            font-weight: 800;
            color: #1677ff;
          }
          .place-bet__bar-label {
            font-size: 11px;
            color: #8c9ab0;
          }
          .place-bet--dark .place-bet__bar-label {
            color: #6b7a8d;
          }
          /* Separador entre numero y "de 10" */
          .place-bet__bar-count span {
            font-size: 12px;
            font-weight: 500;
            color: #8c9ab0;
            margin-left: 2px;
          }
        }

        @media (max-width: 576px) {
          .score-input .ant-input-number-input {
            font-size: 13px;
          }
          .match-prediction-card .team-name {
            font-size: 10px;
          }
          .score-input {
            width: 50px !important;
            min-width: 50px !important;
          }
        }
      `}</style>
      {/* ── Encabezado compacto ── */}
      <div style={{ marginBottom: 12, padding: '10px 4px' }}>
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 6 }}>
          <FireOutlined style={{ marginRight: 6, color: '#1677ff' }} />
          {betDate.name || `Fecha #${betDate.id}`}
        </Text>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#52c41a', fontWeight: 700, fontSize: 13 }}>
            <TrophyOutlined />
            {(
              (betDate.total_prize || 0) ||
              ((betDate.prize_PTS || 0) + (betDate.accumulated_prize || 0)) ||
              (betDate.prize_cop || 0)
            ).toLocaleString()} PTS
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1890ff', fontSize: 13 }}>
            <ClockCircleOutlined />
            {calculateTimeRemaining(betDate)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: wallet.credits > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 700, fontSize: 13 }}>
            <FireOutlined />
            {wallet.credits} cr
          </span>
        </div>
      </div>

      {!isOpen && (
        <Alert
          message={<strong>Esta fecha ya está cerrada</strong>}
          description={
            <span>
              Ya no puedes apostar. La fecha está {closedLabel}.{' '}
              <strong>Pronto se abrirán otras fechas disponibles.</strong>
            </span>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 12, borderRadius: 8 }}
        />
      )}

      <div>
        {isOpen ? (
          <>
            <Title level={4}>Pronostica los 10 partidos</Title>
            <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
              Ingresa el marcador que crees que tendra cada partido
            </Text>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[12, 8]}>
              {matches.map((match, index) => (
                <Col xs={24} lg={12} key={match.match_id}>
                  <MatchPredictionCard 
                    match={match} 
                    index={index} 
                  />
                </Col>
              ))}
            </Row>

            <Card size="small" style={{ marginTop: 16 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong>Predicciones completadas:</Text>
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {Object.values(predictions).filter(p => p.home_score != null && p.away_score != null).length}/10
                  </Tag>
                </Col>
                <Col>
                </Col>
              </Row>
            </Card>

            <Alert
              title="Importante: Una vez enviada, no podras modificar tu pronóstico."
              type="warning"
              showIcon
              style={{ marginTop: 6 }}
            />

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <Button className="btn-back" onClick={() => navigate('/bets')} disabled={submitting}>
                Volver
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting || !hasEnoughCredits()}
                style={{
                  backgroundColor: '#0958d9',
                  borderColor: '#0958d9',
                  color: '#ffffff',
                  fontWeight: 600
                }}
              >
                {hasEnoughCredits() ? 'Enviar Pronósticos' : 'Sin Creditos'}
              </Button>
            </div>

            {/* ── BARRA STICKY MÓVIL — solo visible en ≤ 768px ── */}
            <div className="place-bet__mobile-bar">
              <div className="place-bet__bar-progress">
                <span className="place-bet__bar-count">
                  {completedCount}<span>/{matches.length}</span>
                </span>
                <span className="place-bet__bar-label">completados</span>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting || !hasEnoughCredits() || completedCount < matches.length}
                style={{
                  backgroundColor: !hasEnoughCredits()
                    ? '#cf1322'
                    : completedCount === matches.length
                      ? '#0958d9'
                      : '#1d4ed8',
                  borderColor: !hasEnoughCredits() ? '#cf1322' : '#0958d9',
                  color: '#ffffff',
                  fontWeight: 700,
                  minWidth: 150,
                  opacity: 1,
                }}
              >
                {!hasEnoughCredits()
                  ? 'Sin Créditos'
                  : completedCount < matches.length
                    ? `Faltan ${matches.length - completedCount}`
                    : 'Enviar pronósticos'
                }
              </Button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <Title level={4} style={{ marginBottom: 8 }}>Fecha {closedLabel}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Los partidos de esta fecha ya no estan disponibles para pronósticos.
            </Text>
            <Button
              type="primary"
              onClick={() => navigate('/bets')}
              style={{
                backgroundColor: '#0958d9',
                borderColor: '#0958d9',
                color: '#ffffff',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(9, 88, 217, 0.35)'
              }}
            >
              Ver otras fechas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceBetForm;

