// frontend/src/components/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { authAPI } from '../../services/api';
import logo from '../../assets/logo.png';
import './Auth.css';

const ForgotPassword = () => {
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async ({ email }) => {
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ channel: 'email', email });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__bg" />

      <Link to="/" className="auth__home-link">
        <ArrowLeftOutlined /> Inicio
      </Link>

      <div className="auth__card">

        <div className="auth__logo-wrap">
          <img src={logo} alt="Siempre de Local" className="auth__logo" />
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
            <h2 className="auth__title">¡Correo enviado!</h2>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
              Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.
              Revisa también tu carpeta de spam.
            </p>
            <p style={{ color: '#475569', fontSize: 13, margin: '0 0 24px' }}>
              El enlace es válido por <strong style={{ color: '#94a3b8' }}>30 minutos</strong>.
            </p>
            <Link to="/login">
              <Button className="auth__btn-primary" type="primary" block>
                Volver al inicio de sesión
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="auth__header">
              <h2 className="auth__title">Recuperar contraseña</h2>
              <p className="auth__subtitle">
                Ingresa tu correo y te enviaremos un enlace para restablecerla
              </p>
            </div>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                className="auth__alert"
                closable
                onClose={() => setError('')}
              />
            )}

            <Form layout="vertical" onFinish={handleSubmit} className="auth__form">
              <Form.Item
                name="email"
                label="Correo electrónico"
                rules={[
                  { required: true, message: 'Ingresa tu correo' },
                  { type: 'email', message: 'Correo inválido' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="correo@ejemplo.com"
                  size="large"
                  autoComplete="email"
                  inputMode="email"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 12 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="auth__btn-primary"
                >
                  Enviar enlace de recuperación
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Link to="/login" style={{ fontSize: 13, color: '#1677ff', fontWeight: 600 }}>
                <ArrowLeftOutlined style={{ marginRight: 4 }} />
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
