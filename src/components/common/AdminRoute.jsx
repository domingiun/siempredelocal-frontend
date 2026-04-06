// frontend/src/components/common/AdminRoute.jsx
// C6: Protege rutas que requieren rol ADMIN.
// A diferencia de PrivateRoute (solo verifica autenticación),
// AdminRoute además verifica que el usuario tenga rol admin.
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spin, Result, Button } from 'antd';

const AdminRoute = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // No autenticado → login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Autenticado pero sin rol admin → dashboard con mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="Acceso denegado"
        subTitle="No tienes permisos de administrador para acceder a esta página."
        extra={
          <Button type="primary" href="/dashboard">
            Volver al inicio
          </Button>
        }
      />
    );
  }

  return <Outlet />;
};

export default AdminRoute;
