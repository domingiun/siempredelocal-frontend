// frontend/src/pages/matches/MatchesTodayPage.jsx
import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, Row, Col, Button } from 'antd';
import { CalendarOutlined, ReloadOutlined, FireOutlined } from '@ant-design/icons';
import api from '../../services/api';
import MatchCard from '../../components/matches/MatchCard';
import { usePermissions } from '../../hooks/usePermissions';

const { Title, Text } = Typography;

const MatchesTodayPage = () => {
  const { isAdmin } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [todayMatches, setTodayMatches] = useState([]);

  const loadTodayMatches = async () => {
    setLoading(true);
    try {
      const response = await api.get('/matches/today/upcoming');
      setTodayMatches(response.data?.today || []);
    } catch (error) {
      console.error('Error cargando partidos de hoy:', error);
      setTodayMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayMatches();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>
              <FireOutlined style={{ marginRight: 8 }} />
              Partidos de Hoy
            </Title>
            <Text type="secondary">
              Listado de partidos programados para hoy
            </Text>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={loadTodayMatches} loading={loading}>
              Actualizar
            </Button>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        </Card>
      ) : todayMatches.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <CalendarOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
            <Title level={4}>No hay partidos hoy</Title>
            <Text type="secondary">Vuelve más tarde para ver los próximos encuentros.</Text>
          </div>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {todayMatches.map(match => (
            <Col key={match.id} xs={24} sm={12} md={8} lg={6}>
              <MatchCard match={match} showActions={isAdmin} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default MatchesTodayPage;

