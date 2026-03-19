import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Divider,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import {
  FireOutlined,
  LineChartOutlined,
  TrophyOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import reportService from '../../services/reportService';

const { Title, Text } = Typography;
const sectionCardStyle = {
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
};
const kpiCardStyle = {
  ...sectionCardStyle,
  minHeight: 132,
};
const numberStyle = { fontWeight: 700, color: '#0f172a' };

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
      setError(err?.response?.data?.detail || 'No se pudo cargar el reporte de rendimiento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(days);
  }, [days]);

  const participationRate = useMemo(() => {
    if (!data?.financial?.active_users_count || !data?.integration?.total_bets) return 0;
    return (data.integration.total_bets / data.financial.active_users_count).toFixed(2);
  }, [data]);

  if (user?.role !== 'admin') {
    return <Alert type="error" showIcon title="Solo administradores pueden ver este reporte." />;
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" showIcon title={error} />;
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card
        style={{
          ...sectionCardStyle,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0ea5e9 100%)',
          color: '#fff',
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0, color: '#fff' }}>
              <LineChartOutlined style={{ marginRight: 8 }} />
              Reporte de Rendimiento
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Indicadores operativos del sistema</Text>
          </Col>
          <Col>
            <Tag color="cyan">Datos en tiempo real</Tag>
            <Select
              value={days}
              style={{ width: 160 }}
              onChange={setDays}
              options={[
                { value: 7, label: 'Ultimos 7 dias' },
                { value: 30, label: 'Ultimos 30 dias' },
                { value: 90, label: 'Ultimos 90 dias' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <Card style={kpiCardStyle}>
            <Statistic
              title="Creditos sin usar"
              value={data?.transactions?.total_credits_in_system || 0}
              prefix={<WalletOutlined />}
              valueStyle={numberStyle}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card style={kpiCardStyle}>
            <Statistic
              title="Fechas activas"
              value={data?.operation?.activeDates || 0}
              prefix={<FireOutlined />}
              valueStyle={numberStyle}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card style={kpiCardStyle}>
            <Statistic
              title="Fechas finalizadas"
              value={data?.operation?.finishedDates || 0}
              prefix={<TrophyOutlined />}
              valueStyle={numberStyle}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card style={kpiCardStyle}>
            <Statistic
              title="Fechas cerradas"
              value={data?.operation?.closedDates || 0}
              prefix={<TrophyOutlined />}
              valueStyle={numberStyle}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card style={kpiCardStyle}>
            <Statistic
              title="Pronósticos totales"
              value={data?.integration?.total_bets || 0}
              prefix={<LineChartOutlined />}
              valueStyle={numberStyle}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card style={kpiCardStyle}>
            <Statistic
              title="Promedio por usuario activo"
              value={participationRate}
              prefix={<UserOutlined />}
              valueStyle={numberStyle}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Metricas financieras" style={sectionCardStyle}>
            <Space orientation="vertical">
              <Text>
                Ingresos (creditos vendidos): <strong>${(data?.transactions?.total_cop_received || 0).toLocaleString('es-CO')}</strong>
              </Text>
              <Text>Premio acumulado actual: <strong>${(data?.transactions?.current_prize_pool_cop || 0).toLocaleString('es-CO')}</strong></Text>
              <Text>Premios entregados: <strong>${(data?.transactions?.total_prizes_paid || 0).toLocaleString('es-CO')}</strong></Text>
              <Text>Solicitudes retiro (pendientes): <strong>${(data?.transactions?.withdrawals_pending_cop || 0).toLocaleString('es-CO')}</strong></Text>
              <Text>Canje puntos a créditos (pendientes): <strong>${(data?.transactions?.points_to_credits_pending_cop || 0).toLocaleString('es-CO')}</strong></Text>
              <Text>Solicitudes de Canje aprobadas (total): <strong>${(data?.transactions?.admin_adjustment_completed_cop || 0).toLocaleString('es-CO')}</strong></Text>
              <Text>Acumulado aplicacion: <strong>${(data?.financialRange?.total_app_pool_cop || 0).toLocaleString('es-CO')}</strong></Text>
            </Space>
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary">Periodo de analisis: ultimos {days} dias.</Text>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Estado transaccional" style={sectionCardStyle}>
            <Space orientation="vertical">
              <Text>Transacciones totales: <strong>{data?.transactions?.total_transactions || 0}</strong></Text>
              <Text>Completadas (historial): <strong>{data?.historyStatus?.completed || 0}</strong></Text>
              <Text>Pendientes (historial): <strong>{data?.historyStatus?.pending || 0}</strong></Text>
              <Text>Creditos en sistema (sin usar): <strong>{data?.transactions?.total_credits_in_system || 0}</strong></Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default PerformanceReportPage;
