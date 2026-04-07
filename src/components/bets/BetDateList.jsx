// frontend/src/components/bets/BetDateList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, Tag, Button, 
  Space, Statistic, Badge, Alert, Spin, message, Modal, Avatar, Switch 
} from 'antd';
import { 
  CalendarOutlined, FireOutlined, TrophyOutlined, 
  TeamOutlined, ClockCircleOutlined, DollarOutlined,
  EyeOutlined, PlayCircleOutlined, LockOutlined, HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import betService from '../../services/betService';
import { calculateTimeRemaining } from '../../utils/betCalculations';
import matchService from '../../services/matchService';
import { formatDateTimeShortUTC } from '../../utils/dateFormatter';

const { Title, Text } = Typography;

const BetDateList = () => {
  const navigate = useNavigate();
  const { wallet, hasEnoughCredits } = useWallet();
  const [betDates, setBetDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  const [stats, setStats] = useState({
    total_bets: 0,
    active_dates: 0,
    total_prize: 0,
    average_bets: 0
  });
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsBetDate, setResultsBetDate] = useState(null);
  const [resultsMatches, setResultsMatches] = useState([]);

  const getBetDateSortValue = (betDate) => {
    const rawDate = betDate?.start_datetime || betDate?.close_datetime || betDate?.match_date;
    const time = rawDate ? new Date(rawDate).getTime() : NaN;
    if (Number.isFinite(time)) return time;
    return Number.isFinite(betDate?.id) ? betDate.id : 0;
  };

  useEffect(() => {
    fetchBetDates();
  }, []);


  const normalizeMatchStatus = (status) => {
    if (!status) return '';
    return String(status).toLowerCase().trim();
  };

  const isMatchFinished = (status) => {
    const normalized = normalizeMatchStatus(status);
    return normalized === 'finished' || normalized.includes('finalizado');
  };

  const deriveBetDateStatus = (betDate) => {
    const matches = betDate.matches || [];
    if (matches.length === 0) return betDate.status || 'open';

    const now = new Date();
    const allFinished = matches.every(m => isMatchFinished(m.status));
    if (allFinished) return 'finished';

    const hasPastMatch = matches.some(m => {
      if (!m.match_date) return false;
      const matchDate = new Date(m.match_date);
      return matchDate < now;
    });

    if (hasPastMatch) return 'closed';
    return betDate.status || 'open';
  };

  // frontend/src/components/bets/BetDateList.jsx
  const fetchBetDates = async () => {
    setLoading(true);
    try {
      // Obtener lista de fechas (sin detalles completos)
      const response = await betService.getBetDates({ 
        limit: 20 
      });
      
      const dates = response.data || [];
      
      // Para cada fecha, obtener los detalles completos CON partidos
      const enrichedDates = await Promise.all(
        dates.map(async (date) => {
          try {
            // Obtener detalles completos de cada fecha
            const detailResponse = await betService.getBetDateDetails(date.id);
            return {
              ...date,
              // Agregar campos que vienen en el endpoint detallado
              matches: detailResponse.data.matches || [],
              bet_count: detailResponse.data.bet_count || 0,
              remaining_time: detailResponse.data.remaining_time,
              is_betting_open: detailResponse.data.is_betting_open,
              total_prize: detailResponse.data.total_prize || 0
            };
          } catch (error) {
            console.error(`Error obteniendo detalles fecha ${date.id}:`, error);
            return date; // Retornar fecha básica si hay error
          }
        })
      );
      
      const withUiStatus = enrichedDates.map(d => ({ ...d, uiStatus: deriveBetDateStatus(d) }));
      setBetDates(withUiStatus);
      
      // Calcular estadísticas
      const activeCount = withUiStatus.filter(d => d.uiStatus === 'open').length;
      const totalPrize = withUiStatus.reduce((sum, date) => sum + (date.total_prize || 0), 0);
      const totalBets = withUiStatus.reduce((sum, date) => sum + (date.bet_count || 0), 0);
      
      setStats({
        total_bets: totalBets,
        active_dates: activeCount,
        total_prize: totalPrize,
        average_bets: activeCount > 0 ? Math.round(totalBets / activeCount) : 0
      });
      
    } catch (error) {
      console.error('Error cargando fechas:', error);
      message.error('Error al cargar fechas de los pronósticos.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'green';
      case 'closed': return 'orange';
      case 'finished': return 'blue';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'Abierta';
      case 'closed': return 'Cerrada';
      case 'finished': return 'Finalizada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getMatchStatusInfo = (status) => {
    const value = String(status || '').toLowerCase().trim();
    if (value.includes('programado') || value === 'scheduled') {
      return {
        label: 'Programado',
        color: isDark ? '#93c5fd' : '#1890ff',
        bg: isDark ? '#111b2a' : '#e6f7ff',
        border: isDark ? '#254a92' : '#91d5ff'
      };
    }
    if (value.includes('finalizado') || value === 'finished') {
      return {
        label: 'Finalizado',
        color: isDark ? '#86efac' : '#52c41a',
        bg: isDark ? '#0b1f16' : '#f6ffed',
        border: isDark ? '#1f8a4c' : '#b7eb8f'
      };
    }
    if (value.includes('curso') || value.includes('progress')) {
      return {
        label: 'En Juego',
        color: isDark ? '#fdba74' : '#fa8c16',
        bg: isDark ? '#231a0e' : '#fff7e6',
        border: isDark ? '#7a4b10' : '#ffd591'
      };
    }
    if (value.includes('aplazado') || value === 'postponed') {
      return {
        label: 'Aplazado',
        color: isDark ? '#fdba74' : '#fa8c16',
        bg: isDark ? '#231a0e' : '#fff7e6',
        border: isDark ? '#7a4b10' : '#ffd591'
      };
    }
    if (value.includes('cancelado') || value === 'cancelled') {
      return {
        label: 'Cancelado',
        color: isDark ? '#fca5a5' : '#ff4d4f',
        bg: isDark ? '#2b1315' : '#fff1f0',
        border: isDark ? '#7a1f24' : '#ffccc7'
      };
    }
    return {
      label: status || 'Desconocido',
      color: isDark ? '#cbd5e1' : '#000',
      bg: isDark ? '#111827' : '#f5f5f5',
      border: isDark ? '#1f2b3a' : '#d9d9d9'
    };
  };

  const getBetDateStatusStyle = (status) => {
    const value = String(status || '').toLowerCase();
    if (value.includes('finished') || value.includes('finalizada')) {
      return { background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.35)', color: '#86efac' };
    }
    if (value.includes('closed')) {
      return { background: 'rgba(249, 115, 22, 0.18)', borderColor: 'rgba(249, 115, 22, 0.35)', color: '#fdba74' };
    }
    if (value.includes('open') || value.includes('active')) {
      return { background: 'rgba(59, 130, 246, 0.18)', borderColor: 'rgba(59, 130, 246, 0.35)', color: '#93c5fd' };
    }
    if (value.includes('cancel')) {
      return { background: 'rgba(239, 68, 68, 0.18)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#fca5a5' };
    }
    return { background: '#111827', borderColor: '#1f2b3a', color: '#cbd5e1' };
  };

  const handleViewResults = async (betDate) => {
    setResultsOpen(true);
    setResultsLoading(true);
    setResultsBetDate(betDate);
    setResultsMatches([]);

    try {
      const matchIds = (betDate.matches || []).map(m => m.id || m.match_id).filter(Boolean);
      const uniqueIds = Array.from(new Set(matchIds));
      const detailedMatches = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const res = await matchService.getById(id);
            return res.data;
          } catch (error) {
            const fallback = (betDate.matches || []).find(m => m.id === id || m.match_id === id);
            return fallback || null;
          }
        })
      );
      setResultsMatches(detailedMatches.filter(Boolean));
    } catch (error) {
      console.error('Error cargando resultados:', error);
      setResultsMatches([]);
    } finally {
      setResultsLoading(false);
    }
  };

  const handlePlaceBet = (betDateId) => {
    // Verificar créditos
    if (!hasEnoughCredits()) {
      message.error('No tienes créditos suficientes. Recarga créditos primero.');
      navigate('/wallet');
      return;
    }
    
    // Navegar al formulario de apuesta
    navigate(`/bets/${betDateId}/place`);
  };

  const handleViewDetails = (betDateId) => {
    navigate(`/bets/${betDateId}`);
  };

  const handleViewRanking = (betDateId) => {
    navigate(`/bets/${betDateId}/ranking`);
  };

  const BetDateCard = ({ betDate }) => {
    const isOpen = betDate.uiStatus === 'open';
    const timeRemaining = calculateTimeRemaining(betDate);
    const canBet = isOpen && hasEnoughCredits();
    
    return (
      <Card
        className="betdate-card"
        style={{ 
          marginBottom: 16,
          borderLeft: `4px solid ${isOpen ? '#52c41a' : '#d9d9d9'}`,
          cursor: 'default'
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4} style={{ margin: 0 }}>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    {betDate.name || `Fecha #${betDate.id}`}
                  </Title>
                </Col>
                <Col>
                  <Tag color={getStatusColor(betDate.uiStatus || betDate.status)}
                    style={isDark ? getBetDateStatusStyle(betDate.uiStatus || betDate.status) : undefined}>
                    {getStatusText(betDate.uiStatus || betDate.status)}
                  </Tag>
                </Col>
              </Row>
              
              <Text type="secondary">
                {betDate.description || 'Pronostica 10 partidos y gana premios en Puntos'}
              </Text>
              
              <Row gutter={[16, 8]}>
                <Col span={8}>
                  <Statistic
                    title="Premio"
                    value={
                      (betDate.total_prize || 0) ||
                      ((betDate.prize_PTS || 0) + (betDate.accumulated_prize || 0)) ||
                      (betDate.prize_cop || 0)
                    }
                    prefix={<DollarOutlined />}
                    suffix="PTS"
                    styles={{ content: { 
                      color: '#52c41a',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    } }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Pronósticos"
                    value={betDate.bet_count || betDate.total_bets || 0}
                    prefix={<TeamOutlined />}
                    styles={{ content: { fontSize: '18px' } }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Tiempo"
                    value={timeRemaining}
                    prefix={<ClockCircleOutlined />}
                    styles={{ content: {color: timeRemaining === 'Cerrado' ? '#ff4d4f' : '#1890ff', fontSize: '18px'} }}
                  />
                </Col>
              </Row>
              
              <div style={{ 
                background: isDark ? '#0b0f16' : '#f8fafc', 
                padding: '8px 12px', 
                borderRadius: 8,
                border: isDark ? '1px solid #3a465c' : '1px solid #e2e8f0',
                color: isDark ? '#ffffff' : 'inherit'
              }} className="betdate-pill">
                <Text type="secondary">
                  <FireOutlined style={{ marginRight: 4 }} />
                  {betDate.matches?.length || 0} partidos • 
                  1 crédito • Mínimo 13 puntos para ganar
                </Text>
              </div>
              
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    {betDate.accumulated_prize > 0 && (
                      <Tag
                        color="gold"
                        style={
                          isDark
                            ? { background: 'rgba(234, 179, 8, 0.18)', borderColor: 'rgba(234, 179, 8, 0.35)', color: '#fde68a' }
                            : undefined
                        }
                      >
                        <TrophyOutlined /> Acumulado: ${betDate.accumulated_prize.toLocaleString()}
                      </Tag>
                    )}
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Button
                      icon={<EyeOutlined />}
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: '#0958d9',
                        color: '#0958d9',
                        fontWeight: 600
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(betDate.id);
                      }}
                    >
                      Ver
                    </Button>
                    
                    {betDate.uiStatus === 'finished' && (
                      <Button
                        type="primary"
                        icon={<TrophyOutlined />}
                        style={{
                          backgroundColor: '#0958d9',
                          borderColor: '#0958d9',
                          color: '#ffffff',
                          fontWeight: 600
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewResults(betDate);
                        }}
                      >
                        Resultados
                      </Button>
                    )}
                    
                    {isOpen && (
                      <Button
                        type="primary"
                        icon={canBet ? <PlayCircleOutlined /> : <LockOutlined />}
                        disabled={!canBet}
                        style={{
                          backgroundColor: '#0958d9',
                          borderColor: '#0958d9',
                          color: '#ffffff',
                          fontWeight: 600
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaceBet(betDate.id);
                        }}
                      >
                        {canBet ? 'Pronósticar' : 'Sin créditos'}
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Cargando fechas de pronósticos...</p>
      </div>
    );
  }

  return (
    <div className={isDark ? 'betdate-list betdate-list--dark' : 'betdate-list'} style={{ padding: '24px' }}>
      <style>{`
        .betdate-list {
          max-width: 1100px;
          margin: 0 auto;
        }
        .betdate-list--dark {
          background: radial-gradient(1200px 600px at 10% -10%, #0c141f 0%, #0a0f16 50%, #0a0f14 100%);
          color: #e6edf3;
          border-radius: 12px;
        }
        .betdate-list--dark .ant-card {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .betdate-list--dark .ant-card-head {
          border-bottom-color: #1f2b3a;
          background: #0c141f;
        }
        .betdate-list--dark .ant-card-head-title,
        .betdate-list--dark .ant-card-extra {
          color: #e6edf3;
        }
        .betdate-list--dark .ant-typography,
        .betdate-list--dark .ant-typography-secondary {
          color: #e6edf3;
        }
        .betdate-list--dark .ant-typography-secondary {
          color: #9fb0c2;
        }
        .betdate-list--dark .ant-card .ant-typography,
        .betdate-list--dark .ant-card .ant-typography-secondary {
          color: #e6edf3 !important;
        }
        .betdate-list--dark .ant-card .ant-typography-secondary {
          color: #9fb0c2 !important;
        }
        .betdate-list--dark .ant-statistic-title {
          color: #e6edf3 !important;
        }
        .betdate-list--dark .ant-statistic-content {
          color: #f1f5f9 !important;
        }
        .betdate-list--dark .ant-statistic-content-prefix,
        .betdate-list--dark .ant-statistic-content-suffix {
          color: #cbd5e1;
        }
        .betdate-list--dark .ant-tag {
          border-color: #1f2b3a;
          background: #111b28;
          color: #cbd5e1;
        }
        .betdate-list--dark .ant-alert {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .betdate-list--dark .ant-alert-message,
        .betdate-list--dark .ant-alert-description {
          color: #e6edf3;
        }
        .betdate-list--dark .ant-btn {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .betdate-list--dark .ant-btn:hover {
          background: #162233;
          border-color: #2a3a4f;
          color: #ffffff;
        }
        .betdate-list--dark .betdate-card {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .betdate-list--dark .betdate-pill {
          background: #0b0f16;
          border-color: #3a465c;
          color: #ffffff;
        }
        .betdate-list--dark .ant-modal-content,
        .betdate-list--dark .ant-modal-header {
          background: #0f1824;
          color: #e6edf3;
        }
        .betdate-list--dark .ant-modal-title {
          color: #e6edf3;
        }
        body[data-theme="dark"] .results-modal .ant-modal-content,
        body[data-theme="dark"] .results-modal .ant-modal-header,
        body[data-theme="dark"] .results-modal .ant-modal-body {
          background: #0f1824 !important;
          color: #e6edf3 !important;
        }
        body[data-theme="dark"] .results-modal-wrap .ant-modal-content,
        body[data-theme="dark"] .results-modal-wrap .ant-modal-header,
        body[data-theme="dark"] .results-modal-wrap .ant-modal-body {
          background: #0f1824 !important;
          color: #e6edf3 !important;
        }
        body[data-theme="dark"] .results-modal-wrap .ant-modal-content {
          border: 1px solid #1f2b3a !important;
        }
        body[data-theme="dark"] .results-modal .ant-modal {
          background: transparent !important;
        }
        body[data-theme="dark"] .results-modal .ant-modal-content {
          border: 1px solid #1f2b3a !important;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55) !important;
        }
        body[data-theme="dark"] .results-modal.ant-modal-wrap,
        body[data-theme="dark"] .results-modal .ant-modal-wrap,
        body[data-theme="dark"] .results-modal .ant-modal-root,
        body[data-theme="dark"] .results-modal .ant-modal-mask {
          background: rgba(0, 0, 0, 0.55) !important;
        }
        body[data-theme="dark"] .results-modal .ant-modal-title {
          color: #e6edf3;
        }
        body[data-theme="dark"] .results-modal .ant-modal-close-x {
          color: #cbd5e1;
        }
        body[data-theme="dark"] .results-modal .ant-card {
          background: #0f1724;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        body[data-theme="dark"] .results-modal .results-match-card {
          background: #0f1724;
          border-color: #1f2b3a;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
        }
        body[data-theme="dark"] .results-modal .ant-typography,
        body[data-theme="dark"] .results-modal .ant-typography-secondary {
          color: #e6edf3 !important;
        }
        body[data-theme="dark"] .results-modal .ant-tag {
          background: #111b28;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        body[data-theme="dark"] .results-modal .ant-tag-green {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.35);
          color: #86efac;
        }

        .betdate-list--dark .results-modal .ant-modal-close-x {
          color: #cbd5e1;
        }
        .betdate-list--dark .results-modal .ant-card {
          background: #0f1724;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .betdate-list--dark .results-modal .ant-card-body {
          color: #e6edf3;
        }
        .betdate-list--dark .results-modal .ant-typography,
        .betdate-list--dark .results-modal .ant-typography-secondary {
          color: #e6edf3 !important;
        }
        .betdate-list--dark .results-modal .ant-tag {
          background: #111b28;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .betdate-list--dark .results-modal .ant-tag-green {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.35);
          color: #86efac;
        }
        .betdate-list--dark .ant-divider {
          border-color: #1f2b3a;
        }
        .toggle-dark {
          background: #e5e7eb;
          border-color: #cbd5e1;
        }
        .toggle-dark .ant-switch-inner .ant-switch-inner-unchecked {
          color: #111827;
        }
        .toggle-dark.ant-switch-checked .ant-switch-inner .ant-switch-inner-checked {
          color: #ffffff;
        }
        .betdate-list--dark .toggle-dark {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .betdate-list--dark .toggle-dark.ant-switch-checked .ant-switch-inner .ant-switch-inner-checked {
          color: #93c5fd;
        }
        @media (max-width: 768px) {
          .betdate-header-card {
            display: none;
          }
          .betdate-list {
            padding: 0 !important;
          }
        }

        @media (max-width: 480px) {
          .betdate-list {
            padding: 0 !important;
          }
          .betdate-list h1,
          .betdate-list h2,
          .betdate-list h3,
          .betdate-list h4,
          .betdate-list h5,
          .betdate-list .ant-typography {
            font-size: 13px !important;
          }
          .betdate-list .ant-typography-secondary,
          .betdate-list p,
          .betdate-list small,
          .betdate-list span {
            font-size: 11.5px !important;
          }
          .betdate-card {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin-bottom: 0 !important;
          }
          .betdate-card + .betdate-card {
            border-top: 1px solid #e5e7eb;
          }
          body[data-theme="dark"] .betdate-card + .betdate-card {
            border-top-color: #1f2b3a;
          }
          .betdate-card .ant-card-body {
            padding: 12px 0 !important;
          }
          .betdate-list .ant-btn {
            font-size: 11px !important;
            padding: 4px 10px !important;
            height: 28px !important;
            border-radius: 8px !important;
          }
          .betdate-list .ant-btn .anticon {
            font-size: 12px !important;
          }
        }
      `}</style>
      {/* Encabezado con estadísticas — oculto en móvil (MobileBetDashboard lo reemplaza) */}
      <Card className="betdate-header-card" style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Row justify="space-between" align="middle" gutter={[12, 12]}>
              <Col>
                <Title level={2}>
                  <FireOutlined style={{ marginRight: 8 }} />
                  Fechas de Pronósticos
                </Title>
                <Text type="secondary">
                  Pronostica 10 partidos, gana puntos y obtén premios en Puntos
                </Text>
              </Col>
              <Col>
                <Space size="small">
                  <Text type="secondary">Vista oscura</Text>
                  <Switch
                    checked={isDark}
                    onChange={(checked) => setMode(checked ? 'dark' : 'light')}
                    className="toggle-dark"
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                  />
                </Space>
              </Col>
            </Row>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Fechas Activas"
              value={stats.active_dates}
              prefix={<CalendarOutlined />}
              styles={{
                title: { color: isDark ? '#e6edf3' : undefined },
                content: { color: '#1890ff' }
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Pronósticos"
              value={stats.total_bets}
              prefix={<TeamOutlined />}
              styles={{
                title: { color: isDark ? '#e6edf3' : undefined }
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Premio Total Acumulado "
              value={stats.total_prize}
              prefix={<FireOutlined/>}
              suffix="PTS"
              styles={{
                title: { color: isDark ? '#e6edf3' : undefined },
                content: { color: '#52c41a' }
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Tus Créditos"
              value={wallet.credits}
              prefix={<FireOutlined />}
              styles={{
                title: { color: isDark ? '#e6edf3' : undefined },
                content: {color: wallet.credits > 0 ? '#52c41a' : '#ff4d4f',fontWeight: 'bold'}
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* Alerta si no hay créditos */}
      {wallet.credits === 0 && (
        <Alert
          title="No tienes créditos"
          description={
            <span>
              Necesitas al menos 1 crédito para apostar. 
              <Button 
                type="link" 
                onClick={() => navigate('/wallet')}
                style={{ padding: 0, marginLeft: 4 }}
              >
                Recarga créditos aquí
              </Button>
            </span>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Lista de fechas */}
      {betDates.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <CalendarOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
            <Title level={4}>No hay fechas activas</Title>
            <Text type="secondary">
              No hay fechas de pronósticos disponibles en este momento.
              Vuelve más tarde o contacta al administrador.
            </Text>
          </div>
        </Card>
      ) : (
        <div>
          {/* Fechas abiertas */}
          {betDates.filter(d => d.uiStatus === 'open').length > 0 && (
            <>
              <Title level={4} style={{ marginBottom: 16 }}>
                <PlayCircleOutlined style={{ marginRight: 8 }} />
                Fechas Abiertas ({betDates.filter(d => d.uiStatus === 'open').length})
              </Title>
              {betDates
                .filter(d => d.uiStatus === 'open')
                .slice()
                .sort((a, b) => getBetDateSortValue(b) - getBetDateSortValue(a))
                .map(betDate => (
                  <BetDateCard key={betDate.id} betDate={betDate} />
                ))}
            </>
          )}

          {/* Fechas cerradas/finalizadas */}
          {betDates.filter(d => d.uiStatus !== 'open').length > 0 && (
            <>
              <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
                <HistoryOutlined style={{ marginRight: 8 }} />
                Fechas Anteriores ({betDates.filter(d => d.uiStatus !== 'open').length})
              </Title>
              {betDates
                .filter(d => d.uiStatus !== 'open')
                .slice()
                .sort((a, b) => getBetDateSortValue(b) - getBetDateSortValue(a))
                .map(betDate => (
                  <BetDateCard key={betDate.id} betDate={betDate} />
                ))}
            </>
          )}
        </div>
      )}

      {/* Botón para recargar */}
      <Modal
        open={resultsOpen}
        onCancel={() => setResultsOpen(false)}
        footer={null}
        className="results-modal"
        wrapClassName="results-modal-wrap"
        title={`Resultados - ${resultsBetDate?.name || `Fecha #${resultsBetDate?.id || ''}`}`}
        width={900}
        styles={{
          content: { background: '#0f1824', border: '1px solid #1f2b3a' },
          header: { background: '#0f1824', borderBottom: '1px solid #1f2b3a' },
          body: { background: '#0f1824' }
        }}
      >
        {resultsLoading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Spin />
          </div>
        ) : resultsMatches.length === 0 ? (
          <Alert
            type="info"
            showIcon
            title="No hay resultados disponibles para esta fecha."
          />
        ) : (
          <Row gutter={[12, 12]}>
            {resultsMatches.map(match => {
              const statusInfo = getMatchStatusInfo(match?.status);
              const homeScore = typeof match.home_score === 'number' ? match.home_score : Number(match.home_score);
              const awayScore = typeof match.away_score === 'number' ? match.away_score : Number(match.away_score);
              const hasScore = Number.isFinite(homeScore) && Number.isFinite(awayScore);
              return (
                <Col key={match.id} xs={24} md={12}>
                  <Card size="small" className="results-match-card">
                    <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                      <Space align="center" wrap>
                        <Avatar src={match.home_team?.logo_url || match.home_logo} size={32}>
                          {match.home_team?.name?.charAt(0)}
                        </Avatar>
                        <Text strong>{match.home_team?.name || match.home_team}</Text>
                        <Text type="secondary">vs</Text>
                        <Text strong>{match.away_team?.name || match.away_team}</Text>
                        <Avatar src={match.away_team?.logo_url || match.away_logo} size={32}>
                          {match.away_team?.name?.charAt(0)}
                        </Avatar>
                        <Tag
                          style={{
                            marginLeft: 8,
                            border: `1px solid ${statusInfo.border}`,
                            color: statusInfo.color,
                            backgroundColor: statusInfo.bg
                          }}
                        >
                          {statusInfo.label}
                        </Tag>
                      </Space>
                      <Space>
                        <CalendarOutlined />
                        <Text type="secondary">{formatDateTimeShortUTC(match.match_date)}</Text>
                        {hasScore && (
                          <Text strong>Resultado: {homeScore} - {awayScore}</Text>
                        )}
                      </Space>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Modal>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button 
          onClick={fetchBetDates}
          loading={loading}
          icon={<ClockCircleOutlined />}
          style={{
            backgroundColor: '#0958d9',
            borderColor: '#0958d9',
            color: '#ffffff',
            fontWeight: 600
          }}
        >
          Actualizar Lista
        </Button>
      </div>
    </div>
  );
};

export default BetDateList;

