import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, Row, Select, Spin, Statistic, Tag, Typography, Space, Divider } from 'antd';
import {
  FireOutlined,
  LineChartOutlined,
  TrophyOutlined,
  UserOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  StarOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import reportService from '../../services/reportService';
import './PerformanceReportPage.css';

const { Title, Text } = Typography;

const fmt = (n) => Number(n || 0).toLocaleString('es-CO');

// Tarjeta KPI con acento de color
const KpiCard = ({ title, value, suffix, prefix, icon, color, bg, loading }) => (
  <Card
    loading={loading}
    style={{
      borderRadius: 16,
      border: `1px solid ${color}30`,
      background: bg,
      boxShadow: `0 4px 20px ${color}15`,
      height: '100%',
    }}
    bodyStyle={{ padding: '20px 24px' }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
          {prefix}{value}{suffix && <span style={{ fontSize: 16, fontWeight: 500, marginLeft: 4, color: '#94a3b8' }}>{suffix}</span>}
        </div>
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, color,
      }}>
        {icon}
      </div>
    </div>
  </Card>
);

// Fila de métrica financiera
const FinRow = ({ label, value, highlight, color }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  }}>
    <Text style={{ color: '#94a3b8', fontSize: 13 }}>{label}</Text>
    <Text style={{
      fontWeight: highlight ? 700 : 500,
      fontSize: highlight ? 15 : 13,
      color: color || (highlight ? '#fff' : '#cbd5e1'),
    }}>
      ${value}
    </Text>
  </div>
);

const PerformanceReportPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const loadData = async (windowDays = days) => {
    try {
      setLoading(true);
      setError('');
      const summary = await reportService.getPerformanceSummary(windowDays);
      setData(summary);
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(days); }, [days]);

  const participationRate = useMemo(() => {
    if (!data?.financial?.active_users_count || !data?.integration?.total_bets) return '0.00';
    return (data.integration.total_bets / data.financial.active_users_count).toFixed(2);
  }, [data]);

  if (user?.role !== 'admin') return <Alert type="error" showIcon message="Solo administradores pueden ver este reporte." />;

  return (
    <div className="performance-report-page">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>

        {/* ── Header ── */}
        <Card
          style={{
            borderRadius: 20,
            border: 'none',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0369a1 100%)',
            overflow: 'hidden',
            position: 'relative',
          }}
          bodyStyle={{ padding: '24px 28px' }}
        >
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 180, height: 180,
            borderRadius: '50%', background: 'rgba(14,165,233,0.12)',
          }} />
          <div style={{
            position: 'absolute', bottom: -30, right: 120, width: 100, height: 100,
            borderRadius: '50%', background: 'rgba(56,189,248,0.08)',
          }} />
          <Row justify="space-between" align="middle">
            <Col>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(14,165,233,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: '#38bdf8',
                }}>
                  <BarChartOutlined />
                </div>
                <Title level={4} style={{ margin: 0, color: '#fff' }}>Reporte de Rendimiento</Title>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                Indicadores operativos y financieros del sistema
              </Text>
            </Col>
            <Col>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color="cyan" style={{ borderRadius: 20, padding: '2px 10px' }}>En tiempo real</Tag>
                <Select
                  value={days}
                  style={{ width: 160 }}
                  onChange={setDays}
                  options={[
                    { value: 7, label: 'Últimos 7 días' },
                    { value: 30, label: 'Últimos 30 días' },
                    { value: 90, label: 'Últimos 90 días' },
                  ]}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {error && <Alert type="error" showIcon message={error} />}

        {/* ── Fechas ── */}
        <div>
          <Text style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>
            Fechas de pronósticos
          </Text>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <KpiCard
                loading={loading}
                title="Fechas activas"
                value={data?.operation?.activeDates ?? '—'}
                icon={<FireOutlined />}
                color="#f59e0b"
                bg="linear-gradient(135deg, #1c1200 0%, #2d1f00 100%)"
              />
            </Col>
            <Col xs={24} sm={8}>
              <KpiCard
                loading={loading}
                title="Fechas finalizadas"
                value={data?.operation?.finishedDates ?? '—'}
                icon={<TrophyOutlined />}
                color="#22c55e"
                bg="linear-gradient(135deg, #001a09 0%, #002d12 100%)"
              />
            </Col>
            <Col xs={24} sm={8}>
              <KpiCard
                loading={loading}
                title="Fechas cerradas"
                value={data?.operation?.closedDates ?? '—'}
                icon={<ClockCircleOutlined />}
                color="#60a5fa"
                bg="linear-gradient(135deg, #000d1a 0%, #001a33 100%)"
              />
            </Col>
          </Row>
        </div>

        {/* ── Actividad ── */}
        <div>
          <Text style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>
            Actividad de usuarios
          </Text>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <KpiCard
                loading={loading}
                title="Pronósticos totales"
                value={data?.integration?.total_bets ?? '—'}
                icon={<LineChartOutlined />}
                color="#a78bfa"
                bg="linear-gradient(135deg, #0d0019 0%, #160028 100%)"
              />
            </Col>
            <Col xs={24} sm={12}>
              <KpiCard
                loading={loading}
                title="Promedio pronósticos / usuario activo"
                value={participationRate}
                icon={<UserOutlined />}
                color="#38bdf8"
                bg="linear-gradient(135deg, #00111a 0%, #001e2d 100%)"
              />
            </Col>
          </Row>
        </div>

        {/* ── Financiero + Transaccional ── */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={14}>
            <Card
              style={{
                borderRadius: 16,
                background: '#0f172a',
                border: '1px solid #1e293b',
                height: '100%',
              }}
              bodyStyle={{ padding: '20px 24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <DollarOutlined style={{ color: '#f59e0b', fontSize: 16 }} />
                <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Métricas financieras</Text>
                <Tag color="gold" style={{ marginLeft: 'auto', borderRadius: 20, fontSize: 11 }}>
                  Últimos {days} días
                </Tag>
              </div>

              {loading ? <Spin /> : (
                <>
                  <FinRow label="Ingresos (créditos vendidos)" value={fmt(data?.transactions?.total_cop_received)} highlight />
                  <FinRow label="Premio acumulado actual" value={fmt(data?.transactions?.current_prize_pool_cop)} highlight color="#fbbf24" />
                  <FinRow label="Premios entregados" value={fmt(data?.transactions?.total_prizes_paid)} color="#4ade80" />
                  <FinRow label="Acumulado aplicación" value={fmt(data?.financialRange?.total_app_pool_cop)} color="#60a5fa" />
                  <FinRow label="Canjes aprobados (total)" value={fmt(data?.transactions?.admin_adjustment_completed_cop)} />
                  <FinRow label="Retiros pendientes" value={fmt(data?.transactions?.withdrawals_pending_cop)} />
                  <div style={{ marginTop: 14 }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ background: 'rgba(251,191,36,0.08)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(251,191,36,0.2)' }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                            <StarOutlined style={{ marginRight: 4 }} />Premio acumulado
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>
                            ${fmt(data?.transactions?.current_prize_pool_cop)}
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ background: 'rgba(96,165,250,0.08)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(96,165,250,0.2)' }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                            <WalletOutlined style={{ marginRight: 4 }} />Acumulado app
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#60a5fa' }}>
                            ${fmt(data?.financialRange?.total_app_pool_cop)}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              style={{
                borderRadius: 16,
                background: '#0f172a',
                border: '1px solid #1e293b',
                height: '100%',
              }}
              bodyStyle={{ padding: '20px 24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 16 }} />
                <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Estado transaccional</Text>
              </div>

              {loading ? <Spin /> : (
                <>
                  <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <div style={{ textAlign: 'center', background: '#1e293b', borderRadius: 12, padding: '14px 8px' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                          {data?.transactions?.total_transactions ?? 0}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Transacciones totales</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: 'center', background: '#1e293b', borderRadius: 12, padding: '14px 8px' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>
                          {data?.historyStatus?.completed ?? 0}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Completadas</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: 'center', background: '#1e293b', borderRadius: 12, padding: '14px 8px' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: data?.historyStatus?.pending > 0 ? '#f59e0b' : '#fff' }}>
                          {data?.historyStatus?.pending ?? 0}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Pendientes</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: 'center', background: '#1e293b', borderRadius: 12, padding: '14px 8px' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>
                          {data?.transactions?.total_credits_in_system ?? 0}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Créditos sin usar</div>
                      </div>
                    </Col>
                  </Row>

                  <Divider style={{ borderColor: '#1e293b', margin: '12px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#64748b', fontSize: 12 }}>Total fechas operadas</Text>
                    <Tag color="blue" style={{ borderRadius: 20 }}>
                      {(data?.operation?.finishedDates || 0) + (data?.operation?.closedDates || 0)} fechas
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ color: '#64748b', fontSize: 12 }}>Pronósticos registrados</Text>
                    <Tag color="purple" style={{ borderRadius: 20 }}>
                      {data?.integration?.total_bets || 0} apuestas
                    </Tag>
                  </div>
                </>
              )}
            </Card>
          </Col>
        </Row>

      </Space>
    </div>
  );
};

export default PerformanceReportPage;
