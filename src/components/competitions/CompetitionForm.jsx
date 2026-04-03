// frontend/src/components/competitions/CompetitionForm.jsx
import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Select, Button, Card, Row, Col, 
  InputNumber, DatePicker, message, Modal, 
  Tabs, Tag, Space, Alert, Divider, Image, Spin,
  Table, Tooltip, Upload, Avatar
} from 'antd';
import { 
  SaveOutlined, PlusOutlined, TeamOutlined,
  TrophyOutlined, ArrowLeftOutlined, LoadingOutlined,
  DeleteOutlined, EditOutlined, EyeOutlined,
  UserAddOutlined, UserDeleteOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import './CompetitionForm.css';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const CompetitionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [existingTeams, setExistingTeams] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [template, setTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [initialLoad, setInitialLoad] = useState(true);
  const [addingTeams, setAddingTeams] = useState(false);
  const [competitionStatus, setCompetitionStatus] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [competitionLogo, setCompetitionLogo] = useState(null);
  const isEditing = !!id;
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getLogoSrc = (logoUrl) => {
    if (!logoUrl) return undefined;
    return logoUrl.startsWith('http') ? logoUrl : `${apiBaseUrl}${logoUrl}`;
  };

  useEffect(() => {
    fetchTeams();
    if (isEditing) {
      fetchCompetition();
    } else {
      setInitialLoad(false);
    }
  }, [id]);

  useEffect(() => {
    // Filtrar equipos disponibles 
    if (teams.length > 0 && existingTeams.length > 0) {
      const existingTeamIds = existingTeams.map(team => team.id);
      const available = teams.filter(team => !existingTeamIds.includes(team.id));
      setAvailableTeams(available);
    } else if (teams.length > 0) {
      setAvailableTeams(teams);
    }
  }, [teams, existingTeams]);
  
 // ============================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================

  const fetchCompetitionTeams = async (compId) => {
    try {
      setLoading(true);
      console.log(`ðŸ”„ Cargando equipos para competencia ${compId}...`);
      
      // Usar el metodo especi­fico para esta competencia
      const response = await competitionService.getCompetitionTeams(compId);
      
      console.log(`âœ… ${response.data.length} equipos cargados:`, 
        response.data.map(t => t.name));
      
      setTeams(response.data || []);
      
    } catch (error) {
      console.error('Error cargando equipos de la competencia:', error);
      
      // Intento de fallback
      await fetchAllTeamsAndFilter(compId);
      
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetition = async () => {
    setLoading(true);
    try {
      const response = await competitionService.getCompetition(id);
      const comp = response.data;
      setCompetitionStatus(comp.status || 'draft');
      setCompetitionLogo(comp.logo_url || null);
      
      // Formatear fechas para el RangePicker
      let dates = undefined;
      if (comp.start_date && comp.end_date) {
        dates = [dayjs(comp.start_date), dayjs(comp.end_date)];
      }
      
      form.setFieldsValue({
        ...comp,
        dates: dates,
      });
      
      // Configurar equipos existentes
      if (comp.teams && comp.teams.length > 0) {
        setExistingTeams(comp.teams);
      }
      
      setInitialLoad(false);
    } catch (error) {
      console.error('Error al cargar competencia:', error);
      message.error('Error al cargar los datos de la competencia');
      navigate('/competitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await competitionService.getTeams({ is_active: true });
      setTeams(response.data || []);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      message.error('Error al cargar la lista de equipos');
    }
  };

  const handleAddTeams = async () => {
    console.log('ðŸ“¤ Enviando al backend:', { team_ids: selectedTeams });

    if (!selectedTeams.length) {
      message.warning('No hay equipos válidos para agregar');
      return;
    }

    setAddingTeams(true);
    try {
      console.log('ðŸ”„ Llamando a competitionService.addTeamsToCompetition...');
      
      const response = await competitionService.addTeamsToCompetition(id, selectedTeams);
      
      console.log('âœ… competitionService response:', response);
      console.log('âœ… response.data:', response.data);
      
      message.success(`${selectedTeams.length} equipo(s) agregados exitosamente`);
      
      // ðŸŽ¯ SOLUCION 1: Obtener los equipos agregados del response
      const addedTeams = teams.filter(team => selectedTeams.includes(team.id));
      console.log('ðŸŽ¯ Equipos encontrados localmente:', addedTeams);
      
      // Actualizar existingTeams AGREGANDO los nuevos
      setExistingTeams(prev => {
        const newTeams = [...prev, ...addedTeams];
        console.log('ðŸŽ¯ existingTeams actualizado:', newTeams.length, 'equipos');
        return newTeams;
      });
      
      // ðŸŽ¯ SOLUCION 2: Tambien limpiar availableTeams
      setAvailableTeams(prev => 
        prev.filter(team => !selectedTeams.includes(team.id))
      );
      
      // Limpiar selección
      setSelectedTeams([]);
      
      // ðŸŽ¯ SOLUCION 3: Forzar recarga de datos del servidor
      console.log('ðŸ”„ Recargando datos del servidor...');
      await fetchCompetition();
      
    } catch (error) {
      console.error('âŒ Error:', error);
      message.error(error.message || 'Error al agregar equipos');
    } finally {
      setAddingTeams(false);
    }
  };

  const handleRemoveTeam = async (teamId) => {
    Modal.confirm({
      title: 'Eliminar equipo de la competencia',
      content: 'El equipo ya no participar? en esta competencia.',
      okText: 'S?, remover',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await competitionService.removeTeamFromCompetition(id, teamId);
          message.success('Equipo removido exitosamente');
          await fetchCompetition();
        } catch (error) {
          message.error(error.response?.data?.detail || 'Error al remover equipo');
        }
      },
    });
  };

  const handleTemplateChange = async (templateName) => {
    try {
      const totalTeams = form.getFieldValue('total_teams') || 20;
      const response = await competitionService.getCompetitionTemplates(
        templateName, 
        totalTeams
      );
      setTemplate(response.data);
      
      if (response.data) {
        const fieldsToUpdate = {};
        
        if (response.data.competition_type) {
          fieldsToUpdate.competition_type = response.data.competition_type;
        }
        
        if (response.data.competition_format) {
          fieldsToUpdate.competition_format = response.data.competition_format;
        }
        
        if (response.data.total_teams) {
          fieldsToUpdate.total_teams = response.data.total_teams;
        }
        
        if (response.data.groups) {
          fieldsToUpdate.groups = response.data.groups;
        }
        
        if (response.data.teams_per_group) {
          fieldsToUpdate.teams_per_group = response.data.teams_per_group;
        }
        
        if (response.data.teams_to_qualify) {
          fieldsToUpdate.teams_to_qualify = response.data.teams_to_qualify;
        }
        
        if (response.data.config) {
          fieldsToUpdate.config = response.data.config;
        }
        
        form.setFieldsValue(fieldsToUpdate);
      }
      
      message.success(`Plantilla "${templateName}" aplicada`);
    } catch (error) {
      console.error('Error al cargar plantilla:', error);
      message.error('Error al cargar la plantilla seleccionada');
    }
  };

  const handleLogoUpload = async ({ file, onSuccess, onError }) => {
    if (!id) {
      message.warning('Guarda la competencia antes de subir el logo');
      return;
    }
    setLogoUploading(true);
    try {
      const response = await competitionService.uploadCompetitionLogo(id, file);
      setCompetitionLogo(response.data?.logo_url || null);
      message.success('Logo de competencia actualizado');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error subiendo logo:', error);
      message.error(error.response?.data?.detail || 'Error al subir el logo');
      if (onError) onError(error);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const competitionData = {
        ...values,
        start_date: values.dates?.[0]?.toISOString(),
        end_date: values.dates?.[1]?.toISOString(),
      };
      delete competitionData.dates;

      if (isEditing) {
        await competitionService.updateCompetition(id, competitionData);
        message.success('âœ… Competencia actualizada exitosamente');
      } else {
        // En creación, incluir equipos seleccionados
        competitionData.team_ids = selectedTeams;
        await competitionService.createCompetition(competitionData);
        message.success('âœ… Competencia creada exitosamente');
      }
      
      setTimeout(() => {
        navigate('/competitions');
      }, 1500);
      
    } catch (error) {
      console.error('Error al guardar competencia:', error);
      const errorMsg = error.response?.data?.detail || 
                      `Error al ${isEditing ? 'actualizar' : 'crear'} la competencia`;
      message.error(`âŒ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const competitionTypes = [
    { value: 'league', label: 'Liga (Todos contra todos)' },
    { value: 'cup', label: 'PTSa (Eliminatoria directa)' },
    { value: 'league_cup', label: 'Liga + PTSa' },
    { value: 'groups_playoff', label: 'Grupos + Playoff' },
  ];

  const competitionFormats = [
    { value: 'single_round', label: 'Una vuelta' },
    { value: 'double_round', label: 'Ida y vuelta' },
    { value: 'home_away', label: 'Partido único con sede' },
  ];

  const templates = [
    { value: 'liga_20_equipos', label: 'Liga Profesional (20 equipos)' },
    { value: 'PTSa_32_equipos', label: 'PTSa Nacional (32 equipos)' },
    { value: 'liga_cup', label: 'Liga + Playoff (Personalizable)' },
  ];

  const teamColumns = [
    {
      title: 'Logo',
      dataIndex: 'logo_url',
      key: 'logo',
      width: 60,
      render: (logo) => logo ? (
        <Image
          src={logo}
          alt="logo"
          width={30}
          height={30}
          preview={false}
          style={{ borderRadius: '50%' }}
        />
      ) : (
        <TeamOutlined style={{ fontSize: 20, color: '#999' }} />
      ),
    },
    {
      title: 'Equipo',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.country && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.city && `${record.city}, `}{record.country}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Estadio',
      dataIndex: 'stadium',
      key: 'stadium',
      render: (stadium) => stadium || 'No especificado',
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver equipo">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/teams/${record.id}`)}
              size="small"
            />
          </Tooltip>
          {competitionStatus === 'draft' && (
            <Tooltip title="Eliminar de competencia">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveTeam(record.id)}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (initialLoad) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <p style={{ marginTop: 16 }}>Cargando datos de la competencia...</p>
      </div>
    );
  }

  return (
    <div className="competition-form-page" style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/competitions')}
        style={{ marginBottom: '16px', padding: 0 }}
      >
        Volver a competencias
      </Button>

      <Card
        title={
          <Space>
            <TrophyOutlined />
            <span>{isEditing ? 'Editar Competencia' : 'Nueva Competencia'}</span>
            {isEditing && (
              <Tag color="blue">ID: {id}</Tag>
            )}
          </Space>
        }
        loading={loading}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
        >
          {/* Pestaña 1: Información Básica */}
          <TabPane tab="Información Básica" key="basic">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                competition_type: 'league',
                competition_format: 'double_round',
                total_teams: 20,
                groups: 0,
                teams_per_group: 0,
                teams_to_qualify: 0,
                promotion_spots: 0,
                relegation_spots: 0,
                international_spots: 0,
                config: {},
              }}
            >
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={12}>
                  <Card size="small" style={{ borderStyle: 'dashed' }}>
                    <Space align="center">
                      <Avatar
                        size={64}
                        src={getLogoSrc(competitionLogo)}
                        icon={<TrophyOutlined />}
                        style={{ backgroundColor: '#f0f5ff', color: '#1890ff' }}
                      />
                      <Space direction="vertical" size={4}>
                        <div className="competition-form-label" style={{ fontWeight: 600 }}>
                          Logo de la competencia
                        </div>
                        <Upload
                          accept="image/*"
                          showUploadList={false}
                          customRequest={handleLogoUpload}
                          disabled={!isEditing}
                        >
                          <Button loading={logoUploading} disabled={!isEditing}>
                            {isEditing ? 'Subir logo' : 'Guarda la competencia primero'}
                          </Button>
                        </Upload>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          JPG/PNG/GIF/WebP. Recomendado 512x512.
                        </span>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              </Row>
              {/* ... (mantÃ©n todo el contenido del formulario bÃ¡sico igual que antes) */}
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label="Nombre de la Competencia"
                    rules={[
                      { required: true, message: 'Por favor ingresa el nombre' },
                      { min: 3, message: 'MÃ­nimo 3 caracteres' }
                    ]}
                  >
                    <Input 
                      placeholder="Ej: Liga Betplay 2026-1" 
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="season"
                    label="Temporada"
                    rules={[
                      { required: true, message: 'Por favor ingresa la temporada' }
                    ]}
                  >
                    <Input 
                      placeholder="Ej: 2026, 2026-2027" 
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="country"
                    label="Paí­s"
                  >
                    <Input 
                      placeholder="Ej: Colombia" 
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="dates"
                    label="Fechas de la Competencia"
                  >
                    <RangePicker 
                      style={{ width: '100%' }}
                      size="large"
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Descripción"
                  >
                    <TextArea 
                      placeholder="Describe la competencia..."
                      rows={3}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="competition_type"
                    label="Tipo de Competencia"
                    rules={[{ required: true }]}
                  >
                    <Select className="competition-form-select competition-form-select-dark" size="large" placeholder="Selecciona el tipo">
                      {competitionTypes.map(type => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="competition_format"
                    label="Formato"
                    rules={[{ required: true }]}
                  >
                    <Select className="competition-form-select competition-form-select-dark" size="large" placeholder="Selecciona el formato">
                      {competitionFormats.map(format => (
                        <Option key={format.value} value={format.value}>
                          {format.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Divider>Plantillas Predefinidas</Divider>
                  <Select
                    className="competition-form-select competition-form-select-dark"
                    placeholder="Selecciona una plantilla (opcional)"
                    style={{ width: '100%' }}
                    size="large"
                    onChange={handleTemplateChange}
                    allowClear
                  >
                    {templates.map(temp => (
                      <Option key={temp.value} value={temp.value}>
                        {temp.label}
                      </Option>
                    ))}
                  </Select>
                  {template && (
                    <Alert
                      type="info"
                      title={`Plantilla: ${template.name}`}
                      description={template.description}
                      style={{ marginTop: '16px' }}
                    />
                  )}
                </Col>

                <Col xs={24}>
                  <Divider>Estructura</Divider>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="total_teams"
                    label="Total de Equipos"
                    rules={[
                      { required: true, message: 'Campo requerido' },
                      { type: 'number', min: 2, max: 100 }
                    ]}
                  >
                    <InputNumber 
                      min={2} 
                      max={100} 
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="groups"
                    label="Número de Grupos"
                    dependencies={['total_teams']}
                    rules={[
                      { type: 'number', min: 0, max: 50 }
                    ]}
                  >
                    <InputNumber 
                      min={0} 
                      max={50}
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="teams_per_group"
                    label="Equipos por Grupo"
                    dependencies={['total_teams', 'groups']}
                    rules={[
                      { type: 'number', min: 0, max: 100 }
                    ]}
                  >
                    <InputNumber 
                      min={0} 
                      max={100}
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Divider>Clasificación</Divider>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Form.Item
                    name="teams_to_qualify"
                    label="Equipos a Playoff"
                    rules={[{ type: 'number', min: 0 }]}
                  >
                    <InputNumber 
                      min={0} 
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Form.Item
                    name="promotion_spots"
                    label="Ascensos"
                    rules={[{ type: 'number', min: 0 }]}
                  >
                    <InputNumber 
                      min={0} 
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Form.Item
                    name="relegation_spots"
                    label="Descensos"
                    rules={[{ type: 'number', min: 0 }]}
                  >
                    <InputNumber 
                      min={0} 
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Form.Item
                    name="international_spots"
                    label="Cupos Internacionales"
                    rules={[{ type: 'number', min: 0 }]}
                  >
                    <InputNumber 
                      min={0} 
                      style={{ width: '100%' }}
                      size="large"
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
                        size="large"
                        loading={loading}
                        style={{
                          backgroundColor: '#0958d9',
                          borderColor: '#0958d9',
                          color: '#ffffff',
                          fontWeight: 600
                        }}
                      >
                        {isEditing ? 'Actualizar Competencia' : 'Siguiente: Agregar Equipos'}
                      </Button>
                      <Button
                        onClick={() => navigate('/competitions')}
                        size="large"
                        className="btn-outline-primary"
                      >
                        Cancelar
                      </Button>
                      {isEditing && (
                        <Button
                          type="default"
                          onClick={() => setActiveTab('teams')}
                          icon={<TeamOutlined />}
                          size="large"
                          className="btn-outline-primary"
                        >
                          Gestionar Equipos
                        </Button>
                      )}
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </TabPane>

          {/* Pestaña 2: Gestión de Equipos (solo en edición) */}
          {isEditing && (
            <TabPane 
              tab={
                <Space>
                  <TeamOutlined />
                  <span>Equipos</span>
                  {existingTeams.length > 0 && (
                    <Tag color="blue">{existingTeams.length}</Tag>
                  )}
                </Space>
              } 
              key="teams"
            >
              <Card>
                <Alert
                  type="info"
                  title="Gestión de Equipos"
                  description={
                    <div>
                      <p>Esta competencia actualmente tiene <strong>{existingTeams.length}</strong> equipos de <strong>{form.getFieldValue('total_teams') || 0}</strong> posibles.</p>
                      {competitionStatus !== 'draft' && (
                        <p style={{ color: '#faad14' }}>
                          <strong>Nota:</strong> La competencia ya no está¡ en estado "borrador". 
                          Los cambios en los equipos podr­án afectar partidos programados.
                        </p>
                      )}
                    </div>
                  }
                  style={{ marginBottom: '16px' }}
                />

                {/* Sección 1: Equipos existentes */}
                <Divider titlePlacement="left">
                  <TeamOutlined /> Equipos Participantes ({existingTeams.length})
                </Divider>
                
                {existingTeams.length > 0 ? (
                  <Table
                    dataSource={existingTeams}
                    columns={teamColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    style={{ marginBottom: '24px' }}
                  />
                ) : (
                  <Alert
                    type="warning"
                    title="No hay equipos en esta competencia"
                    description="Agrega equipos usando el selector a continuación"
                    showIcon
                    style={{ marginBottom: '24px' }}
                  />
                )}

                {/* Sección 2: Agregar nuevos equipos */}
                <Divider orientation="left">
                  <UserAddOutlined /> Agregar Nuevos Equipos
                </Divider>
                
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Select
                      mode="multiple"
                      placeholder="Busca y selecciona equipos para agregar"
                      value={selectedTeams}
                      onChange={setSelectedTeams}
                      style={{ width: '100%' }}
                      size="large"
                      filterOption={(input, option) => {
                        if (!input) return true;
                        const teamName = option?.label || '';
                        return teamName.toLowerCase().includes(input.toLowerCase());
                      }}
                      maxTagCount={10}
                      optionLabelProp="label"
                      loading={teams.length === 0}
                    >
                      {availableTeams.map(team => (
                        <Option 
                          key={team.id} 
                          value={team.id} 
                          label={team.name}
                        >
                          <Space>
                            {team.logo_url && (
                              <Image
                                src={team.logo_url}
                                alt={team.name}
                                width={20}
                                height={20}
                                preview={false}
                                style={{ objectFit: 'contain' }}
                              />
                            )}
                            <span>{team.name}</span>
                            {team.country && (
                              <small style={{ color: '#999' }}>({team.country})</small>
                            )}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  {selectedTeams.length > 0 && (
                    <Col span={24}>
                      <Alert
                        type="info"
                        title={`${selectedTeams.length} equipo(s) seleccionado(s)`}
                        description={
                          <Row gutter={[8, 8]} style={{ marginTop: '8px' }}>
                            {selectedTeams.map(teamId => {
                              const team = teams.find(t => t.id === teamId);
                              return team ? (
                                <Col key={teamId}>
                                  <Tag 
                                    closable 
                                    onClose={() => setSelectedTeams(prev => prev.filter(id => id !== teamId))}
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '4px 8px'
                                    }}
                                  >
                                    {team.logo_url && (
                                      <img 
                                        src={team.logo_url} 
                                        alt={team.name}
                                        style={{ width: 16, height: 16, borderRadius: '50%' }}
                                      />
                                    )}
                                    {team.name}
                                  </Tag>
                                </Col>
                              ) : null;
                            })}
                          </Row>
                        }
                      />
                    </Col>
                  )}

                  <Col span={24}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={handleAddTeams}
                        loading={addingTeams}
                        disabled={selectedTeams.length === 0}
                        size="large"
                        style={{
                          backgroundColor: '#0958d9',
                          borderColor: '#0958d9',
                          color: '#ffffff',
                          fontWeight: 600
                        }}
                      >
                        Agregar {selectedTeams.length} Equipo(s)
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setSelectedTeams([]);
                          fetchCompetition(); // Refrescar datos
                        }}
                        size="large"
                        className="btn-outline-primary"
                      >
                        Limpiar Selección
                      </Button>
                      
                      <Button
                        onClick={() => setActiveTab('basic')}
                        size="large"
                        className="btn-outline-primary"
                      >
                        Volver a Información Básica
                      </Button>
                    </Space>
                  </Col>
                </Row>

                {/* Información de límites */}
                {existingTeams.length > 0 && (
                  <Alert
                    type={existingTeams.length >= (form.getFieldValue('total_teams') || 0) ? 'warning' : 'info'}
                    title="Lí­mite de equipos"
                    description={
                      <div>
                        <p>Capacidad: {existingTeams.length} / {form.getFieldValue('total_teams') || 0} equipos</p>
                        {existingTeams.length >= (form.getFieldValue('total_teams') || 0) && (
                          <p style={{ color: '#faad14' }}>
                            <strong>Está al Límite alcanzado!</strong> No puedes agregar más equipos a menos que aumentes el "Total de Equipos" en la pestaña de información básica.
                          </p>
                        )}
                      </div>
                    }
                    style={{ marginTop: '24px' }}
                  />
                )}
              </Card>
            </TabPane>
          )}

          {/* Pestaña 3: Selección de Equipos (solo en creación) */}
          {!isEditing && (
            <TabPane 
              tab={
                <Space>
                  <TeamOutlined />
                  <span>Selección de Equipos</span>
                  {selectedTeams.length > 0 && (
                    <Tag color="blue">{selectedTeams.length}</Tag>
                  )}
                </Space>
              } 
              key="teams"
            >
              {/* ... (mantén el contenido de creación de equipos igual que antes) */}
              <Card>
                <Alert
                  type="info"
                  title="Selección de Equipos"
                  description={`Selecciona los ${form.getFieldValue('total_teams') || 0} equipos que participarán en la competencia`}
                  style={{ marginBottom: '16px' }}
                />
                
                <Select
                  mode="multiple"
                  placeholder="Busca y selecciona equipos"
                  value={selectedTeams}
                  onChange={(values) => {
                  const parsedIds = values
                    .map(v => {
                      if (typeof v === 'object' && v !== null) {
                        return Number(v.value);
                      }
                      return Number(v);
                    })
                    .filter(v => Number.isInteger(v));

                  setSelectedTeams(parsedIds);
                }}
                  maxTagCount={10}
                  maxTagTextLength={15}
                  optionLabelProp="label"
                >
                  {teams.map(team => (
                    <Option 
                      key={team.id} 
                      value={team.id} 
                      label={team.name}
                    >
                      <Space>
                        {team.logo_url && (
                          <Image
                            src={team.logo_url}
                            alt={team.name}
                            width={20}
                            height={20}
                            preview={false}
                            style={{ objectFit: 'contain' }}
                          />
                        )}
                        <span>{team.name}</span>
                        {team.country && (
                          <small style={{ color: '#999' }}>({team.country})</small>
                        )}
                      </Space>
                    </Option>
                  ))}
                </Select>

                {selectedTeams.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h4>Equipos seleccionados ({selectedTeams.length})</h4>
                    <Row gutter={[8, 8]}>
                      {selectedTeams.map(teamId => {
                        const team = teams.find(t => t.id === teamId);
                        return team ? (
                          <Col key={teamId}>
                            <Tag 
                              closable 
                              onClose={() => setSelectedTeams(prev => prev.filter(id => id !== teamId))}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px'
                              }}
                            >
                              {team.logo_url && (
                                <img 
                                  src={team.logo_url} 
                                  alt={team.name}
                                  style={{ width: 16, height: 16, borderRadius: '50%' }}
                                />
                              )}
                              {team.name}
                            </Tag>
                          </Col>
                        ) : null;
                      })}
                    </Row>
                  </div>
                )}

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      const totalTeams = form.getFieldValue('total_teams') || 0;
                      if (selectedTeams.length === 0) {
                        message.error('Debes seleccionar al menos un equipo');
                      } else if (selectedTeams.length !== totalTeams) {
                        Modal.confirm({
                          title: 'Confirmar creación',
                          content: `Has seleccionado ${selectedTeams.length} equipos de ${totalTeams} requeridos. ¿Deseas continuar?`,
                          onOk: () => form.submit(),
                        });
                      } else {
                        form.submit();
                      }
                    }}
                    loading={loading}
                    icon={<SaveOutlined />}
                    style={{
                      backgroundColor: '#0958d9',
                      borderColor: '#0958d9',
                      color: '#ffffff',
                      fontWeight: 600
                    }}
                  >
                    Crear Competencia con {selectedTeams.length} equipos
                  </Button>
                  
                  <Button
                    style={{ marginLeft: '12px' }}
                    onClick={() => setActiveTab('basic')}
                    className="btn-outline-primary"
                  >
                    Volver a Información Básica
                  </Button>
                </div>
              </Card>
            </TabPane>
          )}
        </Tabs>
      </Card>
    </div>
  );
};

export default CompetitionForm;

