// frontend/src/pages/admin/AdminSystemPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Switch, Select, Button, message,
  Typography, Divider, Alert, Space, Row, Col, Tabs,
  InputNumber, Tag, Upload, Radio, TimePicker, DatePicker,
  Avatar, Statistic, Progress, Modal, Tooltip, Spin
} from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  FileTextOutlined,
  SyncOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  BarChartOutlined,
  HddOutlined,
  LoadingOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CloudUploadOutlined,
  MailOutlined,
  EyeOutlined,
  DownloadOutlined,
  CodeOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './AdminSystemPage.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const AdminSystemPage = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [configForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState({});
  const [systemStats, setSystemStats] = useState({});
  const [systemInfo, setSystemInfo] = useState({});
  const [backups, setBackups] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [backupLoading, setBackupLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSystemData();
    }
  }, [user]);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      // Obtener configuración del sistema
      const configResponse = await api.get('/admin/system/config');
      const { config, system_info } = configResponse.data;
      setSystemConfig(config);
      setSystemInfo(system_info);
      
      // Obtener estadísticas
      const statsResponse = await api.get('/admin/system/stats');
      setSystemStats(statsResponse.data);
      
      // Obtener backups
      const backupsResponse = await api.get('/admin/system/backups');
      setBackups(backupsResponse.data);
      
      // Establecer valores iniciales en formulario
      form.setFieldsValue(config);
      configForm.setFieldsValue(config);
      
    } catch (error) {
      console.error('Error cargando datos del sistema:', error);
      message.error('Error al cargar datos del sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (values) => {
    setLoading(true);
    try {
      // Enviar cambios al backend
      await api.put('/admin/system/config', values);
      
      // Actualizar datos locales
      setSystemConfig(values);
      message.success('Configuración guardada exitosamente');
      
      // Recargar datos para obtener info actualizada
      fetchSystemData();
    } catch (error) {
      console.error('Error guardando configuración:', error);
      message.error(error.response?.data?.detail || 'Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    Modal.confirm({
      title: '¿Crear backup del sistema?',
      content: 'Se creará una PTSia de seguridad completa de la base de datos y archivos.',
      okText: 'Crear Backup',
      cancelText: 'Cancelar',
      onOk: async () => {
        setBackupLoading(true);
        try {
          const response = await api.post('/admin/system/backup');
          message.success(response.data.message);
          
          // Esperar un momento y actualizar lista de backups
          setTimeout(() => {
            fetchBackups();
          }, 2000);
          
        } catch (error) {
          console.error('Error creando backup:', error);
          message.error('Error al crear backup');
        } finally {
          setBackupLoading(false);
        }
      },
    });
  };

  const fetchBackups = async () => {
    try {
      const response = await api.get('/admin/system/backups');
      setBackups(response.data);
    } catch (error) {
      console.error('Error cargando backups:', error);
    }
  };

  const handleDownloadBackup = (backupFile) => {
    Modal.info({
      title: 'Descargar Backup',
      content: `Para descargar el backup, accede al servidor y busca el archivo: ${backupFile}`,
      okText: 'Entendido',
    });
  };

  const handleClearCache = async () => {
    Modal.confirm({
      title: '¿Limpiar caché del sistema?',
      content: 'Se limpiará la caché del sistema. Esto puede mejorar el rendimiento.',
      okText: 'Limpiar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.post('/admin/system/cache/clear');
          message.success('Caché limpiada exitosamente');
        } catch (error) {
          message.error('Error limpiando caché');
        }
      },
    });
  };

  const handleSystemRestart = async () => {
    Modal.confirm({
      title: '¿Reiniciar servicios del sistema?',
      content: 'Los servicios se reiniciarán brevemente.',
      okText: 'Reiniciar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.post('/admin/system/restart');
          message.success('Servicios reiniciados exitosamente');
        } catch (error) {
          message.error('Error reiniciando servicios');
        }
      },
    });
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await api.get('/admin/system/logs?lines=50');
      setLogs(response.data);
    } catch (error) {
      console.error('Error cargando logs:', error);
      message.error('Error al cargar logs del sistema');
    } finally {
      setLogsLoading(false);
    }
  };

  // Cargar logs cuando se seleccione la pestaña
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          title="Acceso Restringido"
          description="Solo los administradores pueden acceder a esta sección."
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (loading && activeTab === 'general') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <p style={{ marginTop: 16 }}>Cargando configuración del sistema...</p>
      </div>
    );
  }

  return (
    <div className="admin-system-page" style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Title level={2}>
                <SettingOutlined style={{ marginRight: 8 }} />
                Panel de Administración del Sistema
              </Title>
              <Text type="secondary">
                Versión {systemConfig.version || '1.0.0'} • Entorno: {systemConfig.environment || 'development'}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* Estadísticas rápidas con datos reales */}
        {systemStats.database && (
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic
                    title="Usuarios"
                    value={systemStats.database.active_users || 0}
                    suffix={`/ ${systemStats.database.total_users || 0}`}
                    prefix={<DashboardOutlined />}
                    styles={{ content: { color: '#52c41a' } }}
                  />
                  <Text type="secondary">Activos / Total</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic
                    title="Competencias"
                    value={systemStats.database.active_competitions || 0}
                    suffix={`/ ${systemStats.database.total_competitions || 0}`}
                    prefix={<SettingOutlined />}
                    styles={{ content: { color: '#722ed1' } }}
                  />
                  <Text type="secondary">Activas / Total</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic
                    title="Partidos"
                    value={systemStats.database.total_matches || 0}
                    prefix={<ClockCircleOutlined />}
                    styles={{ content: { color: '#fa8c16' } }}
                  />
                  <Text type="secondary">Totales</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic
                    title="Equipos"
                    value={systemStats.database.total_teams || 0}
                    prefix={<BarChartOutlined />}
                    styles={{ content: { color: '#1890ff' } }}
                  />
                  <Text type="secondary">Registrados</Text>
                </Card>
              </Col>
            </Row>
          </Col>
        )}

        {/* Estado del sistema */}
        {systemStats.system && (
          <Col span={24}>
            <Card title="Estado del Sistema" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card size="small" type="inner">
                    <Space orientation="vertical">
                      <Text><CloudServerOutlined /> CPU</Text>
                      <Progress 
                        percent={systemStats.system.cpu_percent} 
                        status={systemStats.system.cpu_percent > 80 ? "exception" : "normal"}
                      />
                      <Text type="secondary">{systemStats.system.cpu_percent}% utilizado</Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" type="inner">
                    <Space orientation="vertical">
                      <Text><DatabaseOutlined /> Memoria</Text>
                      <Progress 
                        percent={systemStats.system.memory_percent} 
                        status={systemStats.system.memory_percent > 80 ? "exception" : "normal"}
                      />
                      <Text type="secondary">
                        {systemStats.system.memory_used_gb}GB / {systemStats.system.memory_total_gb}GB
                      </Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" type="inner">
                    <Space orientation="vertical">
                      <Text><HddOutlined /> Disco</Text>
                      <Progress 
                        percent={systemStats.storage?.disk_percent || 0} 
                        status={(systemStats.storage?.disk_percent || 0) > 80 ? "exception" : "normal"}
                      />
                      <Text type="secondary">
                        {systemStats.storage?.disk_used_gb || 0}GB / {systemStats.storage?.disk_total_gb || 0}GB
                      </Text>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        )}

        {/* Tabs principales */}
        <Col span={24}>
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              {/* Configuración General */}
              <TabPane
                tab={
                  <span>
                    <SettingOutlined />
                    Configuración
                  </span>
                }
                key="general"
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveSettings}
                  initialValues={systemConfig}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        name="app_name"
                        label="Nombre de la Aplicación"
                        rules={[{ required: true, message: 'Ingrese el nombre de la aplicación' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        name="environment"
                        label="Entorno"
                        rules={[{ required: true, message: 'Seleccione el entorno' }]}
                      >
                        <Select>
                          <Option value="development">Desarrollo</Option>
                          <Option value="staging">Staging</Option>
                          <Option value="production">Producción</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        name="timezone"
                        label="Zona Horaria"
                        rules={[{ required: true, message: 'Seleccione la zona horaria' }]}
                      >
                        <Select showSearch>
                          <Option value="America/Bogota">Bogotá (UTC-5)</Option>
                          <Option value="America/Mexico_City">Ciudad de México (UTC-6)</Option>
                          <Option value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</Option>
                          <Option value="Europe/Madrid">Madrid (UTC+1)</Option>
                          <Option value="UTC">UTC</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        name="language"
                        label="Idioma"
                        rules={[{ required: true, message: 'Seleccione el idioma' }]}
                      >
                        <Select>
                          <Option value="es">Español</Option>
                          <Option value="en">English</Option>
                          <Option value="pt">Português</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    
                    <Col span={24}>
                      <Divider>Modos del Sistema</Divider>
                    </Col>
                    
                    <Col span={8}>
                      <Form.Item
                        name="debug_mode"
                        label="Modo Debug"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      <Text type="secondary">Activar solo en desarrollo</Text>
                    </Col>
                    
                    <Col span={8}>
                      <Form.Item
                        name="maintenance_mode"
                        label="Modo Mantenimiento"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      <Text type="secondary">Bloquear acceso a usuarios</Text>
                    </Col>
                    
                    <Col span={8}>
                      <Form.Item
                        name="log_access"
                        label="Registrar Logs"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      <Text type="secondary">Registrar accesos al sistema</Text>
                    </Col>
                    
                    <Col span={24}>
                      <Divider>Seguridad</Divider>
                    </Col>
                    
                    <Col span={8}>
                      <Form.Item
                        name="session_timeout"
                        label="Tiempo de Sesión (min)"
                        rules={[{ required: true, message: 'Ingrese tiempo de sesión' }]}
                      >
                        <InputNumber
                          min={1}
                          max={1440}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={8}>
                      <Form.Item
                        name="max_login_attempts"
                        label="Intentos de Login"
                        rules={[{ required: true, message: 'Ingrese intentos máximos' }]}
                      >
                        <InputNumber
                          min={1}
                          max={10}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={8}>
                      <Form.Item
                        name="force_https"
                        label="Forzar HTTPS"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    
                    <Col span={24}>
                      <Divider />
                      <Space>
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          htmlType="submit"
                          loading={loading}
                        >
                          Guardar Configuración
                        </Button>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => form.resetFields()}
                        >
                          Restaurar Valores
                        </Button>
                        <Button
                          icon={<InfoCircleOutlined />}
                          onClick={fetchSystemData}
                        >
                          Recargar Datos
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Form>
              </TabPane>

              {/* Archivos y Medios */}
              <TabPane
                tab={
                  <span>
                    <CloudUploadOutlined />
                    Archivos
                  </span>
                }
                key="files"
              >
                <Form
                  form={configForm}
                  layout="vertical"
                  onFinish={handleSaveSettings}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        label="Tamaño Máximo de Archivo (MB)"
                        name="max_file_size"
                        rules={[{ required: true, message: 'Ingrese tamaño máximo' }]}
                      >
                        <InputNumber
                          min={1}
                          max={100}
                          style={{ width: '100%' }}
                          addonAfter="MB"
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        label="Extensiones Permitidas"
                        name="allowed_extensions"
                        rules={[{ required: true, message: 'Seleccione extensiones' }]}
                      >
                        <Select mode="tags" placeholder="jpg, png, pdf...">
                          <Option value="jpg">JPG</Option>
                          <Option value="png">PNG</Option>
                          <Option value="jpeg">JPEG</Option>
                          <Option value="gif">GIF</Option>
                          <Option value="pdf">PDF</Option>
                          <Option value="doc">DOC</Option>
                          <Option value="docx">DOCX</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    
                    {systemStats.storage && (
                      <Col span={24}>
                        <Card title="Uso de Almacenamiento" size="small">
                          <Space orientation="vertical" style={{ width: '100%' }}>
                            <Progress
                              percent={systemStats.storage.disk_percent}
                              status={systemStats.storage.disk_percent > 80 ? "exception" : "normal"}
                              strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                              }}
                            />
                            <Row gutter={16}>
                              <Col span={8}>
                                <Text>Total: {systemStats.storage.disk_total_gb} GB</Text>
                              </Col>
                              <Col span={8}>
                                <Text>Usado: {systemStats.storage.disk_used_gb} GB</Text>
                              </Col>
                              <Col span={8}>
                                <Text>Libre: {systemStats.storage.disk_free_gb} GB</Text>
                              </Col>
                            </Row>
                            <Text type="secondary">
                              Archivos en uploads: {systemStats.storage.total_files} archivos ({systemStats.storage.total_size_mb} MB)
                            </Text>
                          </Space>
                        </Card>
                      </Col>
                    )}
                    
                    <Col span={24}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        htmlType="submit"
                        loading={loading}
                      >
                        Guardar Configuración de Archivos
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </TabPane>

              {/* Email y Notificaciones */}
              <TabPane
                tab={
                  <span>
                    <MailOutlined />
                    Email
                  </span>
                }
                key="email"
              >
                <Form
                  form={configForm}
                  layout="vertical"
                  onFinish={handleSaveSettings}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Form.Item
                        name="email_enabled"
                        label="Habilitar Email"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        label="SMTP Server"
                        name="smtp_server"
                      >
                        <Input placeholder="smtp.gmail.com" />
                      </Form.Item>
                    </Col>
                    
                    <Col span={6}>
                      <Form.Item
                        label="Puerto"
                        name="smtp_port"
                      >
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    
                    <Col span={6}>
                      <Form.Item
                        label="SSL/TLS"
                        name="smtp_ssl"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        label="Usuario SMTP"
                        name="smtp_username"
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        label="Contraseña SMTP"
                        name="smtp_password"
                      >
                        <Input.Password />
                      </Form.Item>
                    </Col>
                    
                    <Col span={24}>
                      <Form.Item
                        label="Email Remitente"
                        name="email_from"
                      >
                        <Input placeholder="noreply@siempredelocal.com" />
                      </Form.Item>
                    </Col>
                    
                    <Col span={24}>
                      <Form.Item
                        label="Plantilla de Email"
                        name="email_template"
                      >
                        <TextArea
                          rows={8}
                          placeholder="<html><body><h1>Notificación</h1><p>{{message}}</p></body></html>"
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={24}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        htmlType="submit"
                        loading={loading}
                      >
                        Guardar Configuración de Email
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </TabPane>

              {/* Backup y Mantenimiento */}
              <TabPane
                tab={
                  <span>
                    <DatabaseOutlined />
                    Backup
                  </span>
                }
                key="backup"
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Alert
                      title="Gestión de Backup"
                      description="Crea y gestiona PTSias de seguridad del sistema."
                      type="info"
                      showIcon
                    />
                  </Col>
                  
                  <Col span={12}>
                    <Card title="Crear Backup" size="small">
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <Text>Crear una PTSia de seguridad completa del sistema</Text>
                        <Button
                          type="primary"
                          icon={<CloudUploadOutlined />}
                          onClick={handleCreateBackup}
                          loading={backupLoading}
                          block
                        >
                          Crear Backup Ahora
                        </Button>
                        <Text type="secondary">
                          El backup incluye: base de datos, configuración y archivos uploads
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                  
                  <Col span={12}>
                    <Card title="Frecuencia de Backup" size="small">
                      <Form
                        form={configForm}
                        layout="vertical"
                        onFinish={handleSaveSettings}
                      >
                        <Form.Item 
                          label="Frecuencia"
                          name="backup_frequency"
                        >
                          <Select>
                            <Option value="disabled">Deshabilitado</Option>
                            <Option value="daily">Diario</Option>
                            <Option value="weekly">Semanal</Option>
                            <Option value="monthly">Mensual</Option>
                          </Select>
                        </Form.Item>
                        <Button 
                          type="dashed" 
                          block
                          htmlType="submit"
                          loading={loading}
                        >
                          Guardar Frecuencia
                        </Button>
                      </Form>
                    </Card>
                  </Col>
                  
                  <Col span={24}>
                    <Card title="Backups Disponibles" size="small">
                      {backups.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {backups.map(item => (
                            <Card key={item.file} size="small">
                              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <Avatar
                                  style={{ backgroundColor: '#52c41a' }}
                                  icon={<DatabaseOutlined />}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>{`Backup ${item.timestamp}`}</Text>
                                    <Space>
                                      <Tooltip title="Ver informaci??n">
                                        <Button 
                                          type="text" 
                                          icon={<EyeOutlined />}
                                          onClick={() => {
                                            Modal.info({
                                              title: 'Informaci??n del Backup',
                                              width: 600,
                                              content: (
                                                <div>
                                                  <p><strong>Archivo:</strong> {item.file}</p>
                                                  <p><strong>Tama??o:</strong> {formatBytes(item.size)}</p>
                                                  <p><strong>Creado por:</strong> {item.created_by}</p>
                                                  <p><strong>Fecha:</strong> {formatDate(item.timestamp)}</p>
                                                </div>
                                              ),
                                            });
                                          }}
                                        />
                                      </Tooltip>
                                      <Tooltip title="Descargar">
                                        <Button 
                                          type="text" 
                                          icon={<DownloadOutlined />}
                                          onClick={() => handleDownloadBackup(item.file)}
                                        />
                                      </Tooltip>
                                    </Space>
                                  </div>
                                  <Space orientation="vertical" size="small">
                                    <Text>Tama??o: {formatBytes(item.size)}</Text>
                                    <Text>Fecha: {formatDate(item.timestamp)}</Text>
                                  </Space>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>

                      ) : (
                        <Alert
                          title="No hay backups disponibles"
                          description="Crea tu primer backup usando el botón 'Crear Backup Ahora'"
                          type="info"
                          showIcon
                        />
                      )}
                    </Card>
                  </Col>
                  
                  <Col span={24}>
                    <Divider />
                    <Space>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={handleClearCache}
                      >
                        Limpiar Caché
                      </Button>
                      <Button
                        danger
                        icon={<SettingOutlined />}
                        onClick={handleSystemRestart}
                      >
                        Reiniciar Servicios
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </TabPane>

              {/* Logs del Sistema */}
              <TabPane
                tab={
                  <span>
                    <FileTextOutlined />
                    Logs
                  </span>
                }
                key="logs"
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card
                      title="Logs del Sistema"
                      extra={
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={fetchLogs}
                          loading={logsLoading}
                        >
                          Recargar
                        </Button>
                      }
                    >
                      {logsLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                          <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
                          <p>Cargando logs...</p>
                        </div>
                      ) : logs.logs && logs.logs.length > 0 ? (
                        <div style={{ 
                          backgroundColor: '#1e1e1e', 
                          color: '#d4d4d4',
                          padding: '16px',
                          borderRadius: '4px',
                          maxHeight: '500px',
                          overflowY: 'auto',
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }}>
                          {logs.logs.map((log, index) => (
                            <div key={index} style={{ marginBottom: '4px', whiteSpace: 'pre-wrap' }}>
                              {log}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert
                          title="No hay logs disponibles"
                          description="Los logs del sistema aparecerán aquí"
                          type="info"
                          showIcon
                        />
                      )}
                      
                      {logs.total_lines && (
                        <Text type="secondary" style={{ display: 'block', marginTop: '16px' }}>
                          Mostrando {logs.showing_last} de {logs.total_lines} líneas
                        </Text>
                      )}
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              {/* Información del Sistema */}
              <TabPane
                tab={
                  <span>
                    <InfoCircleOutlined />
                    Información
                  </span>
                }
                key="info"
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="Información del Sistema" size="small">
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Card size="small" type="inner">
                            <Statistic
                              title="Versión"
                              value={systemConfig.version || '1.0.0'}
                              prefix={<CodeOutlined />}
                            />
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card size="small" type="inner">
                            <Statistic
                              title="Entorno"
                              value={systemConfig.environment || 'development'}
                              prefix={<GlobalOutlined />}
                            />
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card size="small" type="inner">
                            <Statistic
                              title="Tiempo del Sistema"
                              value={systemInfo.system_time ? formatDate(systemInfo.system_time) : 'N/A'}
                              prefix={<ClockCircleOutlined />}
                            />
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card size="small" type="inner">
                            <Statistic
                              title="Uptime"
                              value={systemStats.system?.uptime_days || 0}
                              suffix="días"
                              prefix={<CloudServerOutlined />}
                            />
                          </Card>
                        </Col>
                      </Row>
                      
                      <Divider />
                      
                      <Title level={5}>Información Técnica</Title>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          `Python: ${systemInfo.python_version || 'N/A'}`,
                          `Plataforma: ${systemInfo.platform || 'N/A'}`,
                          `CPU: ${systemInfo.cpu_percent || 0}%`,
                          `Memoria: ${systemInfo.memory_percent || 0}%`,
                          `Disco: ${systemInfo.disk_usage || 0}%`,
                        ].map((item, index) => (
                          <div key={index} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                            {item}
                          </div>
                        ))}
                      </div>

                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminSystemPage;

