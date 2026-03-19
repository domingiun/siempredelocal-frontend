// frontend/src/pages/rounds/CompetitionRoundsPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import RoundList from '../../components/rounds/RoundList';
import { Typography, Card, Row, Col, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const CompetitionRoundsPage = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/competitions/${competitionId}`)}
              style={{ marginBottom: 16 }}
            >
              Volver a Competencia
            </Button>
            <Title level={2}>Jornadas de la Competencia</Title>
            <p>Listado de todas las jornadas de esta competencia.</p>
          </Card>
        </Col>
        
        <Col span={24}>
          <RoundList competitionId={competitionId} />
        </Col>
      </Row>
    </div>
  );
};

export default CompetitionRoundsPage;
