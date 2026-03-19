import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Select, Button, Card, Row, Col, 
  DatePicker, InputNumber, Space, message, Typography 
} from 'antd';
import { 
  CalendarOutlined, SaveOutlined, ArrowLeftOutlined 
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RoundForm = ({
  isEdit = false,
  roundId = null,
  competitionId: competitionIdProp = null,
  initialData = null,
  mode = null,
  onSuccess = null,
  onCancel = null,
}) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { competitionId: competitionIdParam } = useParams();
  const effectiveCompetitionId = competitionIdProp || competitionIdParam;
  const editMode = mode === 'edit' || isEdit === true;
  const [loading, setLoading] = useState(false);
  const [competition, setCompetition] = useState(null);
  const [existingRounds, setExistingRounds] = useState([]);

  useEffect(() => {
    if (!effectiveCompetitionId) {
      return;
    }
    fetchCompetition();
    fetchExistingRounds();
    
    if (editMode && roundId && !initialData) {
      fetchRoundData();
    }
    if (editMode && initialData) {
      setFormFromData(initialData);
    }
  }, [effectiveCompetitionId, editMode, roundId, initialData]);

  const fetchCompetition = async () => {
    if (!effectiveCompetitionId) return;
    try {
      const response = await competitionService.getCompetition(effectiveCompetitionId);
      setCompetition(response.data);
    } catch (error) {
      message.error('Error al cargar la competencia');
    }
  };

  const fetchExistingRounds = async () => {
    if (!effectiveCompetitionId) return;
    try {
      const response = await competitionService.getRounds(effectiveCompetitionId, { limit: 100 });
      setExistingRounds(response.data || []);
    } catch (error) {
      console.error('Error al cargar jornadas existentes');
    }
  };

  const setFormFromData = (round) => {
    form.setFieldsValue({
      name: round.name,
      round_number: round.round_number,
      round_type: round.round_type,
      phase: round.phase,
      group_letter: round.group_letter,
      start_date: round.start_date ? dayjs(round.start_date) : null,
      end_date: round.end_date ? dayjs(round.end_date) : null,
      description: round.description || '',
      generate_matches: round.generate_matches ?? false,
    });
  };

  const fetchRoundData = async () => {
    try {
      setLoading(true);
      const response = await competitionService.getRound(effectiveCompetitionId, roundId);
      const round = response.data;
      setFormFromData(round);
    } catch (error) {
      message.error('Error al cargar datos de la jornada');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (!effectiveCompetitionId) {
        message.error('No se pudo identificar la competencia de la jornada');
        return;
      }
      const roundData = {
        ...values,
        start_date: values.start_date ? values.start_date.toISOString() : null,
        end_date: values.end_date ? values.end_date.toISOString() : null,
        competition_id: parseInt(effectiveCompetitionId),
      };

      if (editMode) {
        const response = await competitionService.updateRound(effectiveCompetitionId, roundId, roundData);
        message.success('Jornada actualizada exitosamente');
        if (onSuccess) {
          onSuccess(response?.data || roundData);
          return;
        }
      } else {
        const response = await competitionService.createRound(effectiveCompetitionId, roundData);
        message.success('Jornada creada exitosamente');
        if (onSuccess) {
          onSuccess(response?.data || roundData);
          return;
        }
      }

      // Redirigir a la lista de jornadas de la competencia
      navigate(`/competitions/${effectiveCompetitionId}/rounds`);
    } catch (error) {
      message.error(error.response?.data?.detail || 'Error al guardar la jornada');
    } finally {
      setLoading(false);
    }
  };

  const getNextRoundNumber = () => {
    if (existingRounds.length === 0) return 1;
    const maxNumber = Math.max(...existingRounds.map(r => r.round_number));
    return maxNumber + 1;
  };

  const roundTypeOptions = [
    { value: 'regular', label: 'Regular' },
    { value: 'group_stage', label: 'Fase de Grupos' },
    { value: 'round_of', label: 'Ronda Eliminatoria' },
    { value: 'semifinal', label: 'Semifinal' },
    { value: 'final', label: 'Final' },
    { value: 'third_place', label: 'Tercer Lugar' },
  ];

  const phaseOptions = [
    { value: 'regular_season', label: 'Temporada Regular' },
    { value: 'group_stage', label: 'Fase de Grupos' },
    { value: 'playoff', label: 'Playoff' },
    { value: 'knockout', label: 'Eliminación Directa' },
  ];

  const groupLetterOptions = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>
              {editMode ? 'Editar Jornada' : 'Nueva Jornada'} - {competition?.name}
            </span>
          </Space>
        }
        
        loading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            round_number: editMode ? undefined : getNextRoundNumber(),
            round_type: 'regular',
            phase: 'regular_season',
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Nombre de la Jornada"
                rules={[
                  { required: true, message: 'Por favor ingrese el nombre de la jornada' },
                  { min: 3, message: 'El nombre debe tener al menos 3 caracteres' }
                ]}
              >
                <Input 
                  placeholder="Ej: Jornada 1, Cuartos de Final, Semifinal, etc." 
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                name="round_number"
                label="Número de Jornada"
                rules={[
                  { required: true, message: 'Por favor ingrese el número de jornada' },
                  { type: 'number', min: 1, message: 'El número debe ser positivo' }
                ]}
              >
                <InputNumber 
                  min={1} 
                  max={100}
                  style={{ width: '100%' }}
                  disabled={editMode}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item
                name="round_type"
                label="Tipo de Jornada"
                rules={[{ required: true, message: 'Por favor seleccione el tipo' }]}
              >
                <Select placeholder="Seleccionar tipo">
                  {roundTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="phase"
                label="Fase"
              >
                <Select placeholder="Seleccionar fase">
                  {phaseOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="group_letter"
                label="Grupo (opcional)"
              >
                <Select 
                  placeholder="Seleccionar grupo"
                  allowClear
                >
                  {groupLetterOptions.map(letter => (
                    <Option key={letter} value={letter}>
                      Grupo {letter}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="generate_matches"
                label="Generar Partidos"
                valuePropName="checked"
              >
                <Select>
                  <Option value={false}>No generar automáticamente</Option>
                  <Option value={true}>Generar partidos automáticamente</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="start_date"
                label="Fecha de Inicio"
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm A"
                  style={{ width: '100%' }}
                  placeholder="Seleccionar fecha y hora de inicio"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="end_date"
                label="Fecha de Fin"
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm A"
                  style={{ width: '100%' }}
                  placeholder="Seleccionar fecha y hora de fin"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="description"
                label="Descripción (opcional)"
              >
                <TextArea 
                  rows={3}
                  placeholder="Ingrese una descripción para esta jornada..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<SaveOutlined />}
                    loading={loading}
                    size="large"
                    style={{
                      backgroundColor: '#0958d9',
                      borderColor: '#0958d9',
                      color: '#ffffff',
                      fontWeight: 600
                    }}
                  >
                    {editMode ? 'Actualizar Jornada' : 'Crear Jornada'}
                  </Button>
                  <Button 
                    onClick={() => (onCancel ? onCancel() : navigate(`/competitions/${effectiveCompetitionId}/rounds`))}
                    size="large"
                    className="btn-outline-primary"
                  >
                    Cancelar
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default RoundForm;
