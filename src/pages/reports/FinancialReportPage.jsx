import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, Card, Col, DatePicker, Divider, Form,
  InputNumber, message, Row, Space, Spin, Table, Tag,
  Tooltip, Typography,
} from 'antd';
import {
  AppstoreOutlined, DollarOutlined, InfoCircleOutlined,
  ReloadOutlined, TrophyOutlined, ShoppingOutlined,
  CreditCardOutlined, CheckCircleOutlined, SwapOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import reportService from '../../services/reportService';
import './FinancialReportPage.css';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const fmt = (n) => Number(n || 0).toLocaleString('es-CO');

const DarkCard = ({ children, style = {}, bodyStyle = {} }) => (
  <Card
    style={{ borderRadius: 16, background: '#0f172a', border: '1px solid #1e293b', ...style }}
    bodyStyle={{ padding: '20px 24px', ...bodyStyle }}
  >
    {children}
  </Card>
);

const KpiCard = ({ title, value, prefix = '$', icon, color, bg, loading, suffix }) => (
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.1, wordBreak: 'break-word' }}>
          {prefix && <span style={{ fontSize: 14, color: '#64748b', marginRight: 2 }}>{prefix}</span>}
          {value}
          {suffix && <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4, color: '#94a3b8' }}>{suffix}</span>}
        </div>
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, color, marginLeft: 12,
      }}>
        {icon}
      </div>
    </div>
  </Card>
);

const SectionLabel = ({ children }) => (
  <Text style={{
    fontSize: 11, fontWeight: 700, color: '#64748b',
    letterSpacing: 1, textTransform: 'uppercase',
    marginBottom: 10, display: 'block',
  }}>
    {children}
  </Text>
);

const FinRow = ({ label, value, color, highlight, tooltip }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Text style={{ color: '#94a3b8', fontSize: 13 }}>{label}</Text>
      {tooltip && (
        <Tooltip title={tooltip}>
          <InfoCircleOutlined style={{ color: '#475569', fontSize: 11 }} />
        </Tooltip>
      )}
    </div>
    <Text style={{ fontWeight: highlight ? 700 : 500, fontSize: highlight ? 15 : 13, color: color || (highlight ? '#fff' : '#cbd5e1') }}>
      ${value}
    </Text>
  </div>
);

const FinancialReportPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submittingReset, setSubmittingReset] = useState(false);
  const [summary, setSummary] = useState(null);
  const [txStatus, setTxStatus] = useState({ dashboard: {}, pending: 0, completed: 0 });
  const [error, setError] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();

  const loadGeneral = async () => {
    try {
      setLoading(true);
      setError('');
      setIsFiltered(false);
      form.resetFields();
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

  useEffect(() => { loadGeneral(); }, []);

  const onSearchRange = async (values) => {
    const dates = values?.dates || [];
    if (dates.length !== 2) { loadGeneral(); return; }
    try {
      setLoading(true);
      setIsFiltered(true);
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
    const betDateId = resetForm.getFieldValue('betDateId');
    if (!betDateId) { message.warning('Indica un ID de fecha válido.'); return; }
    try {
      setSubmittingReset(true);
      const res = await reportService.resetAccumulatedPrize(betDateId);
      message.success(`Premio reiniciado para "${res.bet_date_name}". Anterior: $${fmt(res.previous_accumulated_prize)}`);
      await loadGeneral();
    } catch (err) {
      message.error(err?.response?.data?.detail || 'No se pudo reiniciar el premio acumulado.');
    } finally {
      setSubmittingReset(false);
    }
  };

  const revenue  = summary?.total_revenue_cop || 0;
  const prize    = summary?.total_prize_pool_cop || 0;
  const app      = summary?.total_app_pool_cop || 0;
  const prizeP   = revenue > 0 ? Math.round((prize / revenue) * 100) : 0;
  const appP     = revenue > 0 ? Math.round((app / revenue) * 100) : 0;
  const ivaInfo  = Math.round(app * 0.19);

  const columns = useMemo(() => [
    { title: 'Plan', dataIndex: 'plan_name', key: 'plan_name', render: (v) => <Text style={{ color: '#e2e8f0', fontWeight: 600 }}>{v}</Text> },
    { title: 'Paquetes', dataIndex: 'packages_sold', key: 'packages_sold', align: 'right' },
    { title: 'Créditos', dataIndex: 'total_credits_sold', key: 'total_credits_sold', align: 'right' },
    { title: 'Recaudado', dataIndex: 'total_revenue_cop', key: 'total_revenue_cop', align: 'right', render: (v) => <Text style={{ color: '#4ade80' }}>${fmt(v)}</Text> },
    { title: 'Premio acumulado', dataIndex: 'total_prize_pool_cop', key: 'total_prize_pool_cop', align: 'right', render: (v) => <Text style={{ color: '#fbbf24' }}>${fmt(v)}</Text> },
    { title: 'App acumulado', dataIndex: 'total_app_pool_cop', key: 'total_app_pool_cop', align: 'right', render: (v) => <Text style={{ color: '#60a5fa' }}>${fmt(v)}</Text> },
  ], []);

  if (user?.role !== 'admin') return <Alert type="error" showIcon message="Solo administradores pueden ver este reporte." />;

  return (
    <div className="financial-report-page">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>

        {/* ── Header ── */}
        <Card
          style={{
            borderRadius: 20, border: 'none', overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(135deg, #052e16 0%, #065f46 50%, #0f766e 100%)',
          }}
          bodyStyle={{ padding: '24px 28px' }}
        >
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(16,185,129,0.12)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: 100, width: 80, height: 80, borderRadius: '50%', background: 'rgba(52,211,153,0.08)' }} />
          <Row justify="space-between" align="middle" wrap>
            <Col>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#34d399' }}>
                  <DollarOutlined />
                </div>
                <Text style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>Reporte Financiero</Text>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Ventas, recaudación y distribución de ingresos</Text>
            </Col>
            <Col>
              {isFiltered && (
                <Tag color="orange" style={{ borderRadius: 20, marginRight: 8 }}>Filtro activo</Tag>
              )}
              <Tag color="green" style={{ borderRadius: 20 }}>Historial completo</Tag>
            </Col>
          </Row>
        </Card>

        {/* ── Filtro de fechas ── */}
        <DarkCard>
          <Form form={form} layout="inline" onFinish={onSearchRange} style={{ gap: 12, flexWrap: 'wrap' }}>
            <Form.Item name="dates" label={<Text style={{ color: '#94a3b8' }}>Rango de fechas</Text>} style={{ marginBottom: 0 }}>
              <RangePicker style={{ background: '#1e293b', borderColor: '#334155' }} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" style={{ background: '#059669', borderColor: '#059669' }}>
                  Consultar
                </Button>
                <Button onClick={loadGeneral} style={{ background: '#1e293b', borderColor: '#334155', color: '#94a3b8' }}>
                  Ver historial completo
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </DarkCard>

        {error && <Alert type="error" showIcon message={error} />}

        {/* ── KPIs ventas ── */}
        <div>
          <SectionLabel>Ventas de créditos</SectionLabel>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <KpiCard loading={loading} title="Paquetes vendidos" value={fmt(summary?.total_packages_sold)} prefix="" suffix="paquetes" icon={<ShoppingOutlined />} color="#a78bfa" bg="linear-gradient(135deg, #0d0019 0%, #160028 100%)" />
            </Col>
            <Col xs={24} sm={8}>
              <KpiCard loading={loading} title="Créditos vendidos" value={fmt(summary?.total_credits_sold)} prefix="" suffix="créditos" icon={<CreditCardOutlined />} color="#38bdf8" bg="linear-gradient(135deg, #00111a 0%, #001e2d 100%)" />
            </Col>
            <Col xs={24} sm={8}>
              <KpiCard loading={loading} title="Dinero recaudado" value={fmt(summary?.total_revenue_cop)} icon={<DollarOutlined />} color="#4ade80" bg="linear-gradient(135deg, #001a09 0%, #002d12 100%)" />
            </Col>
          </Row>
        </div>

        {/* ── KPIs uso y pagos ── */}
        <div>
          <SectionLabel>Uso y pagos</SectionLabel>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <KpiCard loading={loading} title="Créditos usados" value={fmt(summary?.total_credits_used)} prefix="" suffix="créditos" icon={<SwapOutlined />} color="#f59e0b" bg="linear-gradient(135deg, #1c1200 0%, #2d1f00 100%)" />
            </Col>
            <Col xs={24} sm={8}>
              <KpiCard loading={loading} title="Premios pagados" value={fmt(summary?.total_prizes_paid_cop)} icon={<TrophyOutlined />} color="#fbbf24" bg="linear-gradient(135deg, #1a0f00 0%, #2d1a00 100%)" />
            </Col>
            <Col xs={24} sm={8}>
              <KpiCard loading={loading} title="Canjes aprobados" value={fmt(summary?.total_canjes_cop)} icon={<CheckCircleOutlined />} color="#34d399" bg="linear-gradient(135deg, #001a12 0%, #002b1e 100%)" />
            </Col>
          </Row>
        </div>

        {/* ── Distribución + Transacciones ── */}
        <Row gutter={[20, 20]}>
          {/* Distribución */}
          <Col xs={24} lg={14}>
            <DarkCard style={{ height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AppstoreOutlined style={{ color: '#a78bfa', fontSize: 16 }} />
                <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Distribución de ingresos</Text>
                <Tooltip title="Premio ≈ 39% por crédito por defecto (configurable por plan). App ≈ 61%.">
                  <InfoCircleOutlined style={{ color: '#475569', fontSize: 12, marginLeft: 4 }} />
                </Tooltip>
              </div>

              {loading ? <Spin /> : (
                <>
                  {/* Barras visuales */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrophyOutlined style={{ color: '#fbbf24' }} />
                        <Text style={{ color: '#94a3b8', fontSize: 13 }}>Acumulado premio</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: '#fbbf24', fontWeight: 700 }}>${fmt(prize)}</Text>
                        <Tag color="gold" style={{ borderRadius: 20, fontSize: 11 }}>{prizeP}%</Tag>
                      </div>
                    </div>
                    <div style={{ height: 10, background: '#1e293b', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${prizeP}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: 5, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AppstoreOutlined style={{ color: '#60a5fa' }} />
                        <Text style={{ color: '#94a3b8', fontSize: 13 }}>Acumulado aplicación</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: '#60a5fa', fontWeight: 700 }}>${fmt(app)}</Text>
                        <Tag color="blue" style={{ borderRadius: 20, fontSize: 11 }}>{appP}%</Tag>
                      </div>
                    </div>
                    <div style={{ height: 10, background: '#1e293b', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${appP}%`, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', borderRadius: 5, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>

                  <Divider style={{ borderColor: '#1e293b', margin: '16px 0' }} />

                  <FinRow label="Total recaudado" value={fmt(revenue)} highlight />
                  <FinRow label="Premios pagados" value={fmt(summary?.total_prizes_paid_cop)} color="#4ade80" />
                  <FinRow label="Canjes (retiros + puntos)" value={fmt(summary?.total_canjes_cop)} />
                  <FinRow
                    label="IVA informativo (19% sobre app)"
                    value={fmt(ivaInfo)}
                    color="#f97316"
                    tooltip="APPLY_TAXES=False — no se descuenta automáticamente. Solo referencial."
                  />

                  <div style={{ marginTop: 12, background: 'rgba(249,115,22,0.08)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(249,115,22,0.2)' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <WarningOutlined style={{ color: '#f97316', marginTop: 2 }} />
                      <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                        IVA <strong style={{ color: '#f97316' }}>19%</strong> sobre acumulado app: <strong style={{ color: '#fff' }}>${fmt(ivaInfo)}</strong>. Impuestos no aplicados automáticamente (<code style={{ color: '#f97316' }}>APPLY_TAXES=False</code>).
                      </Text>
                    </div>
                  </div>
                </>
              )}
            </DarkCard>
          </Col>

          {/* Transacciones */}
          <Col xs={24} lg={10}>
            <DarkCard style={{ height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 16 }} />
                <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Transacciones</Text>
              </div>

              {loading ? <Spin /> : (
                <Row gutter={[12, 12]}>
                  {[
                    { label: 'Totales', value: txStatus?.dashboard?.total_transactions ?? 0, color: '#fff' },
                    { label: 'Completadas', value: txStatus?.completed ?? 0, color: '#4ade80' },
                    { label: 'Pendientes', value: txStatus?.pending ?? 0, color: txStatus?.pending > 0 ? '#f59e0b' : '#fff' },
                    { label: 'Créditos usados', value: fmt(summary?.total_credits_used), color: '#38bdf8' },
                  ].map(({ label, value, color }) => (
                    <Col span={12} key={label}>
                      <div style={{ textAlign: 'center', background: '#1e293b', borderRadius: 12, padding: '14px 8px' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{label}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </DarkCard>
          </Col>
        </Row>

        {/* ── Planes ── */}
        <div>
          <SectionLabel>Ventas por plan</SectionLabel>
          <DarkCard bodyStyle={{ padding: 0 }}>
            {summary?.plans?.length > 0 ? (
              <Table
                rowKey={(r) => `${r.plan_id}-${r.plan_name}`}
                dataSource={summary.plans}
                columns={columns}
                pagination={false}
                size="middle"
                style={{ background: 'transparent' }}
              />
            ) : (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <Text style={{ color: '#475569' }}>Sin ventas de planes en el período seleccionado.</Text>
              </div>
            )}
          </DarkCard>
        </div>

        {/* ── Reset premio ── */}
        <DarkCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ReloadOutlined style={{ color: '#f87171', fontSize: 16 }} />
            <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Reiniciar premio acumulado</Text>
            <Tag color="red" style={{ borderRadius: 20, fontSize: 11, marginLeft: 4 }}>Acción irreversible</Tag>
          </div>
          <Text style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 16 }}>
            Usa esto después de entregar el premio a un ganador. Reinicia el acumulado de la fecha indicada a $0.
          </Text>
          <Form form={resetForm} layout="inline" style={{ gap: 12 }}>
            <Form.Item name="betDateId" label={<Text style={{ color: '#94a3b8' }}>ID de fecha</Text>} style={{ marginBottom: 0 }}>
              <InputNumber min={1} placeholder="Ej: 14" style={{ background: '#1e293b', borderColor: '#334155', color: '#fff', width: 140 }} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                danger
                icon={<ReloadOutlined />}
                loading={submittingReset}
                onClick={onResetAccumulatedPrize}
              >
                Reiniciar acumulado
              </Button>
            </Form.Item>
          </Form>
        </DarkCard>

      </Space>
    </div>
  );
};

export default FinancialReportPage;
