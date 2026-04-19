// frontend/src/components/auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Form, Input, Button, Alert, Row, Col } from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined,
  PhoneOutlined, UserAddOutlined, LoginOutlined, HomeOutlined
} from '@ant-design/icons';
import logo from '../../assets/logo.png';
import './Auth.css';

const Register = () => {
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { register } = useAuth();
  const navigate     = useNavigate();

  const onFinish = async (values) => {
    setError('');
    setLoading(true);

    const result = await register({
      email:     values.email,
      username:  values.username,
      full_name: values.full_name || '',
      phone:     values.phone,
      password:  values.password,
    });

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      let msg = result.error;
      if (msg && typeof msg === 'object') {
        msg = Array.isArray(msg)
          ? msg.map(e => e.msg || e.detail).join(', ')
          : msg.detail || msg.msg || JSON.stringify(msg);
      }
      setError(msg || 'Error en el registro. Intenta de nuevo.');
    }
  };

  return (
    <div className="auth auth--register">
      <div className="auth__bg" />

      <Link to="/" className="auth__home-link">
        <HomeOutlined /> Inicio
      </Link>

      <div className="auth__card auth__card--wide">
        {/* Logo */}
        <div className="auth__logo-wrap">
          <img src={logo} alt="Siempre de Local" className="auth__logo" />
        </div>

        <div className="auth__header">
          <h1 className="auth__title">Crea tu cuenta</h1>
          <p className="auth__subtitle">Únete y empieza a pronosticar</p>
        </div>

        {error && (
          <Alert
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
            className="auth__alert"
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          size="large"
          requiredMark={false}
          className="auth__form"
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Correo electrónico"
                rules={[
                  { required: true, message: 'Ingresa tu correo' },
                  { type: 'email', message: 'Correo inválido' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="correo@ejemplo.com" autoComplete="email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="username"
                label="Nombre de usuario"
                rules={[
                  { required: true, message: 'Ingresa un usuario' },
                  { min: 3, message: 'Mínimo 3 caracteres' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="tu_usuario" autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="full_name" label="Nombre completo">
                <Input prefix={<UserOutlined />} placeholder="Opcional" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Celular"
                rules={[{ required: true, message: 'Ingresa tu celular' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="+57 300 123 4567" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="password"
                label="Contraseña"
                rules={[
                  { required: true, message: 'Ingresa una contraseña' },
                  { min: 8, message: 'Mínimo 8 caracteres' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (!/\d/.test(value)) return Promise.reject('Debe incluir al menos un número');
                      if (!/[a-zA-Z]/.test(value)) return Promise.reject('Debe incluir al menos una letra');
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Mínimo 8 caracteres (letras y números)" autoComplete="new-password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="confirmPassword"
                label="Confirmar contraseña"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Confirma tu contraseña' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject('Las contraseñas no coinciden');
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Repite tu contraseña" autoComplete="new-password" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<UserAddOutlined />}
              block
              className="auth__btn-primary"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth__divider">
          <span>¿Ya tienes cuenta?</span>
        </div>

        <Link to="/login" style={{ display: 'block' }}>
          <Button icon={<LoginOutlined />} block className="auth__btn-secondary">
            Iniciar sesión
          </Button>
        </Link>

        <p className="auth__legal">
          © {new Date().getFullYear()} Chain Reaction Projects S.A.S.
          {' · '}
          <Link to="/help/security">Privacidad</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
