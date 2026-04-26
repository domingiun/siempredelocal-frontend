// frontend/src/components/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, UserAddOutlined, HomeOutlined } from '@ant-design/icons';
import logo from '../../assets/logo.png';
import './Auth.css';

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login }       = useAuth();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const redirectTo      = searchParams.get('redirect') || '/dashboard';

  const onFinish = async (values) => {
    setError('');
    setLoading(true);
    const result = await login(values.username, values.password);
    setLoading(false);

    if (result.success) {
      navigate(redirectTo);
    } else {
      let msg = result.error;
      if (msg && typeof msg === 'object') {
        msg = Array.isArray(msg)
          ? msg.map(e => e.msg || e.detail).join(', ')
          : msg.detail || msg.msg || JSON.stringify(msg);
      }
      setError(msg || 'Credenciales incorrectas');
    }
  };

  return (
    <div className="auth">
      <div className="auth__bg" />

      {/* Volver al inicio */}
      <Link to="/" className="auth__home-link">
        <HomeOutlined /> Inicio
      </Link>

      <div className="auth__card">
        {/* Logo */}
        <div className="auth__logo-wrap">
          <img src={logo} alt="Siempre de Local" className="auth__logo" />
        </div>

        <div className="auth__header">
          <h1 className="auth__title">Bienvenido de nuevo</h1>
          <p className="auth__subtitle">Ingresa tus credenciales para continuar</p>
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
        >
          <Form.Item
            name="username"
            label="Usuario"
            rules={[{ required: true, message: 'Ingresa tu usuario' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Tu nombre de usuario"
              autoComplete="username"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contraseña"
            rules={[{ required: true, message: 'Ingresa tu contraseña' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              disabled={loading}
            />
          </Form.Item>

          <div className="auth__forgot">
            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </div>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<LoginOutlined />}
              block
              className="auth__btn-primary"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth__divider">
          <span>¿No tienes cuenta?</span>
        </div>

        <Link to="/register" style={{ display: 'block' }}>
          <Button icon={<UserAddOutlined />} block className="auth__btn-secondary">
            Crear cuenta gratis
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

export default Login;
