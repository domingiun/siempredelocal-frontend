import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Card, Row, Col, Statistic, Space, Tag, Spin, Alert, Button, Avatar } from 'antd';
import { TrophyOutlined, TeamOutlined, FireOutlined, CalendarOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import axios from 'axios';
import { formatDateTimeShortUTC } from '../utils/dateFormatter';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const { Title, Text, Paragraph } = Typography;
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
});
publicApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const HomePage = () => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_prize_pool: 0,
    active_users_count: 0,
    last_bet_count: 0
  });
  const [lastBetDate, setLastBetDate] = useState(null);
  const [lastBetMatches, setLastBetMatches] = useState([]);
  const [finishedBetDates, setFinishedBetDates] = useState([]);

  const statusConfig = useMemo(() => ({
    Programado: {
      label: 'Programado',
      backgroundColor: '#bae7ff',
      borderColor: '#1890ff',
      textColor: '#003a8c'
    },
    'Finalizado': {
      label: 'Finalizado',
      backgroundColor: '#cffab6',
      borderColor: '#88d160',
      textColor: '#589139',
      tagColor: 'green'
    },
    'En Juego': {
      label: 'En Juego',
      backgroundColor: '#d9f7be',
      borderColor: '#52c41a',
      textColor: '#135200'
    },
    Aplazado: {
      label: 'Aplazado',
      backgroundColor: '#fff7e6',
      borderColor: '#fa8c16',
      textColor: '#873800'
    },
    Cancelado: {
      label: 'Cancelado',
      backgroundColor: '#ffccc7',
      borderColor: '#f5222d',
      textColor: '#820014'
    }
  }), []);

  const getMatchStatusInfo = (status) => {
    const value = String(status || '').toLowerCase().trim();
    if (value.includes('programado') || value === 'scheduled') return statusConfig.Programado;
    if (value.includes('finalizado') || value === 'finished') return statusConfig.Finalizado;
    if (value.includes('curso') || value.includes('progress')) return statusConfig['En Juego'];
    if (value.includes('aplazado') || value === 'postponed') return statusConfig.Aplazado;
    if (value.includes('cancelado') || value === 'cancelled') return statusConfig.Cancelado;
    return {
      label: status || 'Desconocido',
      backgroundColor: '#f5f5f5',
      borderColor: '#d9d9d9',
      textColor: '#000000'
    };
  };

  const resolveLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [betStatsRes, financialRes, betDatesRes] = await Promise.allSettled([
          publicApi.get('/bet-integration/stats'),
          publicApi.get('/pricing/financial-summary?days=30'),
          publicApi.get('/betdates/?limit=10')
        ]);

        const betStats = betStatsRes.status === 'fulfilled' ? betStatsRes.value.data : null;
        const financial = financialRes.status === 'fulfilled' ? financialRes.value.data : null;
        const betDates = betDatesRes.status === 'fulfilled'
          ? (betDatesRes.value.data?.data || betDatesRes.value.data || [])
          : [];

        const isMatchFinished = (status) => {
          const value = String(status || '').toLowerCase().trim();
          return value === 'finished' || value.includes('finalizado');
        };

        const sortedBetDates = betDates
          .slice()
          .sort((a, b) => {
            const aTime = a?.start_datetime ? new Date(a.start_datetime).getTime() : a?.id || 0;
            const bTime = b?.start_datetime ? new Date(b.start_datetime).getTime() : b?.id || 0;
            return bTime - aTime;
          });

        const latestBetDate = sortedBetDates[0] || null;
        setLastBetDate(latestBetDate);
        const detailedDates = await Promise.all(
          sortedBetDates.map(async (d) => {
            try {
              const detailRes = await publicApi.get(`/bet-integration/betdate/${d.id}`);
              return {
                ...d,
                matches: detailRes.data?.matches || [],
                bet_count: detailRes.data?.bet_count || d.bet_count || 0,
                prize_PTS: detailRes.data?.prize_PTS || d.prize_PTS,
                accumulated_prize: detailRes.data?.accumulated_prize || d.accumulated_prize || 0
              };
            } catch (error) {
              return { ...d, matches: d.matches || [] };
            }
          })
        );

        const isBetDateFinished = (d) => {
          const status = String(d?.status || '').toLowerCase().trim();
          if (status.includes('finalizado') || status === 'finished') return true;
          if (d.matches && d.matches.length > 0) {
            return d.matches.every((m) => isMatchFinished(m.status));
          }
          return false;
        };

        const finishedDates = detailedDates
          .filter(isBetDateFinished)
          .slice(0, 1);

        const finishedDatesWithMatches = await Promise.all(
          finishedDates.map(async (d) => {
            const matches = d.matches || [];
            const enrichedMatches = await Promise.all(
              matches.map(async (m) => {
                try {
                  const matchRes = await publicApi.get(`/matches/public/${m.id}`);
                  const homeScore = matchRes.data?.home_score;
                  const awayScore = matchRes.data?.away_score;
                  const homeName = matchRes.data?.home_team?.name;
                  const awayName = matchRes.data?.away_team?.name;
                  const homeLogo = matchRes.data?.home_team?.logo_url;
                  const awayLogo = matchRes.data?.away_team?.logo_url;
                  return {
                    ...m,
                    home_score: typeof homeScore === 'number' ? homeScore : Number(homeScore),
                    away_score: typeof awayScore === 'number' ? awayScore : Number(awayScore),
                    home_team: homeName || m.home_team,
                    away_team: awayName || m.away_team,
                    home_logo: resolveLogoUrl(homeLogo || m.home_logo),
                    away_logo: resolveLogoUrl(awayLogo || m.away_logo),
                    status: matchRes.data?.status || m.status
                  };
                } catch (error) {
                  return {
                    ...m,
                    home_logo: resolveLogoUrl(m.home_logo),
                    away_logo: resolveLogoUrl(m.away_logo)
                  };
                }
              })
            );
            const orderedMatches = enrichedMatches
              .slice()
              .sort((a, b) => new Date(a.match_date || 0) - new Date(b.match_date || 0));
            return { ...d, matches: orderedMatches };
          })
        );

        setFinishedBetDates(finishedDatesWithMatches);

        let lastBetCount = 0;
        if (latestBetDate?.id) {
          const latestDetail = detailedDates.find(d => d.id === latestBetDate.id);
          lastBetCount = latestDetail?.bet_count || 0;
          const matches = latestDetail?.matches || [];
          const orderedMatches = matches
            .slice()
            .sort((a, b) => new Date(a.match_date || 0) - new Date(b.match_date || 0));

          const enrichedMatches = await Promise.all(
            orderedMatches.map(async (m) => {
              try {
                const matchRes = await publicApi.get(`/matches/public/${m.id}`);
                const homeScore = matchRes.data?.home_score;
                const awayScore = matchRes.data?.away_score;
                const homeName = matchRes.data?.home_team?.name;
                const awayName = matchRes.data?.away_team?.name;
                const homeLogo = matchRes.data?.home_team?.logo_url;
                const awayLogo = matchRes.data?.away_team?.logo_url;
                return {
                  ...m,
                  home_score: typeof homeScore === 'number' ? homeScore : Number(homeScore),
                  away_score: typeof awayScore === 'number' ? awayScore : Number(awayScore),
                  home_team: homeName || m.home_team,
                  away_team: awayName || m.away_team,
                  home_logo: resolveLogoUrl(homeLogo || m.home_logo),
                  away_logo: resolveLogoUrl(awayLogo || m.away_logo),
                  status: matchRes.data?.status || m.status
                };
              } catch (error) {
                return {
                  ...m,
                  home_logo: resolveLogoUrl(m.home_logo),
                  away_logo: resolveLogoUrl(m.away_logo)
                };
              }
            })
          );

          setLastBetMatches(enrichedMatches);
        } else {
          setLastBetMatches([]);
        }

        setStats({
          total_prize_pool: betStats?.total_prize_pool || 0,
          active_users_count: financial?.active_users_count || 0,
          last_bet_count: lastBetCount
        });
      } catch (error) {
        console.error('Error cargando HomePage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [statusConfig]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <div style={{
        background: 'linear-gradient(120deg, #0b1e5b 0%, #163a8a 60%, #1e4fd1 100%)',
        color: '#fff',
        padding: '22px 24px 28px'
      }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16} lg={18}>
            <Space align="start" size={16} wrap style={{ width: '100%' }}>
              <img
                src={logo}
                alt="Siempre de Local"
                style={{ width: 'clamp(120px, 20vw, 240px)', height: 'auto', objectFit: 'contain' }}
              />
              <Space orientation="vertical" size={6} style={{ marginTop: 6 }}>
                <Title level={2} style={{ margin: 0, color: '#fff' }}>Centro de Pronósticos</Title>
                <Title level={3} style={{ color: '#fff', marginBottom: 2 }}>
                  Resultados, estadisticas y premios en un solo lugar
                </Title>
                <Paragraph style={{ color: '#dfe7ff', maxWidth: 560, margin: 0 }}>
                  Sigue las fechas mas recientes, conoce el estado de los partidos y revisa el acumulado del premio.
                  Todo actualizado para que no pierdas ningun detalle.
                </Paragraph>
              </Space>
            </Space>
          </Col>
          <Col xs={24} md="auto">
            <Space size={10} wrap>
              <Button
                type="default"
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
                style={{
                  borderColor: '#ffffff',
                  color: '#ffffff',
                  background: 'transparent',
                  fontWeight: 600
                }}
              >
                Iniciar sesion
              </Button>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => navigate('/register')}
                style={{
                  backgroundColor: '#ffcc00',
                  borderColor: '#ffcc00',
                  color: '#1b2b52',
                  fontWeight: 700
                }}
              >
                Obtener cuenta
              </Button>
            </Space>
          </Col>
        </Row>
        <Row style={{ marginTop: 0 }} />
      </div>

      <div style={{ padding: '24px' }}>
        {loading ? (
          <Card style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Cargando informacion...</Text>
            </div>
          </Card>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 14 }}>
                  <Statistic
                    title="Acumulado del Premio"
                    value={stats.total_prize_pool}
                    suffix="PTS"
                    prefix={<TrophyOutlined />}
                  />
                  <Text type="secondary">Premio en puntos para la fecha actual</Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 14 }}>
                  <Statistic
                    title="Usuarios Activos (30 dias)"
                    value={stats.active_users_count}
                    prefix={<TeamOutlined />}
                  />
                  <Text type="secondary">Usuarios que participaron recientemente.</Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 14 }}>
                  <Statistic
                    title="Pronósticos última fecha"
                    value={stats.last_bet_count}
                    prefix={<FireOutlined />}
                  />
                  <Text type="secondary">Total de pronósticos registrados.</Text>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
              <Col xs={24} lg={16}>
                <Card title="Partidos de la última fecha de Pronósticos" style={{ borderRadius: 14 }}>
                  {lastBetDate ? (
                    <>
                      <Text type="secondary">
                        {lastBetDate.name || `Fecha de Pronósticos #${lastBetDate.id}`}
                      </Text>
                      <div style={{ marginTop: 12 }}>
                        {lastBetMatches.length === 0 ? (
                          <Alert type="info" showIcon title="No hay partidos disponibles para esta fecha." />
                        ) : (
                          <Row gutter={[12, 12]}>
                            {lastBetMatches.map(match => {
                              const statusInfo = getMatchStatusInfo(match.status);
                              const homeScore = typeof match.home_score === 'number' ? match.home_score : Number(match.home_score);
                              const awayScore = typeof match.away_score === 'number' ? match.away_score : Number(match.away_score);
                              const hasScore = Number.isFinite(homeScore) && Number.isFinite(awayScore);
                              return (
                                <Col key={match.id} xs={24} md={12}>
                                  <Card size="small">
                                    <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                                      <Space align="center" wrap>
                                        <Space align="center" size={8}>
                                          <Avatar
                                            src={match.home_logo}
                                            size={36}
                                            style={{ backgroundColor: '#fcfcfa' }}
                                          >
                                            {match.home_team?.charAt(0)}
                                          </Avatar>
                                          <Text strong>{match.home_team}</Text>
                                          <Text type="secondary">vs</Text>
                                          <Text strong>{match.away_team}</Text>
                                          <Avatar
                                            src={match.away_logo}
                                            size={36}
                                            style={{ backgroundColor: '#fcfcfa' }}
                                          >
                                            {match.away_team?.charAt(0)}
                                          </Avatar>
                                        </Space>
                                        <Tag
                                          style={{
                                            margin: 0,
                                            border: `1px solid ${statusInfo.borderColor}`,
                                            color: statusInfo.textColor,
                                            backgroundColor: statusInfo.backgroundColor
                                          }}
                                        >
                                          {statusInfo.label}
                                        </Tag>
                                      </Space>
                                      <Space align="center" wrap>
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
                      </div>
                    </>
                  ) : (
                    <Alert type="info" showIcon title="No hay fechas de pronósticos registradas." />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card title="última Fecha de Pronósticos finalizada" style={{ borderRadius: 14 }}>
                  {finishedBetDates.length === 0 ? (
                    <Alert type="info" showIcon title="No hay fechas finalizadas para mostrar." />
                  ) : (
                    finishedBetDates.map(date => (
                      <Card key={date.id} size="small" style={{ marginBottom: 10 }}>
                        <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                          <Text strong>{date.name || `Fecha #${date.id}`}</Text>
                          {date.matches && date.matches.length > 0 && (
                            <Row gutter={[8, 8]} style={{ marginTop: 6 }}>
                              {date.matches.map(match => {
                                const homeScore = typeof match.home_score === 'number' ? match.home_score : Number(match.home_score);
                                const awayScore = typeof match.away_score === 'number' ? match.away_score : Number(match.away_score);
                                const hasScore = Number.isFinite(homeScore) && Number.isFinite(awayScore);
                                return (
                                  <Col key={match.id} xs={24}>
                                    <Card size="small">
                                      <Space align="center" wrap>
                                        <Avatar src={match.home_logo} size={28} />
                                        <Text strong>{hasScore ? homeScore : '-'}</Text>
                                        <Text type="secondary">vs</Text>
                                        <Avatar src={match.away_logo} size={28} />
                                        <Text strong>{hasScore ? awayScore : '-'}</Text>
                                      </Space>
                                    </Card>
                                  </Col>
                                );
                              })}
                            </Row>
                          )}
                        </Space>
                      </Card>
                    ))
                  )}
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
      <footer
        style={{
          background: '#0f1c3d',
          color: '#e8ecf5',
          padding: '32px 24px 20px'
        }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Title level={5} style={{ color: '#ffffff', marginBottom: 8 }}>Información General</Title>
            <Paragraph style={{ color: '#cfd6e6', marginBottom: 8 }}>
              Siempre de Local es una plataforma desarrollada por Chain Reaction Projects S.A.S. para pronósticos deportivos, resultados y estadísticas, con fines recreativos y de entretenimiento. 
              Proporcionamos información en tiempo real para comunidades y competencias.
            </Paragraph>
            <Text style={{ color: '#cfd6e6' }}>Mapa del sitio</Text>
            <div style={{ marginTop: 8 }}>
              <a href="/" style={{ color: '#f5c84b', marginRight: 12 }}><strong>Inicio</strong></a>
           </div>
          </Col>

          <Col xs={24} md={6}>
            <Title level={5} style={{ color: '#ffffff', marginBottom: 8 }}>Enlaces rápidos</Title>
            <Space orientation="vertical" size={4}>
              <a href="/" style={{ color: '#cfd6e6' }}>Inicio</a>
              <a href="/contacto" style={{ color: '#cfd6e6' }}>Contacto</a>
              <a href="/faq" style={{ color: '#cfd6e6' }}>FAQ</a>
              <a href="/register" style={{ color: '#cfd6e6' }}>Crear cuenta</a>
            </Space>
          </Col>

          <Col xs={24} md={5}>
            <Title level={5} style={{ color: '#ffffff', marginBottom: 8 }}>Políticas</Title>
            <Space orientation="vertical" size={4}>
              <a href="/privacy" style={{ color: '#cfd6e6' }}>Privacidad</a>
              <a href="/terms" style={{ color: '#cfd6e6' }}>Términos y condiciones</a>
              <a href="/cookies" style={{ color: '#cfd6e6' }}>Cookies</a>
            </Space>
          </Col>

          <Col xs={24} md={5}>
            <Title level={5} style={{ color: '#ffffff', marginBottom: 8 }}>Contacto</Title>
            <Space orientation="vertical" size={4}>
              <Text style={{ color: '#cfd6e6' }}>ventas@chainreactionprojects.com</Text>
               <Text style={{ color: '#cfd6e6' }}>soporte@siempredelocal.com</Text>
              <Text style={{ color: '#cfd6e6' }}>+57 321 842 4968</Text>
              <Text style={{ color: '#cfd6e6' }}>Medellín, Colombia</Text>
            </Space>
            <div style={{ marginTop: 12 }}>
              
            </div>
          </Col>
        </Row>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.12)',
            marginTop: 20,
            paddingTop: 12,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 8
          }}
        >
          <Text style={{ color: '#cfd6e6' }}>
            © {new Date().getFullYear()} Chain Reaction Projects S.A.S. Todos los derechos reservados.
          </Text>
          <Text style={{ color: '#cfd6e6' }}>
            Mapa del sitio • Políticas • Contacto
          </Text>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
