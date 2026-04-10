import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Card, Col, Row, Select, Space, Spin, Table, Tag, Typography } from 'antd';
import {
  TeamOutlined, UserOutlined, CheckCircleOutlined,
  FireOutlined, WalletOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import reportService from '../../services/reportService';
import './AttendanceReportPage.css';

const { Text } = Typography;
const fmt = (n) => Number(n || 0).toLocaleString('es-CO');

const DarkCard = ({ children, style = {}, bodyStyle = {} }) => (
  <Card
    style={{ borderRadius: 16, background: '#0f172a', border: '1px solid #1e293b', ...style }}
    bodyStyle={{ padding: '20px 24px', ...bodyStyle }}
  >
    {children}
  </Card>
);

const KpiCard = ({ title, value, suffix, icon, color, bg, loading }) => (
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
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
          {value}
          {suffix && <span style={{ fontSize: 15, fontWeight: 500, marginLeft: 4, color: '#94a3b8' }}>{suffix}</span>}
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

const AttendanceReportPage = () => {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const loadData = async (windowDays = days) => {
    try {
      setLoading(true);
      setError('');
      const summary = await reportService.getAttendanceSummary(windowDays);
      setData(summary);
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo cargar el reporte de asistencia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(days); }, [days]);

  const usersCredits = useMemo(() => data?.usersCredits || [], [data]);
  const lastBetdateName = data?.lastBetdateName || null;

  const totalUsed      = useMemo(() => usersCredits.reduce((s, u) => s + Number(u.credits_used || 0), 0), [usersCredits]);
  const totalAvailable = useMemo(() => usersCredits.reduce((s, u) => s + Number(u.credits_available || 0), 0), [usersCredits]);
  const totalLastDate  = useMemo(() => usersCredits.reduce((s, u) => s + Number(u.credits_used_last_betdate || 0), 0), [usersCredits]);

  const participants = data?.financial?.active_users_count || 0;
  const participationPct = usersCredits.length > 0
    ? ((participants / usersCredits.length) * 100).toFixed(1)
    : '0.0';

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getAvatarSrc = (url) => {
    if (!url) return undefined;
    return url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
  };

  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      render: (_, r) => (
        <Space>
          <Avatar size="small" src={getAvatarSrc(r.avatar_url)} icon={!r.avatar_url ? <UserOutlined /> : undefined} />
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{r.username}</div>
            {r.full_name && <div style={{ color: '#64748b', fontSize: 11 }}>{r.full_name}</div>}
          </div>
        </Space>
      ),
    },
    {
      title: 'Créditos usados',
      dataIndex: 'credits_used',
      key: 'credits_used',
      align: 'right',
      render: (v) => <Text style={{ color: '#a78bfa', fontWeight: 600 }}>{v || 0}</Text>,
      sorter: (a, b) => (a.credits_used || 0) - (b.credits_used || 0),
    },
    {
      title: 'Disponibles',
      dataIndex: 'credits_available',
      key: 'credits_available',
      align: 'right',
      render: (v) => <Text style={{ color: v > 0 ? '#38bdf8' : '#475569', fontWeight: 600 }}>{v || 0}</Text>,
      sorter: (a, b) => (a.credits_available || 0) - (b.credits_available || 0),
    },
    {
      title: lastBetdateName ? `Últ. Fecha` : 'Últ. Fecha',
      dataIndex: 'credits_used_last_betdate',
      key: 'credits_used_last_betdate',
      align: 'right',
      render: (v) => (
        <Tag
          color={v > 0 ? 'green' : 'default'}
          style={{ borderRadius: 20, minWidth: 32, textAlign: 'center' }}
        >
          {v || 0}
        </Tag>
      ),
      sorter: (a, b) => (a.credits_used_last_betdate || 0) - (b.credits_used_last_betdate || 0),
    },
    {
      title: 'Invertido',
      dataIndex: 'total_invested_cop',
      key: 'total_invested_cop',
      align: 'right',
      render: (v) => <Text style={{ color: '#4ade80', fontSize: 13 }}>${fmt(v)}</Text>,
      sorter: (a, b) => (a.total_invested_cop || 0) - (b.total_invested_cop || 0),
    },
    {
      title: 'Premios recibidos',
      dataIndex: 'total_prizes_cop',
      key: 'total_prizes_cop',
      align: 'right',
      render: (v) => <Text style={{ color: v > 0 ? '#fbbf24' : '#475569', fontSize: 13 }}>${fmt(v)}</Text>,
      sorter: (a, b) => (a.total_prizes_cop || 0) - (b.total_prizes_cop || 0),
    },
  ];

  if (user?.role !== 'admin') return <Alert type="error" showIcon message="Solo administradores pueden ver este reporte." />;

  return (
    <div className="attendance-report-page">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>

        {/* ── Header ── */}
        <Card
          style={{
            borderRadius: 20, border: 'none', overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(135deg, #0c1a3a 0%, #1e3a8a 50%, #0f766e 100%)',
          }}
          bodyStyle={{ padding: '24px 28px' }}
        >
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(14,165,233,0.12)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: 100, width: 80, height: 80, borderRadius: '50%', background: 'rgba(20,184,166,0.1)' }} />
          <Row justify="space-between" align="middle" wrap>
            <Col>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#38bdf8' }}>
                  <TeamOutlined />
                </div>
                <Text style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>Reporte de Asistencia</Text>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                Participación de usuarios en pronósticos
              </Text>
            </Col>
            <Col>
              <Select
                value={days}
                style={{ width: 170 }}
                onChange={setDays}
                options={[
                  { value: 7,  label: 'Últimos 7 días' },
                  { value: 30, label: 'Últimos 30 días' },
                  { value: 90, label: 'Últimos 90 días' },
                ]}
              />
            </Col>
          </Row>
        </Card>

        {error && <Alert type="error" showIcon message={error} />}

        {/* ── KPIs participación ── */}
        <div>
          <SectionLabel>Participación</SectionLabel>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <KpiCard
                loading={loading}
                title="Usuarios registrados activos"
                value={usersCredits.length}
                icon={<UserOutlined />}
                color="#38bdf8"
                bg="linear-gradient(135deg, #00111a 0%, #001e2d 100%)"
              />
            </Col>
            <Col xs={24} sm={8}>
              <KpiCard
                loading={loading}
                title="Usuarios que participaron"
                value={participants}
                icon={<CheckCircleOutlined />}
                color="#4ade80"
                bg="linear-gradient(135deg, #001a09 0%, #002d12 100%)"
              />
            </Col>
            <Col xs={24} sm={8}>
              <KpiCard
                loading={loading}
                title="Tasa de participación"
                value={participationPct}
                suffix="%"
                icon={<FireOutlined />}
                color="#f59e0b"
                bg="linear-gradient(135deg, #1c1200 0%, #2d1f00 100%)"
              />
            </Col>
          </Row>
        </div>

        {/* ── KPIs créditos ── */}
        <div>
          <SectionLabel>Créditos del período</SectionLabel>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <KpiCard
                loading={loading}
                title="Créditos usados en el período"
                value={fmt(totalUsed)}
                icon={<WalletOutlined />}
                color="#a78bfa"
                bg="linear-gradient(135deg, #0d0019 0%, #160028 100%)"
              />
            </Col>
            <Col xs={24} sm={8}>
              <KpiCard
                loading={loading}
                title="Créditos disponibles"
                value={fmt(totalAvailable)}
                icon={<WalletOutlined />}
                color="#34d399"
                bg="linear-gradient(135deg, #001a12 0%, #002b1e 100%)"
              />
            </Col>
            <Col xs={24} sm={8}>
              <KpiCard
                loading={loading}
                title={lastBetdateName ? `Últ. Fecha: ${lastBetdateName}` : 'Créditos en última fecha'}
                value={fmt(totalLastDate)}
                icon={<CalendarOutlined />}
                color="#fbbf24"
                bg="linear-gradient(135deg, #1a0f00 0%, #2d1a00 100%)"
              />
            </Col>
          </Row>
        </div>

        {/* ── Tabla usuarios ── */}
        <div>
          <SectionLabel>Detalle por usuario</SectionLabel>
          <DarkCard bodyStyle={{ padding: 0 }}>
            {lastBetdateName && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarOutlined style={{ color: '#fbbf24' }} />
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>
                  Última fecha de pronósticos: <strong style={{ color: '#fbbf24' }}>{lastBetdateName}</strong>
                </Text>
              </div>
            )}
            <Table
              rowKey="user_id"
              columns={columns}
              dataSource={usersCredits.map((u) => ({ ...u, id: u.user_id }))}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              size="middle"
              loading={loading}
              style={{ background: 'transparent' }}
            />
          </DarkCard>
        </div>

      </Space>
    </div>
  );
};

export default AttendanceReportPage;
