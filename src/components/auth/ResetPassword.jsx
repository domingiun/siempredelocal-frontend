// frontend/src/components/auth/ResetPassword.jsx
import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { LockOutlined, ArrowLeftOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { authAPI } from '../../services/api';
import logo from '../../assets/logo.png';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const token           = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async ({ password, confirmPassword }) => {
    setError('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo actualizar la contraseña. El enlace puede haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  // Sin token en la URL
  if (!token) {
    return (
      <div className="auth">
        <div className="auth__bg" />
        <div className="auth__card" style={{ textAlign: 'center' }}>
          <WarningOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
          <h2 className="auth__title">Enlace inválido</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            Este enlace de recuperación no es válido o ya fue utilizado.
          </p>
          <Link to="/forgot-password">
            <Button className="auth__btn-primary" type="primary" block>
              Solicitar nuevo enlace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <h2 className="auth__title">¡Contraseña actualizada!</h2>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>
              Tu contraseña fue cambiada correctamente.
            </p>
            <p style={{ color: '#475569', fontSize: 13, margin: '0 0 24px' }}>
              Serás redirigido al inicio de sesión en unos segundos...
            </p>
            <Link to="/login">
              <Button className="auth__btn-primary" type="primary" block>
                Iniciar sesión ahora
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="auth__header">
              <h2 className="auth__title">Nueva contraseña</h2>
              <p className="auth__subtitle">Elige una contraseña segura para tu cuenta</p>
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
                name="password"
                label="Nueva contraseña"
                rules={[
                  { required: true, message: 'Ingresa tu nueva contraseña' },
                  { min: 6, message: 'Mínimo 6 caracteres' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Mínimo 6 caracteres"
                  size="large"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirmar contraseña"
                rules={[{ required: true, message: 'Confirma tu contraseña' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Repite tu contraseña"
                  size="large"
                  autoComplete="new-password"
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
                  Cambiar contraseña
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

export default ResetPassword;
