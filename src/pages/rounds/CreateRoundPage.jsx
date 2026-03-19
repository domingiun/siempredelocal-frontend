// frontend/src/pages/rounds/CreateRoundPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Typography, Card, Row, Col, Steps, Button, message, 
  Form, Input, Select, DatePicker, InputNumber, Radio, 
  Space, Tag, Alert, Spin, Divider, Modal
} from 'antd';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import { 
  TrophyOutlined, CalendarOutlined, TeamOutlined,
  CheckCircleOutlined, InfoCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import './CreateRoundPage.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateRoundPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [competitionId, setCompetitionId] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [roundData, setRoundData] = useState({});

  // Si no es admin, redirigir - MOVER ESTO AL FINAL DEL COMPONENTE
  useEffect(() => {
    if (user?.role !== 'admin') {
      message.error('Solo los administradores pueden crear jornadas');
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCompetitions();
    }
  }, [user]);

  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const response = await competitionService.getCompetitions({ limit: 50 });
      // Filtrar solo competencias activas
      const activeCompetitions = response.data.filter(comp => 
        comp.status !== 'archived' && comp.status !== 'cancelled'
      );
      setCompetitions(activeCompetitions);
    } catch (error) {
      message.error('Error al cargar competencias');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitionDetails = async (id) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await competitionService.getCompetition(id);
      setCompetition(response.data);
      
      // Autocompletar algunos campos basados en la competencia
      if (response.data) {
        const comp = response.data;
        
        // Sugerir número de jornada basado en las existentes
        const roundsRes = await competitionService.getRounds(id, { limit: 50 });
        const existingRounds = roundsRes.data || [];
        const nextRoundNumber = existingRounds.length > 0 
          ? Math.max(...existingRounds.map(r => r.round_number)) + 1 
          : 1;
        
        form.setFieldsValue({
          round_number: nextRoundNumber,
          round_type: comp.format === 'league' ? 'regular' : 'group_stage',
          phase: comp.format === 'tournament' ? 'group_stage' : 'regular_season'
        });
      }
    } catch (error) {
      console.error('Error cargando detalles de competencia:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompetitionSelect = (value) => {
    setCompetitionId(value);
    const selectedComp = competitions.find(c => c.id === value);
    setCompetition(selectedComp);
    fetchCompetitionDetails(value);
  };

  const handleStep1Next = () => {
    if (!competitionId) {
      message.warning('Por favor seleccione una competencia');
      return;
    }
    setCurrentStep(1);
  };

  const handleStep2Next = async () => {
    try {
      const values = await form.validateFields();
      setRoundData(values);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error de validación:', error);
      message.error('Por favor complete todos los campos requeridos');
    }
  };

  const handleCreateRound = async () => {
    setLoading(true);
    try {
      const finalData = {
        ...roundData,
        competition_id: competitionId
      };
      
      await competitionService.createRound(competitionId, finalData);
      
      message.success('Jornada creada exitosamente!');
      
      // Redirigir según preferencia del usuario
      Modal.confirm({
        title: 'Jornada Creada',
        content: '¿Qué desea hacer a continuación?',
        okText: 'Ver Jornada',
        cancelText: 'Crear Otra',
        onOk: () => {
          navigate(`/competitions/${competitionId}/rounds`);
        },
        onCancel: () => {
          // Resetear formulario para crear otra
          setCompetitionId(null);
          setCompetition(null);
          setCurrentStep(0);
          form.resetFields();
          setRoundData({});
          fetchCompetitions();
        },
      });
      
    } catch (error) {
      console.error('Error creando jornada:', error);
      message.error(error.response?.data?.detail || 'Error al crear jornada');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      navigate('/rounds/management');
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    {
      title: 'Seleccionar Competencia',
      content: (
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
              <p>Cargando competencias...</p>
            </div>
          ) : (
            <>
              <Title level={4}>Paso 1: Seleccione una competencia</Title>
              <p>Elija la competencia donde desea crear la nueva jornada.</p>
              
              <div style={{ margin: '20px 0' }}>
                <Select
                  placeholder="Buscar competencia..."
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
                        <TrophyOutlined />
                        <span>{comp.name}</span>
                        <Tag color="blue">{comp.season}</Tag>
                        <Tag color={comp.status === 'active' ? 'green' : 'orange'}>
                          {comp.status}
                        </Tag>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
              
              {competition && (
                <Alert
                  title="Información de la competencia seleccionada"
                  description={
                    <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                      <Row gutter={[16, 8]}>
                        <Col span={12}>
                          <Text strong>Nombre:</Text>
                          <div>{competition.name}</div>
                        </Col>
                        <Col span={12}>
                          <Text strong>Temporada:</Text>
                          <div>{competition.season}</div>
                        </Col>
                      </Row>
                      <Row gutter={[16, 8]}>
                        <Col span={12}>
                          <Text strong>Formato:</Text>
                          <div>{competition.format}</div>
                        </Col>
                        <Col span={12}>
                          <Text strong>Tipo:</Text>
                          <div>{competition.competition_type}</div>
                        </Col>
                      </Row>
                      <Row gutter={[16, 8]}>
                        <Col span={12}>
                          <Text strong>Estado:</Text>
                          <Tag color={competition.status === 'active' ? 'green' : 'orange'}>
                            {competition.status}
                          </Tag>
                        </Col>
                        <Col span={12}>
                          <Text strong>Equipos:</Text>
                          <div>{competition.total_teams || 0} equipos</div>
                        </Col>
                      </Row>
                    </Space>
                  }
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  style={{ marginTop: 16 }}
                />
              )}
            </>
          )}
        </Card>
      ),
    },
    {
      title: 'Configurar Jornada',
      content: (
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
              <p>Cargando información...</p>
            </div>
          ) : (
            <>
              <Title level={4}>Paso 2: Configure la jornada</Title>
              <p>Complete los detalles de la nueva jornada.</p>
              
              {competition && (
                <Alert
                  title={`Creando jornada para: ${competition.name}`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              
              <Form
                form={form}
                layout="vertical"
                onFinish={handleStep2Next}
                initialValues={{
                  round_type: 'regular',
                  phase: 'regular_season',
                  generate_matches: false
                }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Form.Item
                      name="name"
                      label="Nombre de la jornada"
                      rules={[
                        { required: true, message: 'Ingrese el nombre de la jornada' },
                        { min: 3, message: 'Mínimo 3 caracteres' }
                      ]}
                    >
                      <Input 
                        placeholder="Ej: Fecha 1, Cuartos de Final, Semifinal, etc." 
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item
                      name="round_number"
                      label="Número de jornada"
                      rules={[
                        { required: true, message: 'Ingrese el número de jornada' },
                        { type: 'number', min: 1, message: 'Debe ser mayor a 0' }
                      ]}
                    >
                      <InputNumber 
                        min={1} 
                        max={100}
                        style={{ width: '100%' }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item
                      name="round_type"
                      label="Tipo de jornada"
                      rules={[{ required: true, message: 'Seleccione el tipo' }]}
                    >
                      <Select size="large">
                        <Option value="regular">Regular</Option>
                        <Option value="group_stage">Fase de Grupos</Option>
                        <Option value="round_of">Ronda de Eliminación</Option>
                        <Option value="quarterfinal">Cuartos de Final</Option>
                        <Option value="semifinal">Semifinal</Option>
                        <Option value="final">Final</Option>
                        <Option value="third_place">Tercer Lugar</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item
                      name="phase"
                      label="Fase"
                    >
                      <Select size="large">
                        <Option value="regular_season">Temporada Regular</Option>
                        <Option value="group_stage">Fase de Grupos</Option>
                        <Option value="playoff">Playoff</Option>
                        <Option value="knockout">Eliminatoria</Option>
                        <Option value="quarterfinals">Cuartos de Final</Option>
                        <Option value="semifinals">Semifinales</Option>
                        <Option value="final">Final</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item
                      name="group_letter"
                      label="Grupo (letra)"
                    >
                      <Select 
                        placeholder="Opcional"
                        size="large"
                        allowClear
                      >
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => (
                          <Option key={letter} value={letter}>Grupo {letter}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item
                      name="start_date"
                      label="Fecha de inicio"
                    >
                      <DatePicker 
                        showTime 
                        format="YYYY-MM-DD HH:mm"
                        style={{ width: '100%' }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item
                      name="end_date"
                      label="Fecha de fin"
                    >
                      <DatePicker 
                        showTime 
                        format="YYYY-MM-DD HH:mm"
                        style={{ width: '100%' }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item
                      name="phase_round"
                      label="Número de ronda en fase"
                    >
                      <InputNumber 
                        min={1} 
                        placeholder="Ej: 1 para primera ronda de fase"
                        style={{ width: '100%' }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col span={24}>
                    <Divider>Opciones adicionales</Divider>
                  </Col>
                  
                  <Col span={24}>
                   <Form.Item
                      name="generate_matches"
                      label="Generar partidos automáticamente"
                    >
                      <Radio.Group>
                        <Radio value={true}>Sí, generar partidos automáticamente</Radio>
                        <Radio value={false}>No, crear solo la jornada vacía</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  
                  <Col span={24}>
                    <Form.Item
                      name="description"
                      label="Descripción adicional (opcional)"
                    >
                      <TextArea 
                        rows={3}
                        placeholder="Información adicional sobre esta jornada..."
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Button type="primary" htmlType="submit" style={{ display: 'none' }}>
                  Siguiente
                </Button>
              </Form>
            </>
          )}
        </Card>
      ),
    },
    {
      title: 'Confirmar y Crear',
      content: (
        <Card>
          <Title level={4}>Paso 3: Confirme los datos</Title>
          <p>Revise la información antes de crear la jornada.</p>
          
          {competition && (
            <Alert
              title={`Jornada para: ${competition.name} - ${competition.season}`}
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
          
          {Object.keys(roundData).length > 0 ? (
            <div style={{ background: '#fafafa', padding: 20, borderRadius: 8 }}>
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text strong>Nombre:</Text>
                    <div>{roundData.name}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Número de jornada:</Text>
                    <div>{roundData.round_number}</div>
                  </Col>
                </Row>
                
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text strong>Tipo:</Text>
                    <Tag color="blue">{roundData.round_type}</Tag>
                  </Col>
                  <Col span={12}>
                    <Text strong>Fase:</Text>
                    <div>{roundData.phase || 'No especificado'}</div>
                  </Col>
                </Row>
                
                {roundData.group_letter && (
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <Text strong>Grupo:</Text>
                      <Tag color="green">Grupo {roundData.group_letter}</Tag>
                    </Col>
                  </Row>
                )}
                
                {(roundData.start_date || roundData.end_date) && (
                  <>
                    <Divider>Fechas</Divider>
                    <Row gutter={[16, 8]}>
                      {roundData.start_date && (
                        <Col span={12}>
                          <Text strong>Inicio:</Text>
                          <div>{new Date(roundData.start_date).toLocaleString()}</div>
                        </Col>
                      )}
                      {roundData.end_date && (
                        <Col span={12}>
                          <Text strong>Fin:</Text>
                          <div>{new Date(roundData.end_date).toLocaleString()}</div>
                        </Col>
                      )}
                    </Row>
                  </>
                )}
                
                {roundData.description && (
                  <>
                    <Divider>Descripción</Divider>
                    <div style={{ background: 'white', padding: 12, borderRadius: 4 }}>
                      {roundData.description}
                    </div>
                  </>
                )}
                
                <Alert
                  title="Configuración de partidos"
                  description={
                    roundData.generate_matches 
                      ? "Se generarán partidos automáticamente basados en la configuración de la competencia."
                      : "La jornada se creará sin partidos. Deberá agregarlos manualmente."
                  }
                  type={roundData.generate_matches ? "success" : "warning"}
                  showIcon
                />
              </Space>
            </div>
          ) : (
            <Alert
              title="No hay datos para revisar"
              description="Por favor complete los datos en el paso anterior."
              type="warning"
              showIcon
            />
          )}
        </Card>
      ),
    },
  ];

  // Si no es admin, mostrar mensaje de carga o redirigir
  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Verificando permisos...</p>
      </div>
    );
  }

  return (
    <div className="create-round" style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Button 
              type="link" 
              onClick={handleBack}
              style={{ marginBottom: 16, padding: 0 }}
            >
              ← Volver
            </Button>
            <Title level={2}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              Crear Nueva Jornada
            </Title>
            <Text type="secondary">
              Complete los pasos para agregar una nueva jornada al sistema.
            </Text>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card>
            <Steps 
              current={currentStep} 
              style={{ marginBottom: 32 }}
              items={steps.map((step, index) => ({
                title: step.title,
                icon: currentStep === index ? <CalendarOutlined /> : null
              }))}
            />
            
            <div style={{ minHeight: '400px' }}>
              {steps[currentStep].content}
            </div>
            
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                onClick={handleBack}
                disabled={loading}
              >
                {currentStep === 0 ? 'Cancelar' : 'Anterior'}
              </Button>
              
              <div>
                {currentStep === 0 && (
                  <Button 
                    type="primary" 
                    onClick={handleStep1Next}
                    disabled={!competitionId || loading}
                    icon={<CheckCircleOutlined />}
                  >
                    Siguiente: Configurar Jornada
                  </Button>
                )}
                
                {currentStep === 1 && (
                  <Button 
                    type="primary" 
                    onClick={handleStep2Next}
                    disabled={loading}
                    icon={<CheckCircleOutlined />}
                  >
                    Siguiente: Revisar y Confirmar
                  </Button>
                )}
                
                {currentStep === 2 && (
                  <Button 
                    type="primary" 
                    onClick={handleCreateRound}
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                  >
                    Crear Jornada
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreateRoundPage;
