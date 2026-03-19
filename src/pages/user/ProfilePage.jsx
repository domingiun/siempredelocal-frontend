// frontend/src/pages/user/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, message,
  Typography, Divider, Avatar, Space, Upload,
  Row, Col, Tabs, Alert, Tag
} from 'antd';
import {
  UserOutlined, MailOutlined, LockOutlined,
  SaveOutlined, LoadingOutlined, PhoneOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getAvatarSrc = (avatarUrl) => {
    if (!avatarUrl) return undefined;
    return avatarUrl.startsWith('http') ? avatarUrl : `${apiBaseUrl}${avatarUrl}`;
  };

  // Cargar datos del usuario en el formulario
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        full_name: user.full_name || '',
        phone: user.phone || ''
      });
    }
  }, [user, form]);

  // Manejar actualización del perfil
  const handleSaveProfile = async (values) => {
    setLoading(true);
    try {
      // Usar el endpoint para actualizar el usuario actual
      const response = await api.put(`/users/${user.id}`, values);
      
      // Actualizar contexto de autenticación
      updateUser(response.data);
      
      message.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      message.error(error.response?.data?.detail || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de contraseña
  const handleChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      await api.post(`/users/${user.id}/change-password`, {
        current_password: values.current_password,
        new_password: values.new_password
      });
      
      message.success('Contraseña cambiada exitosamente');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      message.error(error.response?.data?.detail || 'Error al cambiar contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async ({ file, onSuccess, onError }) => {
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/profile/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(response.data);
      message.success('Avatar actualizado');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error subiendo avatar:', error);
      message.error(error.response?.data?.detail || 'Error al subir avatar');
      if (onError) onError(error);
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <LoadingOutlined style={{ fontSize: 48 }} spin />
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card>
            <Space orientation="vertical" align="center" style={{ width: '100%' }}>
              <Avatar
                size={120}
                src={getAvatarSrc(user.avatar_url)}
                icon={!user.avatar_url ? <UserOutlined /> : undefined}
                style={{ 
                  backgroundColor: user.role === 'admin' ? '#722ed1' : '#1890ff',
                  marginBottom: 16,
                  fontSize: '48px'
                }}
              />

              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={handleAvatarUpload}
              >
                <Button loading={avatarUploading}>
                  Cambiar foto
                </Button>
              </Upload>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                JPG/PNG/GIF/WebP. Recomendado 400x400.
              </Text>
              
              <Title level={4} style={{ margin: 0 }}>
                {user.full_name || user.username}
              </Title>
              
              {/* AQUÍ ESTABA EL ERROR: Faltaba importar Tag */}
              <Tag color={user.role === 'admin' ? 'purple' : 'blue'}>
                {user.role === 'admin' ? 'Administrador' : 'Usuario'}
              </Tag>
              
              <Divider style={{ margin: '16px 0' }} />
              
              <Space orientation="vertical" size="small">
                <Text type="secondary">
                  <MailOutlined style={{ marginRight: 8 }} />
                  {user.email}
                </Text>
                <Text type="secondary">
                  <UserOutlined style={{ marginRight: 8 }} />
                  @{user.username}
                </Text>
                {user.phone && (
                  <Text type="secondary">
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    {user.phone}
                  </Text>
                )}
                <Text type="secondary">
                  Miembro desde: {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane 
                tab={
                  <span>
                    <UserOutlined />
                    Información Personal
                  </span>
                } 
                key="profile"
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveProfile}
                  style={{ marginTop: 16 }}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        name="username"
                        label="Nombre de Usuario"
                        rules={[
                          { required: true, message: 'Ingrese su username' },
                          { min: 3, message: 'Mínimo 3 caracteres' }
                        ]}
                      >
                        <Input prefix={<UserOutlined />} />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                          { required: true, message: 'Ingrese su email' },
                          { type: 'email', message: 'Email inválido' }
                        ]}
                      >
                        <Input prefix={<MailOutlined />} />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        name="full_name"
                        label="Nombre Completo"
                      >
                        <Input placeholder="Opcional" />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        name="phone"
                        label="Celular"
                        rules={[
                          { required: true, message: 'Ingrese su celular' },
                          { min: 7, message: 'MÃ­nimo 7 caracteres' }
                        ]}
                      >
                        <Input prefix={<PhoneOutlined />} />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        name="password"
                        label="Nueva Contraseña"
                        help="Dejar en blanco para no cambiar"
                      >
                        <Input.Password 
                          prefix={<LockOutlined />} 
                          placeholder="••••••" 
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={24}>
                      <Alert
                        title="Importante"
                        description="Al actualizar tu email o username, deberás usar las nuevas credenciales para iniciar sesión."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    </Col>
                    
                    <Col span={24}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        htmlType="submit"
                        loading={loading}
                        style={{
                          backgroundColor: '#0958d9',
                          borderColor: '#0958d9',
                          color: '#ffffff',
                          fontWeight: 600
                        }}
                      >
                        Guardar Cambios
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </TabPane>
              
              <TabPane 
                tab={
                  <span>
                    <LockOutlined />
                    Seguridad
                  </span>
                } 
                key="security"
              >
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handleChangePassword}
                  style={{ marginTop: 16 }}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        name="current_password"
                        label="Contraseña Actual"
                        rules={[{ required: true, message: 'Ingrese su contraseña actual' }]}
                      >
                        <Input.Password 
                          prefix={<LockOutlined />} 
                          placeholder="••••••" 
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        name="new_password"
                        label="Nueva Contraseña"
                        rules={[
                          { required: true, message: 'Ingrese nueva contraseña' },
                          { min: 6, message: 'Mínimo 6 caracteres' }
                        ]}
                      >
                        <Input.Password 
                          prefix={<LockOutlined />} 
                          placeholder="••••••" 
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        name="confirm_password"
                        label="Confirmar Contraseña"
                        dependencies={['new_password']}
                        rules={[
                          { required: true, message: 'Confirme la contraseña' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue('new_password') === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error('Las contraseñas no coinciden'));
                            },
                          }),
                        ]}
                      >
                        <Input.Password 
                          prefix={<LockOutlined />} 
                          placeholder="••••••" 
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={24}>
                      <Alert
                        title="Recomendación de seguridad"
                        description="Usa una contraseña fuerte con al menos 8 caracteres, mayúsculas, minúsculas y números."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    </Col>
                    
                    <Col span={24}>
                      <Button
                        type="primary"
                        icon={<LockOutlined />}
                        htmlType="submit"
                        loading={passwordLoading}
                        style={{
                          backgroundColor: '#0958d9',
                          borderColor: '#0958d9',
                          color: '#ffffff',
                          fontWeight: 600
                        }}
                      >
                        Cambiar Contraseña
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
