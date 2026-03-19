// frontend/src/components/competitions/CompetitionStats.jsx
import React from 'react';
import { 
  Card, Row, Col, Statistic, Progress, 
  Typography, Divider, Space 
} from 'antd';
import { 
  CalendarOutlined, TrophyOutlined, 
  TeamOutlined, FireOutlined,
  CheckCircleOutlined, ClockCircleOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const CompetitionStats = ({ competition, stats }) => {
  const progressPercentage = stats.total_matches > 0 
    ? (stats.matches_played / stats.total_matches * 100) 
    : 0;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <Card className="competition-tab-card" title="Información General">
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Statistic
                title="Temporada"
                value={competition.season}
                prefix={<CalendarOutlined />}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Equipos"
                value={competition.total_teams || 0}
                prefix={<TeamOutlined />}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="País"
                value={competition.country || 'No especificado'}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Formato"
                value={competition.competition_format === 'double_round' ? 'Ida y Vuelta' : 'Una Vuelta'}
                prefix={<TrophyOutlined />}
              />
            </Col>
          </Row>
          
          <Divider />
          
          <Text strong>Descripción:</Text>
          <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
            {competition.description || 'Sin descripción'}
          </Text>
        </Card>

        <Card className="competition-tab-card" title="Progreso del Torneo" style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>Partidos completados</Text>
            <Progress 
              percent={Number(progressPercentage.toFixed(2))}
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              format={(percent) => (
                <span className="competition-progress-text">{percent}%</span>
              )}
            />
            <Text type="secondary">
              {stats.matches_played || 0} de {stats.total_matches || 0} partidos
            </Text>
          </div>
          
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8}>
              <Statistic
                title="Partidos Programados"
                value={stats.matches_scheduled || 0}
                prefix={<ClockCircleOutlined />}
                styles={{ content: { color: '#1890ff' } }}
              />
            </Col>
            <Col xs={12} md={8}>
              <Statistic
                title="Partidos en Juego"
                value={stats.matches_in_progress || 0}
                prefix={<FireOutlined />}
                styles={{ content: { color: '#fa8c16' } }}
              />
            </Col>
            <Col xs={12} md={8}>
              <Statistic
                title="Partidos Finalizados"
                value={stats.matches_played || 0}
                prefix={<CheckCircleOutlined />}
                styles={{ content: { color: '#52c41a' } }}
              />
            </Col>
          </Row>
        </Card>
      </Col>
      
      <Col xs={24} lg={8}>
        <Card className="competition-tab-card" title="Estadísticas de Goles">
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Statistic
              title="Goles Totales"
              value={stats.goals_scored || 0}
              prefix={<FireOutlined />}
            />
            
            <Statistic
              title="Promedio por Partido"
              value={stats.avg_goals_per_match || 0}
              suffix="goles"
            />
            
            <Divider />
            
            <Statistic
              title="Jornadas Completadas"
              value={`${stats.completed_rounds || 0} / ${stats.total_rounds || 0}`}
              prefix={<TrophyOutlined />}
            />
            
            <Divider />
            
            <div>
              <Text strong>Próximos Partidos:</Text>
              <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                {stats.matches_scheduled || 0} partidos programados
              </Text>
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default CompetitionStats;
