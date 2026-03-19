// frontend/src/pages/rounds/EditRoundPage.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // ← AÑADIR useLocation
import { Typography, Card, Row, Col, Button, message, Spin } from 'antd';
import { ArrowLeftOutlined, LoadingOutlined } from '@ant-design/icons';
import RoundForm from '../../components/rounds/RoundForm';
import { useAuth } from '../../context/AuthContext';
import competitionService from '../../services/competitionService';

const { Title, Text } = Typography;

const EditRoundPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // ← OBTENER LOCATION
  const { user } = useAuth();
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [competitionId, setCompetitionId] = useState(null);

  useEffect(() => {
    if (id) {
      // 1. Intentar obtener competitionId del state de navegación
      const stateCompetitionId = location.state?.competitionId;
      
      if (stateCompetitionId) {
        setCompetitionId(stateCompetitionId);
        fetchRoundData(stateCompetitionId);
      } else {
        // 2. Si no viene en state, buscar en todas las competencias
        findRoundInCompetitions();
      }
    }
  }, [id, location.state]);

  const findRoundInCompetitions = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Buscando jornada ${id} en todas las competencias...`);
      
      // Obtener todas las competencias
      const compsResponse = await competitionService.getCompetitions({ limit: 50 });
      const competitions = compsResponse.data || [];
      
      // Buscar en cada competencia
      for (const comp of competitions) {
        try {
          console.log(`🔍 Buscando en competencia ${comp.id}: ${comp.name}`);
          const roundsResponse = await competitionService.getRounds(comp.id);
          const rounds = roundsResponse.data || [];
          
          const foundRound = rounds.find(r => r.id === parseInt(id));
          
          if (foundRound) {
            console.log(`✅ Encontrado en competencia ${comp.id}`);
            setCompetitionId(comp.id);
            setRound({
              ...foundRound,
              competition_id: comp.id,
              competition_name: comp.name
            });
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn(`⚠️ Error buscando en competencia ${comp.id}:`, error.message);
          // Continuar con siguiente competencia
        }
      }
      
      // Si no se encontró en ninguna competencia
      message.error(`Jornada ${id} no encontrada en ninguna competencia`);
      navigate('/rounds/management');
      
    } catch (error) {
      console.error('❌ Error buscando jornada:', error);
      message.error('Error al buscar la jornada');
      navigate('/rounds/management');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoundData = async (compId) => {
    try {
      setLoading(true);
      console.log(`📡 Cargando jornada ${id} de competencia ${compId}...`);
      
      // Usar getRound con competition_id
      const response = await competitionService.getRound(compId, id);
      console.log('✅ Jornada cargada:', response.data);
      
      setRound(response.data);
      
    } catch (error) {
      console.error('❌ Error cargando jornada:', error);
      message.error('Error al cargar jornada');
      navigate('/rounds/management');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (updatedRound) => {
    message.success('✅ Jornada actualizada exitosamente');
    navigate(`/competitions/${competitionId}/rounds/${id}`);
  };

  const handleCancel = () => {
    navigate('/rounds/management');
  };

  // Si no es admin, redirigir
  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Title level={4} style={{ color: '#f5222d' }}>
            Acceso Denegado
          </Title>
          <p>Solo los administradores pueden editar jornadas.</p>
          <Button onClick={() => navigate('/rounds/management')}>
            Volver a gestión
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />} 
          size="large"
        />
        <Title level={4} style={{ marginTop: 16 }}>
          Buscando jornada {id}...
        </Title>
        <Text type="secondary">
          {competitionId 
            ? `Cargando de competencia ${competitionId}` 
            : 'Buscando en todas las competencias...'}
        </Text>
      </div>
    );
  }

  if (!round) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Title level={4} style={{ color: '#f5222d' }}>
            Jornada no encontrada
          </Title>
          <p>La jornada que intentas editar no existe o no tienes permisos.</p>
          <Button onClick={() => navigate('/rounds/management')}>
            Volver a gestión
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/rounds/management')}
              style={{ marginBottom: 16 }}
            >
              Volver a Gestión
            </Button>
            
            <Title level={2}>Editar Jornada</Title>
            
            <div style={{ marginBottom: 24 }}>
              <Text strong>Jornada:</Text> {round.name} <br />
              <Text strong>Competencia:</Text> {round.competition_name || `ID: ${round.competition_id}`} <br />
              <Text strong>Número:</Text> {round.round_number}
            </div>
          </Card>
        </Col>
        
        <Col span={24}>
          <RoundForm 
            competitionId={round.competition_id} 
            roundId={round.id}
            initialData={round}
            mode="edit"
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Col>
      </Row>
    </div>
  );
};

export default EditRoundPage;
