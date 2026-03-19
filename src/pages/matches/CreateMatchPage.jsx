// frontend/src/pages/matches/CreateMatchPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Typography, Card, Row, Col, Button, message, 
  Breadcrumb, Steps, Select, Space, Tag, Alert, Modal
} from 'antd';
import { 
  ArrowLeftOutlined, CalendarOutlined, TeamOutlined,
  TrophyOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MatchForm from '../../components/matches/MatchForm';
import competitionService from '../../services/competitionService';

const { Title, Text } = Typography;
const { Option } = Select;

const CreateMatchPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [competitionId, setCompetitionId] = useState(
    params.competitionId || queryParams.get('competition_id') || null
  );
  const [roundNumber, setRoundNumber] = useState(
    params.roundNumber || queryParams.get('round_number') || null
  );
   
  const [competition, setCompetition] = useState(null);
  const [round, setRound] = useState(null);
  const [selectedRoundNumber, setSelectedRoundNumber] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    
    fetchCompetitions();
    if (competitionId) {
      fetchCompetitionDetails();
      fetchRounds();
    }
    if (roundNumber && competitionId) {
      fetchRoundDetailsByNumber();
    }
  }, [competitionId, roundNumber]);

  const fetchCompetitions = async () => {
    try {
      const response = await competitionService.getCompetitions({ limit: 50 });
      setCompetitions(response.data);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    }
  };

  const fetchCompetitionDetails = async (id = competitionId) => {
    if (!id) return;

    try {
      const response = await competitionService.getCompetition(id);
      setCompetition(response.data);
    } catch (error) {
      console.error('Error fetching competition details:', error);
    }
  };

  const fetchRounds = async (id = competitionId) => {
    if (!id) return;

    try {
      const response = await competitionService.getRounds(id, { limit: 50 });
      const orderedRounds = (response.data || [])
        .slice()
        .sort((a, b) => (b.round_number || 0) - (a.round_number || 0));
      setRounds(orderedRounds);
      
      // Si tenemos un roundNumber, buscar el ID correspondiente
      if (roundNumber) {
        const roundObj = orderedRounds.find(r => r.round_number == roundNumber);
        if (roundObj) {
          setSelectedRoundNumber(roundObj.id);
          setRound(roundObj);
        }
      }
    } catch (error) {
      console.error('Error fetching rounds:', error);
    }
  };

  const fetchRoundDetailsByNumber = async () => {
    if (!roundNumber || !competitionId) return;
    
    try {
      // USAR EL NUEVO MÉTODO POR NÚMERO
      setRound({round_number: roundNumber,competition_id: competitionId});
    } catch (error) {
      console.error('Error fetching round details by number:', error);
      // Si falla, intentar buscar en la lista de rounds
      if (rounds.length > 0) {
        const roundObj = rounds.find(r => r.round_number == roundNumber);
        if (roundObj) {
          setRound({round_number: roundNumber,competition_id: competitionId});
        }
      }
    }
  };

  const fetchRoundDetailsById = async (roundId) => {
    if (!roundId || !competitionId) return;
    
    try {
      const response = await competitionService.getRoundById(competitionId, roundId);
      setRound(response.data);
      setRoundNumber(response.data.round_number); // Actualizar el número
    } catch (error) {
      console.error('Error fetching round details by ID:', error);
    }
  };

  const handleCompetitionSelect = (value) => {
    setCompetitionId(value);
    setRoundNumber(null);
    setSelectedRoundNumber(null);
    setRound(null);

    fetchCompetitionDetails(value);
    fetchRounds(value);
  };

  const handleRoundSelect = (roundId) => {
    setSelectedRoundNumber(roundId);
    if (roundId) {
      // Buscar en rounds locales primero
      const roundObj = rounds.find(r => r.id == roundId);
      if (roundObj) {
        setRound(roundObj);
        setRoundNumber(roundObj.round_number);
      } else {
        // Si no está en la lista local, obtener del backend
        fetchRoundDetailsById(roundId);
      }
    } else {
      setRound(null);
      setRoundNumber(null);
    }
  };

  const handleStep1Next = () => {
    if (!competitionId) {
      message.warning('Por favor seleccione una competencia');
      return;
    }
    setCurrentStep(1);
  };

  const handleBack = () => {
    if (currentStep === 0) {
      navigate('/matches');
    } else {
      setCurrentStep(0);
    }
  };

  const handleSuccess = (matchData) => {
    message.success('Partido creado exitosamente!');
    
    Modal.confirm({
      title: 'Partido Creado',
      content: '¿Qué desea hacer a continuación?',
      okText: 'Ver Partido',
      cancelText: 'Crear Otro',
      onOk: () => {
        navigate(`/matches/${matchData.id}`);
      },
      onCancel: () => {
        // Resetear formulario manteniendo competencia si está seleccionada
        if (competitionId) {
          navigate(`/matches/new?competition_id=${competitionId}`);
        } else {
          navigate('/matches/new');
        }
      },
    });
  };

  // Si no es admin, mostrar acceso denegado
  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Title level={4} style={{ color: '#f5222d' }}>
            Acceso Denegado
          </Title>
          <p>Solo los administradores pueden crear partidos.</p>
        </Card>
      </div>
    );
  }

  const steps = [
    {
      title: 'Seleccionar Competencia y Jornada',
      content: (
        <Card>
          <Title level={4}>Paso 1: Seleccione la competencia y jornada</Title>
          <p>Elija dónde se jugará el partido.</p>
          
          <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
            <Col span={24}>
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>
                  <TrophyOutlined /> Competencia
                </Text>
                <Select
                  placeholder="Seleccionar competencia..."
                  style={{ width: '100%' }}
                  size="large"
                  value={competitionId}
                  onChange={handleCompetitionSelect}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {competitions.map(comp => (
                    <Option key={comp.id} value={comp.id}>
                      <Space>
                        <span>{comp.name}</span>
                        <Tag color="blue">{comp.season}</Tag>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            
            {competitionId && (
              <Col span={24}>
                <div style={{ marginTop: 12 }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>
                    <CalendarOutlined /> Jornada. Opcional: Selecciona una jornada para organizar los partidos
                  </Text>
                  <Select
                    placeholder="Seleccionar jornada (opcional)..."
                    style={{ width: '100%' }}
                    size="large"
                    value={selectedRoundNumber}
                    onChange={handleRoundSelect}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {rounds.map(r => (
                      <Option key={r.id} value={r.id}>
                        <Space orientation="vertical" size={0} style={{ width: '100%' }}>
                          <Space>
                            <span>{r.name}</span>
                            <Tag color={r.is_completed ? 'green' : 'orange'}>
                              {r.is_completed ? 'Completada' : 'Activa'}
                            </Tag>
                          </Space>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Jornada {r.round_number} • {r.round_type} • {r.total_matches} partidos
                          </Text>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                  <Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
                    Si no selecciona una jornada, el partido se creará sin asociar a una jornada específica.
                  </Text>
                </div>
              </Col>
            )}
          </Row>
        </Card>
      ),
    },
    {
      title: 'Configurar Partido',
      content: (
        <Card>
          {competitionId ? (
            <MatchForm
              competitionId={competitionId}
              roundId={selectedRoundNumber} 
              onSuccess={handleSuccess}
              onCancel={handleBack}
            />
          ) : (
            <Alert
              title="Seleccione una competencia primero"
              description="Por favor regrese al paso anterior y seleccione una competencia."
              type="warning"
              showIcon
            />
          )}
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb y navegación */}
      <Breadcrumb
        style={{ marginBottom: 12 }}
        items={[
          { title: 'Partidos', onClick: () => navigate('/matches') },
          { title: 'Crear Nuevo Partido' },
        ]}
      />
      
      <Row gutter={[12, 12]}>
        <Col span={24}>
          <Card>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              style={{ marginBottom: 12 }}
            >
              Volver
            </Button>
            <Title level={2}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              Crear Nuevo Partido
            </Title>
            <Text type="secondary">
              Complete los pasos para agregar un nuevo partido al sistema.
            </Text>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card>
            <Steps
              current={currentStep}
              style={{ marginBottom: 16 }}
              items={steps.map(item => ({
                title: item.title
              }))}
            />
            <div style={{ minHeight: '420px' }}>
              {steps[currentStep].content}
            </div>
            
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                {currentStep === 0 ? 'Cancelar' : 'Anterior'}
              </Button>
              
              {currentStep === 0 && (
                <Button 
                  type="primary" 
                  onClick={handleStep1Next}
                  disabled={!competitionId}
                  icon={<CheckCircleOutlined />}
                >
                  Siguiente: Configurar Partido
                </Button>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreateMatchPage;
