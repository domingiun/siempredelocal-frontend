// frontend/src/components/teams/TeamForm.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Form, Input, Select, Space, 
  Row, Col, Switch, Upload, message, Alert, 
  Typography, Tooltip, Divider, Avatar 
} from 'antd';
import { 
  ArrowLeftOutlined, SaveOutlined, UploadOutlined,
  GlobalOutlined, EnvironmentOutlined, 
  TrophyOutlined, TeamOutlined, 
  InfoCircleOutlined, LinkOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import './TeamForm.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TeamForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [countries] = useState([
    'Argentina', 'Brasil', 'Chile', 'Colombia', 'México', 'Uruguay',
    'España', 'Italia', 'Alemania', 'Francia', 'Inglaterra', 'Portugal',
    'Estados Unidos', 'Canadá', 'Perú', 'Ecuador', 'Venezuela', 'Bolivia',
    'Paraguay', 'Costa Rica', 'Panamá', 'Honduras', 'El Salvador', 'Nicaragua',
    'Guatemala', 'República Dominicana', 'Puerto Rico', 'Cuba', 'Haití',
    'Japón', 'Corea del Sur', 'China', 'Australia', 'Nueva Zelanda',
    // Agrega más países según necesites
  ]);

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchTeam(id);
    }
  }, [id]);

  const fetchTeam = async (teamId) => {
    setLoading(true);
    try {
      const response = await competitionService.getTeam(teamId);
      const teamData = response.data;
      
      // Cargar datos en el formulario
      form.setFieldsValue({
        ...teamData,
        is_active: teamData.is_active !== false // default true
      });

      // Cargar preview del logo si existe
      if (teamData.logo_url) {
        setLogoPreview(teamData.logo_url);
      }
    } catch (error) {
      message.error('Error al cargar los datos del equipo');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUrlChange = (e) => {
    const url = e.target.value;
    form.setFieldsValue({ logo_url: url });
    setLogoPreview(url);
  };

  const validateLogoUrl = (_, value) => {
    if (!value) return Promise.resolve();
    
    try {
      const normalizedUrl = normalizeLogoUrl(value);
      new URL(normalizedUrl);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error('Ingrese una URL válida'));
    }
  };

  const normalizeLogoUrl = (url) => {
    if (!url) return null;
    
    // Asegurar que la URL comience con http:// o https://
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    return normalized;
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const formattedValues = {
        ...values,
        logo_url: normalizeLogoUrl(values.logo_url),
        // Asegurar valores numéricos o defaults
        matches_played: values.matches_played || 0,
        matches_won: values.matches_won || 0,
        matches_drawn: values.matches_drawn || 0,
        matches_lost: values.matches_lost || 0,
        goals_for: values.goals_for || 0,
        goals_against: values.goals_against || 0,
        goal_difference: values.goal_difference || 0,
        points: values.points || 0,
      };

      if (isEditMode) {
        await competitionService.updateTeam(id, formattedValues);
        message.success('Equipo actualizado exitosamente');
      } else {
        await competitionService.createTeam(formattedValues);
        message.success('Equipo creado exitosamente');
      }

      // Redirigir a la lista de equipos
      navigate('/teams');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al guardar el equipo';
      message.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/teams');
  };

  const handleLogoError = () => {
    setLogoPreview(null);
  };

  return (
    <div className="team-form-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <Space orientation="vertical" style={{ width: '100%', marginBottom: '24px' }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ padding: 0 }}
        >
          Volver a equipos
        </Button>
        
        <Title level={2}>
          {isEditMode ? 'Editar Equipo' : 'Crear Nuevo Equipo'}
        </Title>
        
        <Text type="secondary">
          {isEditMode 
            ? 'Actualiza la información del equipo' 
            : 'Completa los datos para registrar un nuevo equipo'}
        </Text>
      </Space>

      <Row gutter={[24, 24]}>
        {/* Formulario */}
        <Col xs={24} lg={16}>
          <Card 
            loading={loading}
            title={
              <Space>
                <TeamOutlined />
                <span>Información del Equipo</span>
              </Space>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                is_active: true,
                matches_played: 0,
                matches_won: 0,
                matches_drawn: 0,
                matches_lost: 0,
                goals_for: 0,
                goals_against: 0,
                goal_difference: 0,
                points: 0,
              }}
            >
              {/* Sección: Información Básica */}
              <Divider titlePlacement="left">Información Básica</Divider>
              
              <Row gutter={16}>
                <Col xs={24} md={16}>
                  <Form.Item
                    name="name"
                    label="Nombre del Equipo"
                    rules={[
                      { required: true, message: 'Por favor ingrese el nombre del equipo' },
                      { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
                      { max: 200, message: 'El nombre no puede exceder los 200 caracteres' }
                    ]}
                  >
                    <Input 
                      placeholder="Ej: Club Atlético Boca Juniors" 
                      size="large"
                      prefix={<TeamOutlined />}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} md={8}>
                  <Form.Item
                    name="short_name"
                    label={
                      <Space>
                        <span>Nombre Corto</span>
                        <Tooltip title="Abreviatura o siglas del equipo">
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[
                      { max: 50, message: 'No puede exceder los 50 caracteres' }
                    ]}
                  >
                    <Input 
                      placeholder="Ej: BOCA" 
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Sección: Ubicación */}
                <Divider titlePlacement="left">Ubicación</Divider>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="country"
                      label="País"
                    >
                      <Select
                        showSearch
                        placeholder="Seleccione un país"
                        size="large"
                        suffixIcon={<GlobalOutlined />}
                        allowClear
                        filterOption={(input, option) => {
                          if (!input) return true;
                          
                          // En Ant Design v5, el option.children puede no estar disponible
                          // Usamos option.value como fallback
                          const countryText = option?.children?.toString?.() || 
                                            option?.value?.toString?.() || 
                                            '';
                          
                          // Normalizar texto para manejar acentos y mayúsculas
                          const normalizeText = (text) => {
                            return text
                              .toLowerCase()
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '') // Remover acentos
                              .trim();
                          };
                          
                          const normalizedCountry = normalizeText(countryText);
                          const normalizedInput = normalizeText(input);
                          
                          return normalizedCountry.includes(normalizedInput);
                        }}
                        filterSort={(optionA, optionB) => {
                          const a = optionA?.children?.toString?.() || optionA?.value?.toString?.() || '';
                          const b = optionB?.children?.toString?.() || optionB?.value?.toString?.() || '';
                          return a.localeCompare(b);
                        }}
                      >
                        {countries.map(country => (
                          <Option key={country} value={country}>
                            {country}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="city"
                      label="Ciudad"
                    >
                      <Input 
                        placeholder="Ej: Buenos Aires" 
                        size="large"
                        prefix={<EnvironmentOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="stadium"
                  label="Estadio"
                >
                  <Input 
                    placeholder="Ej: Estadio Alberto J. Armando (La Bombonera)" 
                    size="large"
                  />
                </Form.Item>

              {/* Sección: Logo */}
              <Divider titlePlacement="left">Logo del Equipo</Divider>
              
              <Alert
                title="Logo como URL"
                description="Ingrese la URL completa de la imagen del logo (ej: https://ejemplo.com/logo.png). La imagen debe ser accesible públicamente."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              <Form.Item
                name="logo_url"
                label="URL del Logo"
                rules={[
                  { validator: validateLogoUrl }
                ]}
                extra="Asegúrese de que la URL sea pública y accesible"
              >
                <Input
                  placeholder="https://ejemplo.com/logo.png"
                  size="large"
                  prefix={<LinkOutlined />}
                  onChange={handleLogoUrlChange}
                  allowClear
                />
              </Form.Item>

              {/* Vista previa del logo */}
              {logoPreview && (
                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Vista previa del logo:
                  </Text>
                  <Avatar
                    src={logoPreview}
                    size={120}
                    shape="square"
                    style={{ border: '1px solid #d9d9d9', borderRadius: '8px' }}
                    onError={handleLogoError}
                  />
                  {logoPreview.startsWith('http') && (
                    <div style={{ marginTop: '8px' }}>
                      <Button
                        type="link"
                        size="small"
                        href={logoPreview}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver imagen original
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Sección: Información Adicional */}
              <Divider titlePlacement="left">Información Adicional</Divider>
              
              <Form.Item
                name="website"
                label="Sitio Web"
                rules={[
                  { validator: validateLogoUrl }
                ]}
              >
                <Input 
                  placeholder="https://www.equipo.com" 
                  size="large"
                  prefix={<GlobalOutlined />}
                />
              </Form.Item>

              {/* Sección: Estadísticas Iniciales (Opcional) */}
              <Divider titlePlacement="left">
                <Space>
                  <TrophyOutlined />
                  <span>Estadísticas Iniciales (Opcional)</span>
                </Space>
              </Divider>
              
              <Alert
                title="Información"
                description="Estos valores pueden dejarse en 0 y se actualizarán automáticamente cuando el equipo participe en competencias."
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Form.Item
                    name="matches_played"
                    label="Partidos"
                  >
                    <Input 
                      type="number" 
                      min="0"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={12} md={6}>
                  <Form.Item
                    name="points"
                    label="Puntos"
                  >
                    <Input 
                      type="number" 
                      min="0"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={12} md={6}>
                  <Form.Item
                    name="goals_for"
                    label="GF"
                  >
                    <Input 
                      type="number" 
                      min="0"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={12} md={6}>
                  <Form.Item
                    name="goals_against"
                    label="GC"
                  >
                    <Input 
                      type="number" 
                      min="0"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Estado del equipo */}
              {isEditMode && (
                <>
                  <Divider titlePlacement="left">Estado</Divider>
                  
                  <Form.Item
                    name="is_active"
                    label="Activo"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren="Activo" 
                      unCheckedChildren="Inactivo"
                    />
                  </Form.Item>
                </>
              )}

              {/* Botones de acción */}
              <Divider />
              
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    icon={<SaveOutlined />}
                    size="large"
                    style={{
                      backgroundColor: '#0958d9',
                      borderColor: '#0958d9',
                      color: '#ffffff',
                      fontWeight: 600
                    }}
                  >
                    {isEditMode ? 'Actualizar Equipo' : 'Crear Equipo'}
                  </Button>
                  
                  <Button
                    onClick={handleBack}
                    size="large"
                  >
                    Cancelar
                  </Button>
                  
                  {isEditMode && (
                    <Button
                      type="link"
                      danger
                      onClick={() => {
                        Modal.confirm({
                          title: '¿Eliminar equipo?',
                          content: 'Esta acción desactivará el equipo. ¿Desea continuar?',
                          okText: 'Eliminar',
                          okType: 'danger',
                          cancelText: 'Cancelar',
                          onOk: async () => {
                            try {
                              await competitionService.deleteTeam(id);
                              message.success('Equipo eliminado exitosamente');
                              navigate('/teams');
                            } catch (error) {
                              message.error('Error al eliminar el equipo');
                            }
                          },
                        });
                      }}
                    >
                      Eliminar Equipo
                    </Button>
                  )}
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Panel lateral: Información y ayuda */}
        <Col xs={24} lg={8}>
          <Card title="Información">
            <Space orientation="vertical" size="middle">
              <Alert
                title="Recomendaciones"
                description={
                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                    <li>Use nombres completos y oficiales del equipo</li>
                    <li>El país ayuda en filtros y estadísticas</li>
                    <li>Las estadísticas se pueden actualizar después</li>
                    <li>El logo debe ser una URL pública</li>
                  </ul>
                }
                type="info"
                showIcon
              />

              <div>
                <Text strong>Logo recomendado:</Text>
                <ul style={{ margin: 0, paddingLeft: '16px', marginTop: '8px' }}>
                  <li>Formato: PNG, JPG, SVG</li>
                  <li>Fondo transparente preferiblemente</li>
                  <li>Resolución mínima: 200x200px</li>
                  <li>URL pública accesible</li>
                </ul>
              </div>

              <div>
                <Text strong>Servicios para logos:</Text>
                <ul style={{ margin: 0, paddingLeft: '16px', marginTop: '8px' }}>
                  <li>
                    <a href="https://imgur.com" target="_blank" rel="noopener noreferrer">
                      Imgur
                    </a>
                  </li>
                  <li>
                    <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer">
                      Cloudinary
                    </a>
                  </li>
                  <li>
                    <a href="https://postimages.org" target="_blank" rel="noopener noreferrer">
                      PostImage
                    </a>
                  </li>
                </ul>
              </div>

              {isEditMode && (
                <Alert
                  title="Nota"
                  description="Al desactivar un equipo, este ya no aparecerá disponible para nuevas competencias."
                  type="warning"
                  showIcon
                />
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeamForm;
