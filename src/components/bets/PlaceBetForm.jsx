// frontend/src/components/bets/PlaceBetForm.jsx
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { 
  Card, Row, Col, Typography, Button, 
  InputNumber, Space, Alert,
  message, Spin, Divider, Tag,
  Statistic, Modal, Switch
} from 'antd';
import { 
  FireOutlined, TeamOutlined, CheckCircleOutlined,
  DollarOutlined, ClockCircleOutlined
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
  const { mode, setMode } = useTheme();
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
    
    return (
      <Card 
        size="small"
        className="match-prediction-card"
        style={{ marginBottom: 6 }}
        title={
          <Space className="match-head">
            <Tag color="blue">Partido {index + 1}</Tag>
            <Text className="match-competition">{match.competition_name}</Text>
            <div className="match-head-divider" />
          </Space>
        }
        extra={
          <Text type="secondary" className="match-datetime">
            {match.match_date ? formatDateTimeShortUTC(formatForInputUTC(match.match_date)) : 'Fecha por definir'}
          </Text>
        }
      >
        <Row gutter={[16, 16]} align="middle" className="match-row">
          {/* Equipo Local */}
          <Col xs={9} md={9}>
            <Space orientation="vertical" align="center" style={{ width: '100%' }}>
              {match.home_team_logo ? (
                <img 
                  src={match.home_team_logo} 
                  alt={match.home_team_name}
                  className="team-logo"
                  style={{ width: 40, height: 40, borderRadius: '50%' }}
                />
              ) : (
                <TeamOutlined style={{ fontSize: 24 }} />
              )}
              <Text strong className="team-name" style={{ textAlign: 'center' }}>
                {match.home_team_name}
              </Text>
            </Space>
          </Col>
          
          {/* Marcador */}
          <Col xs={6} md={6}>
            <Space orientation="vertical" align="center" style={{ width: '100%' }}>
              <Row gutter={6} className="score-row">
                <Col xs={12} md={10}>
                  <InputNumber
                    min={0}
                    max={15}
                    value={prediction.home_score ?? null}
                    onChange={(value) => handlePredictionChange(match.match_id, 'home_score', value)}
                    controls={false}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder=""
                    className="score-input"
                    style={{ 
                      width: '100%', 
                      textAlign: 'center',
                      border: '2px solid #1677ff',
                      borderRadius: 8
                    }}
                    size="large"
                  />
                </Col>
                <Col xs={0} md={4} className="score-separator" style={{ textAlign: 'center', lineHeight: '32px' }}>
                  <Text strong>-</Text>
                </Col>
                <Col xs={12} md={10}>
                  <InputNumber
                    min={0}
                    max={15}
                    value={prediction.away_score ?? null}
                    onChange={(value) => handlePredictionChange(match.match_id, 'away_score', value)}
                    controls={false}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder=""
                    className="score-input"
                    style={{ 
                      width: '100%', 
                      textAlign: 'center',
                      border: '2px solid #1677ff',
                      borderRadius: 8
                    }}
                    size="large"
                  />
                </Col>
              </Row>
              
              
            </Space>
          </Col>
          
          {/* Equipo Visitante */}
          <Col xs={9} md={9}>
            <Space orientation="vertical" align="center" style={{ width: '100%' }}>
              {match.away_team_logo ? (
                <img 
                  src={match.away_team_logo} 
                  alt={match.away_team_name}
                  className="team-logo"
                  style={{ width: 40, height: 40, borderRadius: '50%' }}
                />
              ) : (
                <TeamOutlined style={{ fontSize: 24 }} />
              )}
              <Text strong className="team-name" style={{ textAlign: 'center' }}>
                {match.away_team_name}
              </Text>
            </Space>
          </Col>
        </Row>
        
        {/* Estadio */}
        {match.stadium && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text type="secondary" className="match-stadium" style={{ fontSize: '12px' }}>
              {match.stadium}
            </Text>
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


  return (
    <div className={isDark ? 'place-bet place-bet--dark' : 'place-bet'} style={{ padding: '14px', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        .place-bet {
          width: 100%;
        }
        .match-prediction-card {
          border-radius: 14px;
        }
        .match-prediction-card .ant-card-head {
          border-bottom: 1px solid #1f2a36;
        }
        .match-prediction-card .ant-card-head-title {
          font-size: 13px;
        }
        .match-prediction-card .ant-card-extra {
          font-size: 12px;
        }
        .match-prediction-card .match-head {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .match-prediction-card .ant-card-head-title {
          display: block;
          width: 100%;
          white-space: normal;
        }
        .match-prediction-card .match-competition {
          font-size: 13px;
        }
        .match-prediction-card .match-head-divider {
          height: 1px;
          background: #1f2a36;
          width: 100%;
          opacity: 0.7;
          margin-top: 2px;
          display: none;
        }
        .match-prediction-card .ant-card-head-title .ant-tag {
          font-size: 11px;
          height: 20px;
          line-height: 18px;
          padding: 0 6px;
        }
        .match-prediction-card .team-name {
          font-size: 13px;
          line-height: 1.2;
          word-break: break-word;
        }
        .match-prediction-card .team-logo {
          width: 40px !important;
          height: 40px !important;
        }
        .match-prediction-card .ant-card-extra {
          white-space: nowrap;
        }
        .score-row {
          width: 100%;
        }
        .match-datetime {
          font-size: 12px;
          white-space: nowrap;
        }
        .match-stadium {
          font-size: 12px;
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
          .match-prediction-card {
            border-radius: 12px;
          }
          .match-prediction-card .ant-card-head {
            padding: 8px 12px;
          }
          .match-prediction-card .ant-card-body {
            padding: 10px 12px;
          }
          .match-prediction-card .ant-card-head-title {
            font-size: 12px;
          }
          .match-prediction-card .ant-card-extra {
            font-size: 11px;
          }
          .match-prediction-card .match-competition {
            font-size: 11px;
          }
          .match-prediction-card .match-head {
            align-items: flex-start;
            gap: 4px;
          }
          .match-prediction-card .match-head-divider {
            display: block;
          }
          .match-prediction-card .ant-card-head {
            display: flex;
            flex-direction: column;
            gap: 6px;
            align-items: flex-start;
          }
          .match-prediction-card .ant-card-head-title {
            width: 100%;
          }
          .match-prediction-card .ant-card-extra {
            width: 100%;
            white-space: normal;
          }
          .match-datetime {
            font-size: 11px;
          }
          .match-stadium {
            font-size: 11px;
          }
          .match-prediction-card .ant-card-head-title .ant-tag {
            font-size: 10px;
            height: 18px;
            line-height: 16px;
            padding: 0 5px;
          }
          .match-row {
            margin-left: 0 !important;
            margin-right: 0 !important;
            row-gap: 8px;
          }
          .match-row > .ant-col {
            padding-left: 4px !important;
            padding-right: 4px !important;
          }
          .match-prediction-card .team-name {
            font-size: 11px;
          }
          .match-prediction-card .team-logo {
            width: 28px !important;
            height: 28px !important;
          }
          .score-separator {
            display: none;
          }
          .place-bet .ant-card {
            border-radius: 12px;
          }
          .place-bet h3 {
            font-size: 18px !important;
          }
          .place-bet h4 {
            font-size: 16px !important;
          }
          .place-bet .ant-typography,
          .place-bet .ant-typography-secondary,
          .place-bet .ant-statistic-title {
            font-size: 13px;
          }
          .place-bet .ant-statistic-content {
            font-size: 20px;
          }
          .score-input .ant-input-number-input {
            height: 34px;
            font-size: 14px;
            line-height: 34px;
          }
          .score-row {
            justify-content: center;
            column-gap: 6px;
          }
          .score-row .ant-col {
            padding-left: 3px !important;
            padding-right: 3px !important;
          }
          .score-input {
            width: 60px !important;
            min-width: 60px !important;
            z-index: 1;
          }
        }

        @media (max-width: 576px) {
          .match-prediction-card .ant-card-head-title {
            font-size: 11px;
          }
          .match-prediction-card .ant-card-extra {
            font-size: 10px;
          }
          .score-input .ant-input-number-input {
            font-size: 13px;
          }
          .match-prediction-card .team-name {
            font-size: 10px;
          }
          .match-prediction-card .team-logo {
            width: 26px !important;
            height: 26px !important;
          }
          .match-prediction-card .match-competition {
            font-size: 10px;
          }
          .match-prediction-card .ant-typography-secondary {
            font-size: 11px;
          }
          .match-prediction-card .ant-card-body {
            padding: 8px 10px;
          }
          .score-input {
            width: 58px !important;
            min-width: 58px !important;
            z-index: 1;
          }
          .match-datetime,
          .match-stadium {
            font-size: 10px;
          }
        }
      `}</style>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <Space size="small">
            <Text type="secondary">Vista oscura</Text>
            <Switch checked={isDark} onChange={(checked) => setMode(checked ? 'dark' : 'light')} />
          </Space>
        </div>
        {!isOpen && (
          <Alert
            message={<Text style={{ color: isDark ? '#e6edf3' : undefined }}><strong> ESTA FECHA YA ESTA CERRADA</strong></Text>}
            description={
              <div>
                <Text strong style={{ color: isDark ? '#e6edf3' : undefined }}>
                  En esta oportunidad no pudistes estar con tus pronósticos ya la fecha esta {closedLabel}.
                </Text>
                <Text type="secondary" style={{ display: 'block', color: isDark ? '#cbd5e1' : undefined }}>
                  Ya no puedes apostar. Las fechas se cierran 1 hora antes del primer partido programado. 
                </Text>
                <Text><strong>Pronto se abriran otras fechas disponibles para pronosticar.</strong></Text>
              </div>
            }
            type="warning"
            showIcon
            banner
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              <FireOutlined style={{ marginRight: 8 }} />
              {betDate.name || `Fecha #${betDate.id}`}
            </Title>
            <Text type="secondary">{betDate.description}</Text>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Statistic
                title="Premio acumulado en esta Fecha"
                value={
                  (betDate.total_prize || 0) ||
                  ((betDate.prize_PTS || 0) + (betDate.accumulated_prize || 0)) ||
                  (betDate.prize_cop || 0)
                }
                prefix={<DollarOutlined />}
                suffix="PTS"
                styles={{ content: { color: '#52c41a' }}}
              />
            </Col>
            <Col xs={24} md={8}>
              <Statistic
                title="Tiempo Restante"
                value={calculateTimeRemaining(betDate)}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col xs={24} md={8}>
              <Statistic
                title="Tus Creditos"
                value={wallet.credits}
                prefix={<FireOutlined />}
                styles={{ content: { color: wallet.credits > 0 ? '#52c41a' : '#ff4d4f' }}}
              />
            </Col>
          </Row>

          
        </Space>
      </Card>

      <Card>
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
      </Card>
    </div>
  );
};

export default PlaceBetForm;

