// frontend/src/components/bets/BetDateInfo.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, Tag, Statistic, 
  Space, Alert, Button, Spin, Avatar,
  Timeline, Divider, Progress, Switch
} from 'antd';
import { 
  CalendarOutlined, FireOutlined, DollarOutlined, 
  TeamOutlined, TrophyOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import betService from '../../services/betService';
import matchService from '../../services/matchService';
import { calculateTimeRemaining } from '../../utils/betCalculations';
import { formatDateTimeShortUTC, parseDateAsUTC } from '../../utils/dateFormatter';

const { Title, Text } = Typography;

const BetDateInfo = ({ betDateId }) => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const navigate = useNavigate();
  const [betDate, setBetDate] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBet, setUserBet] = useState(null);
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';

  useEffect(() => {
    if (betDateId) {
      fetchBetDateInfo();
    }
  }, [betDateId]);

  const normalizeMatchStatus = (status) => {
    if (!status) return '';
    return String(status).toLowerCase().trim();
  };

  const isMatchFinished = (status) => {
    const normalized = normalizeMatchStatus(status);
    return normalized === 'finished' || normalized.includes('finalizado');
  };

  const getTeamLogo = (match, side) => {
    const normalizeLogoUrl = (url) => {
      if (!url) return null;
      if (String(url).startsWith('http://') || String(url).startsWith('https://')) {
        return url;
      }
      return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    if (side === 'home') {
      return normalizeLogoUrl(
        match.home_team_logo ||
        match.home_logo ||
        match.home_team?.logo_url ||
        null
      );
    }

    return normalizeLogoUrl(
      match.away_team_logo ||
      match.away_logo ||
      match.away_team?.logo_url ||
      null
    );
  };

  const enrichMatchesWithLogos = async (rawMatches = []) => {
    if (!rawMatches.length) return [];

    const logosByMatchId = {};
    await Promise.all(
      rawMatches.map(async (match) => {
        const matchId = match.id || match.match_id;
        if (!matchId) return;
        try {
          const res = await matchService.getById(matchId);
          const matchData = res?.data || {};
          logosByMatchId[matchId] = {
            home_team_logo: matchData.home_team?.logo_url || null,
            away_team_logo: matchData.away_team?.logo_url || null,
          };
        } catch (error) {
          logosByMatchId[matchId] = {
            home_team_logo: null,
            away_team_logo: null,
          };
        }
      })
    );

    return rawMatches.map((match) => {
      const matchId = match.id || match.match_id;
      return {
        ...match,
        home_team_logo:
          match.home_team_logo ||
          logosByMatchId[matchId]?.home_team_logo ||
          null,
        away_team_logo:
          match.away_team_logo ||
          logosByMatchId[matchId]?.away_team_logo ||
          null,
      };
    });
  };

  const deriveBetDateStatus = (dateData) => {
    const dateMatches = dateData.matches || [];
    if (dateMatches.length === 0) return dateData.status || 'open';

    const now = new Date();
    const allFinished = dateMatches.every(m => isMatchFinished(m.status));
    if (allFinished) return 'finished';

    const hasPastMatch = dateMatches.some(m => {
      if (!m.match_date) return false;
      const matchDate = parseDateAsUTC(m.match_date);
      return matchDate ? matchDate.toDate() < now : false;
    });

    if (hasPastMatch) return 'closed';
    return dateData.status || 'open';
  };

  const fetchBetDateInfo = async () => {
    setLoading(true);
    try {
      // Obtener información de la fecha
      const response = await betService.getBetDateDetails(betDateId);
      const data = response.data;
      const withUiStatus = { ...data, uiStatus: deriveBetDateStatus(data) };
      setBetDate(withUiStatus);
      
      // Obtener partidos (si vienen en la respuesta)
      if (data.matches) {
        const enrichedMatches = await enrichMatchesWithLogos(data.matches);
        const sortedMatches = enrichedMatches.slice().sort((a, b) => {
          const aTime = a.match_date ? new Date(a.match_date).getTime() : Number.POSITIVE_INFINITY;
          const bTime = b.match_date ? new Date(b.match_date).getTime() : Number.POSITIVE_INFINITY;
          return aTime - bTime;
        });
        setMatches(sortedMatches);
      }
      
      // Aquí podrías obtener la apuesta del usuario si ya apostó
      // setUserBet(userBetData);
      
    } catch (error) {
      console.error('Error cargando información:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'open': { color: 'green', text: 'Abierta', icon: <CheckCircleOutlined /> },
      'closed': { color: 'orange', text: 'Cerrada', icon: <ClockCircleOutlined /> },
      'finished': { color: 'blue', text: 'Finalizada', icon: <TrophyOutlined /> },
      'cancelled': { color: 'red', text: 'Cancelada', icon: <CloseCircleOutlined /> },
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <p>Cargando información...</p>
      </div>
    );
  }

  if (!betDate) {
    return (
      <Alert
        title="Fecha no encontrada"
        description="La fecha de los pronósticos que buscas no existe."
        type="error"
        showIcon
      />
    );
  }

  const isOpen = betDate.uiStatus === 'open';
  const timeRemaining = calculateTimeRemaining(betDate);

  return (
    <div className={isDark ? 'betdate-info betdate-info--dark' : 'betdate-info'}>
      <style>{`
        .betdate-info--dark {
          background: radial-gradient(1200px 600px at 10% -10%, #0c141f 0%, #0a0f16 50%, #0a0f14 100%);
          color: #e6edf3;
          padding: 16px;
          border-radius: 12px;
        }
        .betdate-info--dark .ant-card {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .betdate-info--dark .ant-card-head-title,
        .betdate-info--dark .ant-card-extra {
          color: #e6edf3;
        }
        .betdate-info--dark .ant-card-head {
          border-bottom-color: #1f2b3a;
          background: #0c141f;
        }
        .betdate-info--dark .ant-typography,
        .betdate-info--dark .ant-typography-secondary {
          color: #e6edf3;
        }
        .betdate-info--dark .ant-typography-secondary {
          color: #9fb0c2;
        }
        .betdate-info--dark .ant-statistic-title {
          color: #9fb0c2;
        }
        .betdate-info--dark .ant-statistic-content {
          color: #e6edf3;
        }
        .betdate-info--dark .ant-statistic {
          color: #e6edf3;
        }
        .betdate-info--dark .stat-card .ant-statistic-title {
          color: #cbd5e1;
        }
        .betdate-info--dark .stat-card .ant-statistic-content {
          color: #f1f5f9;
        }
        .betdate-info--dark .btn-secondary {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .betdate-info--dark .btn-secondary:hover {
          background: #162233;
          border-color: #2a3a4f;
          color: #ffffff;
        }
        .info-alert {
          border-left: 6px solid #10b981;
          background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);
          box-shadow: 0 10px 24px rgba(16, 185, 129, 0.12);
          border-radius: 12px;
        }
        .betdate-info--dark .info-alert {
          background: linear-gradient(135deg, #0f1824 0%, #0b1712 100%);
          border-left-color: #10b981;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
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
        .betdate-info--dark .toggle-dark {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .betdate-info--dark .toggle-dark.ant-switch-checked .ant-switch-inner .ant-switch-inner-checked {
          color: #93c5fd;
        }
        .betdate-info--dark .ant-tag {
          background: #111b2a;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .betdate-info--dark .ant-tag-blue {
          background: rgba(59, 130, 246, 0.18);
          border-color: rgba(59, 130, 246, 0.35);
          color: #93c5fd;
        }
        .betdate-info--dark .ant-tag-green {
          background: rgba(34, 197, 94, 0.18);
          border-color: rgba(34, 197, 94, 0.35);
          color: #86efac;
        }
        .betdate-info--dark .ant-tag-orange {
          background: rgba(249, 115, 22, 0.18);
          border-color: rgba(249, 115, 22, 0.35);
          color: #fdba74;
        }
        .betdate-info--dark .ant-tag-red {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }
      `}</style>
      {/* Encabezado */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={3} style={{ margin: 0 }}>
                    <FireOutlined style={{ marginRight: 8 }} />
                    {betDate.name}
                  </Title>
                </Col>
              </Row>
              
              <Text type="secondary">{betDate.description}</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Premio acumulado en esta Fecha"
              value={
                (betDate.total_prize || 0) ||
                ((betDate.prize_PTS || 0) + (betDate.accumulated_prize || 0)) ||
                (betDate.prize_cop || 0)
              }
              prefix={<DollarOutlined />}
              prefix="$"
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Pronósticos Recibidos"
              value={betDate.total_bets || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Estado"
              value={isOpen ? 'Abierta' : 'Cerrada'}
              styles={{ content: { color: isOpen ? '#52c41a' : '#ff4d4f' } }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Tiempo Restante"
              value={timeRemaining}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Premio acumulado */}
      {betDate.accumulated_prize > 0 && (
        <Alert
          title="Premio Acumulado"
          description={
            <Space orientation="vertical" size="small">
              <Text>
                Premio anterior no reclamado: <Text strong>${betDate.accumulated_prize.toLocaleString()}</Text>
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Se suma al premio actual si no hay ganador
              </Text>
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Partidos (si están disponibles) */}
      {matches.length > 0 && (
        <Card>
          <Title level={5}>
            <CalendarOutlined style={{ marginRight: 8 }} />
            Partidos de esta fecha ({matches.length}/10)
          </Title>
          <Row gutter={[16, 16]}>
            {matches.map((match, index) => (
              <Col xs={24} md={12} key={`${match.id || index}`}>
                <Card size="small">
                  <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Tag color="blue">Partido {index + 1}</Tag>
                        <Space size={8} align="center">
                          <Avatar size={48} src={getTeamLogo(match, 'home')}>
                            {(match.home_team || 'L').charAt(0)}
                          </Avatar>
                          <Text strong>{match.home_team}</Text>
                          <Text type="secondary">vs</Text>
                          <Avatar size={48} src={getTeamLogo(match, 'away')}>
                            {(match.away_team || 'V').charAt(0)}
                          </Avatar>
                          <Text strong>{match.away_team}</Text>
                        </Space>
                      </Col>
                      <Col>
                        {match.match_date && (
                          <Text type="secondary">
                            {formatDateTimeShortUTC(match.match_date)}
                          </Text>
                        )}
                      </Col>
                    </Row>
                    
                    {match.stadium && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {match.stadium}
                      </Text>
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

        </Card>
      )}

      {/* Información importante */}
      <Card style={{ marginBottom: 16 }} className="info-alert">
        <Title level={5}>Información Importante</Title>
        <Space orientation="vertical" size="small">
          <Text>• <strong>10 partidos</strong> para pronosticar
          • <strong>1 crédito</strong> por apuesta
          • <strong>3 puntos</strong> por marcador exacto
          • <strong>1 punto</strong> por ganador correcto
          • <strong>Mínimo 13 puntos</strong> para ganar</Text>
          <Text>• <strong>Premio:</strong> ${((betDate.total_prize || 0) || ((betDate.prize_PTS || 0) + (betDate.accumulated_prize || 0)) || (betDate.prize_cop || 0)).toLocaleString()}</Text>
        </Space>
      </Card>

      {/* Botones de acción */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        {isOpen ? (
          <Space>
            <Button 
              type="primary" 
              icon={<FireOutlined />}
              onClick={() => navigate(`/bets/${betDateId}/place`)}
              style={{
                backgroundColor: '#ff4d4f',
                borderColor: '#ff4d4f',
                color: '#ffffff',
                fontWeight: 600,
                boxShadow: '0 6px 16px rgba(255, 77, 79, 0.35)'
              }}
            >
              Hacer Pronósticos
            </Button>
            <Button 
              icon={<EyeOutlined />}
              onClick={() => navigate('/bets')}
              className="btn-secondary"
            >
              Ver más fechas
            </Button>
          </Space>
        ) : (
          <Space>
            <Button 
              type="default"
              icon={<TrophyOutlined />}
              onClick={() => navigate(`/bets/${betDateId}?tab=ranking`)}
            >
              Ver Ranking
            </Button>
            <Button 
              onClick={() => navigate('/bets')}
            >
              Volver a fechas
            </Button>
          </Space>
        )}
      </div>
    </div>
  );
};

export default BetDateInfo;
