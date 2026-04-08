// frontend/src/pages/admin/bets/BetAdminPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, Alert, Table, Button, Space, Typography,
  Tag, Modal, Input, InputNumber, Form, message, Divider
} from 'antd';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './BetAdminPage.css';

const BetAdminPage = () => {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          title="Acceso denegado"
          description="Solo los administradores pueden acceder a esta página"
          type="error"
          showIcon
        />
      </div>
    );
  }

  const fetchPending = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions/admin/pending-credit-purchases');
      setPending(response.data?.pending_purchases || []);
    } catch (error) {
      console.error('Error cargando pendientes:', error);
      message.error('No se pudieron cargar las recargas pendientes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await api.get('/transactions/admin/pending-requests');
      setPendingRequests(response.data?.requests || []);
    } catch (error) {
      console.error('Error cargando solicitudes pendientes:', error);
      message.error('No se pudieron cargar las solicitudes pendientes');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchPendingRequests();
  }, []);

  const handleApprove = (transactionId) => {
    Modal.confirm({
      title: 'Aprobar recarga de créditos',
      content: '¿Confirmas aprobar esta recarga?',
      okText: 'Aprobar',
      cancelText: 'Cancelar',
      okButtonProps: {
        style: {
          backgroundColor: '#042378',
          borderColor: '#042378',
          color: '#ffffff',
          fontWeight: 600
        }
      },
      onOk: async () => {
        setSubmitting(true);
        try {
          await api.post(`/transactions/admin/approve-credit-purchase/${transactionId}`);
          message.success('Recarga aprobada');
          fetchPending();
        } catch (error) {
          console.error('Error aprobando recarga:', error);
          message.error('No se pudo aprobar la recarga');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const handleReject = (transactionId) => {
    let reasonValue = '';
    Modal.confirm({
      title: 'Rechazar recarga de créditos',
      content: (
        <div>
          <p>Indica el motivo del rechazo (opcional).</p>
          <Input onChange={(e) => { reasonValue = e.target.value; }} />
        </div>
      ),
      okText: 'Rechazar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        setSubmitting(true);
        try {
          const reasonParam = reasonValue ? `?reason=${encodeURIComponent(reasonValue)}` : '';
          await api.post(`/transactions/admin/reject-credit-purchase/${transactionId}${reasonParam}`);
          message.success('Recarga rechazada');
          fetchPending();
        } catch (error) {
          console.error('Error rechazando recarga:', error);
          message.error('No se pudo rechazar la recarga');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const handleApproveRequest = (transactionId) => {
    Modal.confirm({
      title: 'Aprobar solicitud',
      content: '¿Confirmas aprobar esta solicitud?',
      okText: 'Aprobar',
      cancelText: 'Cancelar',
      okButtonProps: {
        style: {
          backgroundColor: '#042378',
          borderColor: '#042378',
          color: '#ffffff',
          fontWeight: 600
        }
      },
      onOk: async () => {
        setSubmitting(true);
        try {
          await api.post(`/transactions/admin/approve-request/${transactionId}`);
          message.success('Solicitud aprobada');
          fetchPendingRequests();
        } catch (error) {
          console.error('Error aprobando solicitud:', error);
          message.error('No se pudo aprobar la solicitud');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const handleRejectRequest = (transactionId) => {
    let reasonValue = '';
    Modal.confirm({
      title: 'Rechazar solicitud',
      content: (
        <div>
          <p>Indica el motivo del rechazo (opcional).</p>
          <Input onChange={(e) => { reasonValue = e.target.value; }} />
        </div>
      ),
      okText: 'Rechazar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        setSubmitting(true);
        try {
          const reasonParam = reasonValue ? `?reason=${encodeURIComponent(reasonValue)}` : '';
          await api.post(`/transactions/admin/reject-request/${transactionId}${reasonParam}`);
          message.success('Solicitud rechazada');
          fetchPendingRequests();
        } catch (error) {
          console.error('Error rechazando solicitud:', error);
          message.error('No se pudo rechazar la solicitud');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const handleManualCredits = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/transactions/admin/add-credits', {
        user_id: values.user_id,
        credits: values.credits,
        reason: values.reason || null
      });
      message.success('Créditos agregados');
      form.resetFields();
    } catch (error) {
      console.error('Error agregando créditos:', error);
      message.error(error.response?.data?.detail || 'No se pudieron agregar créditos');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(() => ([
    {
      title: 'ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      width: 80
    },
    {
      title: 'Usuario',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 200,
      render: (_, record) => {
        const displayName = record.user_full_name || record.user_name || `Usuario ${record.user_id}`;
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{displayName}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>ID: {record.user_id}</div>
          </div>
        );
      }
    },
    {
      title: 'Créditos',
      dataIndex: 'credits',
      key: 'credits',
      render: (value) => <Tag color="blue">+{value}</Tag>
    },
    {
      title: 'Valor',
      dataIndex: 'amount_PTS',
      key: 'amount_PTS',
      render: (value) => `$${Number(value || 0).toLocaleString()}`
    },
    {
      title: 'Método',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (value) => value || 'N/A'
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value) => value ? new Date(value).toLocaleString() : '-'
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => handleApprove(record.transaction_id)}
            loading={submitting}
            style={{
              backgroundColor: '#237804',
              borderColor: '#237804',
              color: '#ffffff',
              fontWeight: 600
            }}
          >
            Aprobar
          </Button>
          <Button
            danger
            onClick={() => handleReject(record.transaction_id)}
            loading={submitting}
            style={{
              backgroundColor: '#a8071a',
              borderColor: '#a8071a',
              color: '#ffffff',
              fontWeight: 600
            }}
          >
            Rechazar
          </Button>
        </Space>
      )
    }
  ]), [submitting]);

  const requestColumns = useMemo(() => ([
    {
      title: 'ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      width: 80
    },
    {
      title: 'Usuario',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 200,
      render: (_, record) => {
        const displayName = record.user_full_name || record.user_name || `Usuario ${record.user_id}`;
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{displayName}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>ID: {record.user_id}</div>
          </div>
        );
      }
    },
    {
      title: 'Tipo',
      dataIndex: 'reference_type',
      key: 'reference_type',
      render: (value) => (
        <Tag color={value === 'withdrawal' ? 'red' : 'blue'}>
          {value === 'withdrawal' ? 'Retiro' : 'Canje a créditos'}
        </Tag>
      )
    },
    {
      title: 'Puntos',
      dataIndex: 'amount_cop',
      key: 'amount_cop',
      render: (value) => `$${Math.abs(Number(value || 0)).toLocaleString()}`
    },
    {
      title: 'Créditos',
      dataIndex: 'amount_credits',
      key: 'amount_credits',
      render: (value) => value ? <Tag color="blue">+{value}</Tag> : '-'
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value) => value ? new Date(value).toLocaleString() : '-'
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => handleApproveRequest(record.transaction_id)}
            loading={submitting}
            style={{
              backgroundColor: '#237804',
              borderColor: '#237804',
              color: '#ffffff',
              fontWeight: 600
            }}
          >
            Aprobar
          </Button>
          <Button
            danger
            onClick={() => handleRejectRequest(record.transaction_id)}
            loading={submitting}
            style={{
              backgroundColor: '#a8071a',
              borderColor: '#a8071a',
              color: '#ffffff',
              fontWeight: 600
            }}
          >
            Rechazar
          </Button>
        </Space>
      )
    }
  ]), [submitting]);

  return (
    <div className="bet-admin-page" style={{ padding: '24px' }}>
      <Card style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Administración de Créditos
        </Typography.Title>
        <Typography.Text type="secondary">
          Aprueba recargas por solicitud y realiza ajustes manuales.
        </Typography.Text>
      </Card>

      <Card title="Compras pendientes" style={{ marginBottom: 16 }}>
        <Table
          rowKey="transaction_id"
          columns={columns}
          dataSource={pending}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No hay recargas pendientes' }}
        />
        <Button
          onClick={fetchPending}
          style={{
            marginTop: 8,
            backgroundColor: '#0958d9',
            borderColor: '#0958d9',
            color: '#ffffff',
            fontWeight: 600
          }}
        >
          Actualizar
        </Button>
      </Card>

      <Card title="Solicitudes de canje o retiro" style={{ marginBottom: 16 }}>
        <Table
          rowKey="transaction_id"
          columns={requestColumns}
          dataSource={pendingRequests}
          loading={loadingRequests}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No hay solicitudes pendientes' }}
        />
        <Button
          onClick={fetchPendingRequests}
          style={{
            marginTop: 8,
            backgroundColor: '#0958d9',
            borderColor: '#0958d9',
            color: '#ffffff',
            fontWeight: 600
          }}
        >
          Actualizar
        </Button>
      </Card>

      <Card title="Agregar créditos manualmente">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleManualCredits}
        >
          <Space wrap style={{ width: '100%' }}>
            <Form.Item
              label="ID de usuario"
              name="user_id"
              rules={[{ required: true, message: 'Ingresa el ID del usuario' }]}
            >
              <InputNumber min={1} style={{ width: 180 }} />
            </Form.Item>
            <Form.Item
              label="Créditos a agregar"
              name="credits"
              rules={[{ required: true, message: 'Ingresa la cantidad de créditos' }]}
            >
              <InputNumber min={1} style={{ width: 180 }} />
            </Form.Item>
            <Form.Item label="Motivo (opcional)" name="reason">
              <Input style={{ width: 280 }} />
            </Form.Item>
          </Space>
          <Divider />
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            style={{
              backgroundColor: '#0958d9',
              borderColor: '#0958d9',
              color: '#ffffff',
              fontWeight: 600
            }}
          >
            Agregar créditos
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default BetAdminPage;

