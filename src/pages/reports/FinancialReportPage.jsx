import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  InputNumber,
  message,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Typography,
} from 'antd';
import { DollarOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import reportService from '../../services/reportService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const sectionCardStyle = {
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
};
const kpiCardStyle = { ...sectionCardStyle, minHeight: 120 };

const FinancialReportPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submittingReset, setSubmittingReset] = useState(false);
  const [summary, setSummary] = useState(null);
  const [txStatus, setTxStatus] = useState({ dashboard: {}, pending: 0, completed: 0 });
  const [error, setError] = useState('');
  const [form] = Form.useForm();

  const loadGeneral = async () => {
    try {
      setLoading(true);
      setError('');
      const [data, tx] = await Promise.all([
        reportService.getFinancialGeneralSummary(),
        reportService.getFinancialTransactionStatus(),
      ]);
      setSummary(data);
      setTxStatus(tx);
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo cargar el resumen financiero.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeneral();
  }, []);

  const onSearchRange = async (values) => {
    const dates = values?.dates || [];
    if (dates.length !== 2) {
      loadGeneral();
      return;
    }

    try {
      setLoading(true);
      const startDate = dates[0].format('YYYY-MM-DD');
      const endDate = dates[1].format('YYYY-MM-DD');
      const [data, tx] = await Promise.all([
        reportService.getFinancialSummaryByRange(startDate, endDate),
        reportService.getFinancialTransactionStatus(),
      ]);
      setSummary(data);
      setTxStatus(tx);
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo cargar el rango solicitado.');
    } finally {
      setLoading(false);
    }
  };

  const onResetAccumulatedPrize = async () => {
    const betDateId = form.getFieldValue('betDateId');
    if (!betDateId) {
      message.warning('Indica un ID de fecha valido.');
      return;
    }

    try {
      setSubmittingReset(true);
      const response = await reportService.resetAccumulatedPrize(betDateId);
      message.success(
        `Premio acumulado reiniciado para ${response.bet_date_name}. Valor anterior: ${response.previous_accumulated_prize}`
      );
      await loadGeneral();
    } catch (err) {
      message.error(err?.response?.data?.detail || 'No se pudo reiniciar el premio acumulado.');
    } finally {
      setSubmittingReset(false);
    }
  };

  const columns = useMemo(
    () => [
      { title: 'Plan', dataIndex: 'plan_name', key: 'plan_name' },
      { title: 'Paquetes vendidos', dataIndex: 'packages_sold', key: 'packages_sold' },
      { title: 'Creditos vendidos', dataIndex: 'total_credits_sold', key: 'total_credits_sold' },
      {
        title: 'Recaudado',
        dataIndex: 'total_revenue_cop',
        key: 'total_revenue_cop',
        render: (value) => `$${Number(value || 0).toLocaleString('es-CO')}`,
      },
      {
        title: 'Acumulado premio',
        dataIndex: 'total_prize_pool_cop',
        key: 'total_prize_pool_cop',
        render: (value) => `$${Number(value || 0).toLocaleString('es-CO')}`,
      },
      {
        title: 'Acumulado app',
        dataIndex: 'total_app_pool_cop',
        key: 'total_app_pool_cop',
        render: (value) => `$${Number(value || 0).toLocaleString('es-CO')}`,
      },
    ],
    []
  );

  const planResume = useMemo(
    () =>
      [...(summary?.plans || [])]
        .sort((a, b) => (a.plan_id || 0) - (b.plan_id || 0))
        .map((plan) => ({
          key: `plan_${plan.plan_id}`,
          label: plan.plan_name || `Plan ${plan.plan_id}`,
          packages_sold: plan.packages_sold || 0,
          plan_id: plan.plan_id,
        })),
    [summary]
  );

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

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card
        style={{
          ...sectionCardStyle,
          background: 'linear-gradient(135deg, #14532d 0%, #0f766e 55%, #0ea5e9 100%)',
          color: '#fff',
        }}
      >
        <Title level={4} style={{ margin: 0, color: '#fff' }}>
          <DollarOutlined style={{ marginRight: 8 }} />
          Reporte Financiero
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
          Ventas, recaudacion y acumulados por plan
        </Text>
      </Card>

      {error && <Alert type="error" showIcon title={error} />}

      <Card style={sectionCardStyle}>
        <Form form={form} layout="vertical" onFinish={onSearchRange}>
          <Row gutter={16} align="bottom">
            <Col xs={24} md={10}>
              <Form.Item name="dates" label="Rango de fechas">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={14}>
              <Space>
                <Button type="primary" htmlType="submit">Consultar</Button>
                <Button onClick={loadGeneral}>Limpiar filtro</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card style={kpiCardStyle}><Statistic title="Paquetes vendidos" value={summary?.total_packages_sold || 0} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={kpiCardStyle}><Statistic title="Creditos vendidos" value={summary?.total_credits_sold || 0} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={kpiCardStyle}><Statistic title="Dinero recaudado" value={summary?.total_revenue_cop || 0} prefix="$" /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card style={kpiCardStyle}><Statistic title="Creditos usados" value={summary?.total_credits_used || 0} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card style={kpiCardStyle}><Statistic title="Total acumulado para premio" value={summary?.total_prize_pool_cop || 0} prefix="$" /></Card>
        </Col>
        <Col xs={24} md={12}>
          <Card style={kpiCardStyle}><Statistic title="Total acumulado para la aplicacion" value={summary?.total_app_pool_cop || 0} prefix="$" /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card style={kpiCardStyle}><Statistic title="Total premios pagados" value={summary?.total_prizes_paid_cop || 0} prefix="$" /></Card>
        </Col>
        <Col xs={24} md={12}>
          <Card style={kpiCardStyle}><Statistic title="Total canjes aprobados" value={summary?.total_canjes_cop || 0} prefix="$" /></Card>
        </Col>
      </Row>

      <Card title="Resumen rapido por plan" style={sectionCardStyle}>
        <Row gutter={[16, 16]}>
          {planResume.map((plan) => (
            <Col key={plan.key} xs={24} md={8}>
              <Card size="small" style={{ borderRadius: 12 }}>
                <Statistic title={plan.label} value={plan.packages_sold} suffix="paquetes" />
                <Text type="secondary">ID: {plan.plan_id}</Text>
              </Card>
            </Col>
          ))}
          {planResume.length === 0 && (
            <Col span={24}>
              <Alert type="info" showIcon title="No hay ventas de planes en el periodo seleccionado." />
            </Col>
          )}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card style={kpiCardStyle}><Statistic title="Transacciones totales" value={txStatus?.dashboard?.total_transactions || 0} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={kpiCardStyle}><Statistic title="Transacciones completadas" value={txStatus?.completed || 0} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={kpiCardStyle}><Statistic title="Transacciones pendientes" value={txStatus?.pending || 0} /></Card>
        </Col>
      </Row>

      <Card title="Detalle por plan" style={sectionCardStyle}>
        <Table
          rowKey={(record) => `${record.plan_id}-${record.plan_name}`}
          dataSource={summary?.plans || []}
          columns={columns}
          pagination={false}
        />
      </Card>

      <Card title="Reiniciar premio acumulado al entregar premio" style={sectionCardStyle}>
        <Row gutter={16} align="bottom">
          <Col xs={24} md={8}>
            <Form form={form} layout="vertical">
              <Form.Item name="betDateId" label="ID de fecha de pronóstico">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Col>
          <Col xs={24} md={16}>
            <Button
              danger
              icon={<ReloadOutlined />}
              loading={submittingReset}
              onClick={onResetAccumulatedPrize}
            >
              Reiniciar acumulado
            </Button>
          </Col>
        </Row>
      </Card>
    </Space>
  );
};

export default FinancialReportPage;
