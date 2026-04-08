import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Typography,
} from 'antd';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import { useAuth } from '../../context/AuthContext';
import reportService from '../../services/reportService';
import './AttendanceReportPage.css';

const { Title, Text } = Typography;
const sectionCardStyle = {
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
};
const kpiCardStyle = { ...sectionCardStyle, minHeight: 120 };

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

  useEffect(() => {
    loadData(days);
  }, [days]);

  const usersCredits = useMemo(() => data?.usersCredits || [], [data]);

  const participationPercentage = useMemo(() => {
    const total = usersCredits.length;
    const participants = data?.financial?.active_users_count || 0;
    if (!total) return 0;
    return ((participants / total) * 100).toFixed(2);
  }, [usersCredits, data]);

  const totalUsedCredits = useMemo(
    () => usersCredits.reduce((sum, user) => sum + Number(user.credits_used || 0), 0),
    [usersCredits]
  );

  const totalAvailableCredits = useMemo(
    () => usersCredits.reduce((sum, user) => sum + Number(user.credits_available || 0), 0),
    [usersCredits]
  );

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getAvatarSrc = (avatarUrl) => {
    if (!avatarUrl) return undefined;
    return avatarUrl.startsWith('http') ? avatarUrl : `${apiBaseUrl}${avatarUrl}`;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      render: (_, record) => (
        <Space>
          <Avatar
            size="small"
            src={getAvatarSrc(record.avatar_url)}
            icon={!record.avatar_url ? <UserOutlined /> : undefined}
          />
          <span>{record.username}</span>
        </Space>
      )
    },
    { title: 'Nombre', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Creditos usados', dataIndex: 'credits_used', key: 'credits_used' },
    { title: 'Creditos disponibles', dataIndex: 'credits_available', key: 'credits_available' },
    {
      title: 'Invertido',
      dataIndex: 'total_invested_cop',
      key: 'total_invested_cop',
      render: (value) => `$${Number(value || 0).toLocaleString('es-CO')}`
    },
    {
      title: 'Premios recibidos',
      dataIndex: 'total_prizes_cop',
      key: 'total_prizes_cop',
      render: (value) => `$${Number(value || 0).toLocaleString('es-CO')}`
    },
  ];

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
    <div className="attendance-report-page">
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card
        style={{
          ...sectionCardStyle,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0f766e 60%, #14b8a6 100%)',
          color: '#fff',
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0, color: '#fff' }}>
              <TeamOutlined style={{ marginRight: 8 }} />
              Reporte de Asistencia
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              Participacion de usuarios en pronósticos
            </Text>
          </Col>
          <Col>
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

      {error && <Alert type="error" showIcon title={error} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card style={kpiCardStyle}>
            <Statistic title="Usuarios activos registrados" value={usersCredits.length} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={kpiCardStyle}>
            <Statistic title="Usuarios que participaron" value={data?.financial?.active_users_count || 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={kpiCardStyle}>
            <Statistic title="Tasa de participacion" value={participationPercentage} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card style={kpiCardStyle}>
            <Statistic
              title="Creditos usados en el periodo"
              value={totalUsedCredits}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card style={kpiCardStyle}>
            <Statistic
              title="Creditos disponibles para pronósticos"
              value={totalAvailableCredits}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Detalle de creditos por usuario" style={sectionCardStyle}>
        <Table
          rowKey="user_id"
          columns={columns}
          dataSource={usersCredits.map((u) => ({ ...u, id: u.user_id }))}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      </Space>
    </div>
  );
};

export default AttendanceReportPage;
