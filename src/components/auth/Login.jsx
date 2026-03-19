// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Alert,
  Layout,
  Row,
  Col,
  Divider,
  Flex
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import logo from '../../assets/logo.png';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setError('');
    setLoading(true);
    
    const result = await login(values.username, values.password);
    setLoading(false);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      let errorMessage = result.error;
      
      if (errorMessage && typeof errorMessage === 'object') {
        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage.map(e => e.msg || e.detail).join(', ');
        } else if (errorMessage.msg) {
          errorMessage = errorMessage.msg;
        } else if (errorMessage.detail) {
          errorMessage = errorMessage.detail;
        } else {
          errorMessage = JSON.stringify(errorMessage);
        }
      }
      
      setError(errorMessage || 'Credenciales incorrectas');
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <img
        src={logo}
        alt="Watermark top left"
        style={{
          position: 'absolute',
          width: '56vw',
          maxWidth: 820,
          minWidth: 360,
          opacity: 0.07,
          left: '-10vw',
          top: '-12vh',
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'grayscale(100%)',
        }}
      />
      <img
        src={logo}
        alt="Watermark"
        style={{
          position: 'absolute',
          width: '62vw',
          maxWidth: 900,
          minWidth: 420,
          opacity: 0.08,
          right: '-8vw',
          bottom: '-10vh',
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'grayscale(100%)',
        }}
      />
      <Content>
        <Row justify="center" align="middle" style={{ minHeight: '100vh', padding: '20px' }}>
          <Col xs={24} sm={20} md={16} lg={12} xl={8}>
            <Card
              variant={false}
              style={{
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                overflow: 'hidden'
              }}
              styles={{ body: { padding: '40px' } }}
            >
              <Flex vertical gap="large" align="center">
                {/* Logo y título */}
                <Space orientation="vertical" align="center" size="small">
                  <div style={{
                    width: '140px',
                    height: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <img
                      src={logo}
                      alt="Siempre de Local"
                      style={{ width: 128, height: 128, objectFit: 'contain' }}
                    />
                  </div>
                </Space>
                <Divider style={{ margin: '2px 0' }}>
                  <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-600">
                  Iniciar Sesión
                  </h2>
                </Divider>

                {/* Mensaje de error */}
                {error && (
                  <Alert
                    title="Error"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError('')}
                    style={{ width: '100%' }}
                  />
                )}

                {/* Formulario */}
                <Form
                  form={form}
                  name="login"
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  layout="vertical"
                  size="large"
                  style={{ width: '100%' }}
                  requiredMark={false}
                >
                  <Form.Item
                    name="username"
                    label="Usuario"
                    rules={[
                      { required: true, message: 'Por favor ingresa tu usuario' },
                      { min: 3, message: 'El usuario debe tener al menos 3 caracteres' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Ingresa tu usuario"
                      disabled={loading}
                      autoComplete="username"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Contraseña"
                    rules={[
                      { required: true, message: 'Por favor ingresa tu contraseña' },
                      { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Ingresa tu contraseña"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </Form.Item>
                  <div style={{ textAlign: 'right', marginBottom: '12px' }}>
                    <Link to="/forgot-password" style={{ fontSize: '12px' }}>
                      <strong>¿Olvidaste tu contraseña?</strong>
                    </Link>
                  </div>

                  <Form.Item style={{ marginTop: '32px' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<LoginOutlined />}
                      size="large"
                      block
                      style={{
                        height: '48px',
                        fontSize: '16px',
                        fontWeight: '600',
                        backgroundColor: '#3da0fc',
                        borderColor: '#1890ff',
                        boxShadow: '0 2px 0 rgba(5, 145, 255, 0.1)',
                        '&:hover': {
                          backgroundColor: '#40a9ff',
                          borderColor: '#40a9ff',
                        }
                      }}
                    >
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                  </Form.Item>
                </Form>

                {/* Enlace de registro */}
                <Divider style={{ margin: '8px 0' }}>
                  <Text type="secondary">¿No tienes cuenta?</Text>
                </Divider>

                <Paragraph style={{ textAlign: 'center', margin: 0 }}>
                  <Link to="/register">
                    <Button
                      type="default"
                      icon={<UserAddOutlined />}
                      size="large"
                      style={{ width: '200px' }}
                    >
                      Crear una cuenta
                    </Button>
                  </Link>
                </Paragraph>

                {/* Información adicional */}
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <Link to="/help/security" style={{ fontSize: '12px', color: '#2563eb' }}>
                    Políticas de Privacidad y Seguridad
                  </Link>
                  <br />
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    © {new Date().getFullYear()} Chain Reaction Projects S.A.S. Todos los derechos reservados.
                  </Text>
                </div>
              </Flex>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Login;
