// frontend/src/pages/AdminPage.jsx
import React from 'react';
import { Typography, Card, Alert } from 'antd';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

const AdminPage = () => {
  const { user } = useAuth();

  // Verificar si es admin
  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Alert
            title="Acceso Denegado"
            description="Solo los administradores pueden acceder a esta página."
            type="error"
            showIcon
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>Panel de Administración</Title>
        <p>Bienvenido al panel de administración del sistema.</p>
      </Card>
    </div>
  );
};

export default AdminPage;
