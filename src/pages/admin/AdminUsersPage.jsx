// frontend/src/pages/admin/AdminUsersPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Table, Space, Button, Tag, Modal, Form, Input, Select,
  Typography, message, Popconfirm, Avatar, Badge, Tooltip,
  Row, Col, Statistic, Divider, InputNumber, Switch, Alert
} from 'antd';
import {
  UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, SearchOutlined, FilterOutlined, ReloadOutlined,
  LockOutlined, UnlockOutlined, CrownOutlined, TeamOutlined,
  ExportOutlined, ImportOutlined, MailOutlined, PhoneOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import userService from '../../services/userService';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

const AdminUsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    users: 0,
    inactive: 0
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getAvatarSrc = (avatarUrl) => {
    if (!avatarUrl) return undefined;
    return avatarUrl.startsWith('http') ? avatarUrl : `${apiBaseUrl}${avatarUrl}`;
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, []);


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/');
      const usersData = response.data || [];
      
      setUsers(usersData);
      calculateStats(usersData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      message.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersList) => {
    const statsData = {
      total: usersList.length,
      active: usersList.filter(u => u.is_active).length,
      admins: usersList.filter(u => u.role === 'admin').length,
      users: usersList.filter(u => u.role === 'user').length,
      inactive: usersList.filter(u => !u.is_active).length
    };
    setStats(statsData);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      message.success('Usuario desactivado exitosamente');
      fetchUsers();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      message.error('Error al desactivar usuario');
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await api.patch(`/users/${userId}/activate`);
      message.success('Usuario reactivado exitosamente');
      fetchUsers();
    } catch (error) {
      console.error('Error activando usuario:', error);
      message.error('Error al reactivar usuario');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      message.success(`Rol cambiado a ${newRole}`);
      fetchUsers();
    } catch (error) {
      console.error('Error cambiando rol:', error);
      message.error('Error al cambiar rol');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (selectedUser) {
        // Actualizar usuario existente
        await api.put(`/users/${selectedUser.id}`, values);
        message.success('Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario (necesitarías endpoint /register o /users)
        message.info('Endpoint de creación de usuarios debe implementarse en backend');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Error guardando usuario:', error);
      message.error(error.response?.data?.detail || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchText || 
      user.username.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = statusFilter === null || user.is_active === (statusFilter === 'active');
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <Avatar 
            size="small" 
            style={{ backgroundColor: record.role === 'admin' ? '#f5222d' : '#1890ff' }}
            src={getAvatarSrc(record.avatar_url)}
            icon={!record.avatar_url ? <UserOutlined /> : undefined}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Nombre Completo',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text) => text || 'No especificado',
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag 
          color={role === 'admin' ? 'red' : 'blue'}
          icon={role === 'admin' ? <CrownOutlined /> : <UserOutlined />}
        >
          {role === 'admin' ? 'Administrador' : 'Usuario'}
        </Tag>
      ),
      filters: [
        { text: 'Administrador', value: 'admin' },
        { text: 'Usuario', value: 'user' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Badge 
          status={isActive ? 'success' : 'error'}
          text={isActive ? 'Activo' : 'Inactivo'}
        />
      ),
      filters: [
        { text: 'Activo', value: 'active' },
        { text: 'Inactivo', value: 'inactive' },
      ],
      onFilter: (value, record) => 
        value === 'active' ? record.is_active : !record.is_active,
    },
    {
      title: 'Creado',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
              size="small"
            />
          </Tooltip>
          
          {record.role !== 'admin' && (
            <Tooltip title={record.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}>
              <Button
                type="text"
                icon={<CrownOutlined />}
                onClick={() => handleRoleChange(
                  record.id, 
                  record.role === 'admin' ? 'user' : 'admin'
                )}
                size="small"
                style={{ color: record.role === 'admin' ? '#ff4d4f' : '#52c41a' }}
              />
            </Tooltip>
          )}
          
          {record.is_active ? (
            <Popconfirm
              title="¿Desactivar usuario?"
              description="El usuario no podrá acceder al sistema."
              onConfirm={() => handleDeleteUser(record.id)}
              okText="Sí"
              cancelText="No"
            >
              <Tooltip title="Desactivar">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Tooltip title="Activar">
              <Button
                type="text"
                icon={<UnlockOutlined />}
                onClick={() => handleActivateUser(record.id)}
                size="small"
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
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

  return (
    <div className={isDark ? 'admin-users admin-users--dark' : 'admin-users'} style={{ padding: '24px' }}>
      <style>{`
        .admin-users--dark {
          background: radial-gradient(1200px 600px at 10% -10%, #0c141f 0%, #0a0f16 55%, #0a0f14 100%);
          color: #e6edf3;
        }
        .admin-users--dark .ant-card {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .admin-users--dark .ant-card-head {
          border-bottom-color: #1f2b3a;
          background: #0c141f;
        }
        .admin-users--dark .ant-card-head-title,
        .admin-users--dark .ant-card-extra {
          color: #e6edf3;
        }
        .admin-users--dark .ant-typography,
        .admin-users--dark .ant-typography-secondary {
          color: #e6edf3;
        }
        .admin-users--dark .ant-typography-secondary {
          color: #9fb0c2;
        }
        .admin-users--dark .ant-statistic-title {
          color: #9fb0c2;
        }
        .admin-users--dark .ant-statistic-content {
          color: #f1f5f9;
        }
        .admin-users--dark .stat-card .ant-statistic-title {
          color: #cbd5e1;
        }
        .admin-users--dark .stat-card .ant-statistic-content {
          color: #f8fafc;
        }
        .admin-users--dark .ant-input,
        .admin-users--dark .ant-select-selector,
        .admin-users--dark .ant-input-affix-wrapper {
          background: #0f1824 !important;
          border-color: #1f2b3a !important;
          color: #e6edf3 !important;
        }
        .admin-users--dark .ant-select-single .ant-select-selector {
          background: #0f1824 !important;
          border-color: #1f2b3a !important;
          color: #e6edf3 !important;
        }
        .admin-users--dark .ant-select-selection-placeholder {
          color: #9fb0c2 !important;
        }
        .admin-users--dark .ant-select-selection-item {
          color: #e6edf3 !important;
        }
        .admin-users--dark .ant-input::placeholder {
          color: #9fb0c2;
        }
        .admin-users--dark .ant-select-arrow {
          color: #9fb0c2 !important;
        }
        .admin-users--dark .ant-table {
          background: #0f1824;
          color: #e6edf3;
        }
        .admin-users--dark .ant-table-container {
          background: #0f1824;
        }
        .admin-users--dark .ant-table-thead > tr > th {
          background: #0c141f;
          color: #cbd5e1;
          border-bottom: 1px solid #1f2b3a;
        }
        .admin-users--dark .ant-table-tbody > tr > td {
          border-bottom: 1px solid #1f2b3a;
          color: #e6edf3;
        }
        .admin-users--dark .ant-table-tbody > tr.ant-table-row:hover > td {
          background: #0f1b2a;
        }
        .admin-users--dark .ant-pagination-item,
        .admin-users--dark .ant-pagination-prev,
        .admin-users--dark .ant-pagination-next {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .admin-users--dark .ant-pagination-item a {
          color: #e6edf3;
        }
        .admin-users--dark .ant-tag {
          border-color: #1f2b3a;
          background: #111b28;
          color: #cbd5e1;
        }
        .admin-users--dark .ant-badge-status-text {
          color: #e6edf3;
        }
        .admin-users--dark .ant-btn {
          background: #0f1824;
          border-color: #1f2b3a;
          color: #e6edf3;
        }
        .admin-users--dark .ant-btn:hover {
          background: #162233;
          border-color: #2a3a4f;
          color: #ffffff;
        }
        .admin-users--dark .btn-primary {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
        }
        .admin-users--dark .btn-primary:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
          color: #ffffff;
        }
        .toggle-dark {
          background: #e5e7eb;
          border-color: #cbd5e1;
        }
        .toggle-dark .ant-switch-inner .ant-switch-inner-unchecked {
          color: #111827;
        }
        .toggle-dark.ant-switch-checked .ant-switch-inner .ant-switch-inner-checked {
          color: #ffffff;
        }
        .admin-users--dark .toggle-dark {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .admin-users--dark .toggle-dark.ant-switch-checked .ant-switch-inner .ant-switch-inner-checked {
          color: #93c5fd;
        }
        .btn-primary {
          background: #0958d9;
          border-color: #0958d9;
          color: #ffffff;
        }
        .btn-primary:hover {
          background: #0b4cc1;
          border-color: #0b4cc1;
          color: #ffffff;
        }
        body[data-theme="dark"] .ant-select-dropdown {
          background: #0f1824 !important;
          border-color: #1f2b3a !important;
          color: #e6edf3 !important;
        }
        body[data-theme="dark"] .ant-select-dropdown .ant-select-item {
          color: #e6edf3 !important;
          background: #0f1824 !important;
        }
        body[data-theme="dark"] .ant-select-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
          background: #0f1b2a !important;
        }
        body[data-theme="dark"] .ant-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background: #162233 !important;
        }
        body[data-theme="dark"] .ant-select-dropdown .ant-select-item-option-content {
          color: #e6edf3 !important;
        }
        body[data-theme="dark"] .ant-select-selector,
        body[data-theme="dark"] .ant-input,
        body[data-theme="dark"] .ant-input-affix-wrapper {
          background: #0f1824 !important;
          border-color: #1f2b3a !important;
          color: #e6edf3 !important;
        }
        body[data-theme="dark"] .dark-select .ant-select-selector {
          background: #0f1824 !important;
          border-color: #1f2b3a !important;
          color: #e6edf3 !important;
        }
        body[data-theme="dark"] .ant-select-single:not(.ant-select-customize-input) .ant-select-selector {
          background: #0f1824 !important;
          border-color: #1f2b3a !important;
          color: #e6edf3 !important;
        }
        body[data-theme="dark"] .ant-select-selection-placeholder {
          color: #9fb0c2 !important;
        }
        body[data-theme="dark"] .ant-input::placeholder {
          color: #9fb0c2;
        }
      `}</style>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Row justify="space-between" align="middle" gutter={[12, 12]}>
                <Col>
                  <Title level={2}>
                    <TeamOutlined style={{ marginRight: 8 }} />
                    Administración de Usuarios
                  </Title>
                  <Text type="secondary">
                    Gestiona los usuarios del sistema, roles y permisos.
                  </Text>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        {/* Estadísticas */}
        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={4} xl={4} xxl={4}>
              <Card size="small" className="stat-card">
                <Statistic
                  title="Total Usuarios"
                  value={stats.total}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4} xl={4} xxl={4}>
              <Card size="small" className="stat-card">
                <Statistic
                  title="Activos"
                  value={stats.active}
                  styles={{ content: { color: '#52c41a' } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4} xl={4} xxl={4}>
              <Card size="small" className="stat-card">
                <Statistic
                  title="Administradores"
                  value={stats.admins}
                  styles={{ content: { color: '#f5222d' } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4} xl={4} xxl={4}>
              <Card size="small" className="stat-card">
                <Statistic
                  title="Usuarios Normales"
                  value={stats.users}
                  styles={{ content: { color: '#1890ff' } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4} xl={4} xxl={4}>
              <Card size="small" className="stat-card">
                <Statistic
                  title="Inactivos"
                  value={stats.inactive}
                  styles={{ content: { color: '#faad14' } }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Filtros y búsqueda */}
        <Col span={24}>
          <Card>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Search
                  placeholder="Buscar usuario, email o nombre..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              
              <Col xs={12} md={4}>
                <Select
                  placeholder="Filtrar por rol"
                  style={{ width: '100%' }}
                  allowClear
                  value={roleFilter}
                  onChange={setRoleFilter}
                  className="dark-select"
                >
                  <Option value="admin">Administrador</Option>
                  <Option value="user">Usuario</Option>
                </Select>
              </Col>
              
              <Col xs={12} md={4}>
                <Select
                  placeholder="Filtrar por estado"
                  style={{ width: '100%' }}
                  allowClear
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="dark-select"
                >
                  <Option value="active">Activo</Option>
                  <Option value="inactive">Inactivo</Option>
                </Select>
              </Col>
              
              <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchUsers}
                  >
                    Actualizar
                  </Button>
                  
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateUser}
                    className="btn-primary"
                  >
                    Nuevo Usuario
                  </Button>
                  
                  {selectedRowKeys.length > 0 && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        Modal.confirm({
                          title: `¿Eliminar ${selectedRowKeys.length} usuario(s)?`,
                          content: 'Esta acción no se puede deshacer.',
                          okText: 'Eliminar',
                          okType: 'danger',
                          cancelText: 'Cancelar',
                          onOk: async () => {
                            try {
                              // Implementar eliminación masiva
                              message.info('Funcionalidad de eliminación masiva pendiente');
                            } catch (error) {
                              message.error('Error eliminando usuarios');
                            }
                          },
                        });
                      }}
                    >
                      Eliminar Seleccionados
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Tabla de usuarios */}
        <Col span={24}>
          <Card>
            <Table
              columns={columns}
              dataSource={filteredUsers}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} usuarios`,
              }}
              rowSelection={rowSelection}
              locale={{
                emptyText: 'No hay usuarios registrados',
              }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal para crear/editar usuario */}
      <Modal
        title={selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            role: 'user',
            is_active: true
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: 'Ingrese un username' },
                  { min: 3, message: 'Mínimo 3 caracteres' }
                ]}
              >
                <Input placeholder="usuario123" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Ingrese un email válido' },
                  { type: 'email', message: 'Email inválido' }
                ]}
              >
                <Input placeholder="usuario@ejemplo.com" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="full_name"
                label="Nombre Completo"
              >
                <Input placeholder="Nombre Apellido" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="role"
                label="Rol"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="user">Usuario</Option>
                  <Option value="admin">Administrador</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Estado"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Activo"
                  unCheckedChildren="Inactivo"
                />
              </Form.Item>
            </Col>
            
            {!selectedUser && (
              <>
                <Col span={12}>
                  <Form.Item
                    name="password"
                    label="Contraseña"
                    rules={[
                      { required: true, message: 'Ingrese una contraseña' },
                      { min: 6, message: 'Mínimo 6 caracteres' }
                    ]}
                  >
                    <Input.Password placeholder="********" />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="confirm_password"
                    label="Confirmar Contraseña"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Confirme la contraseña' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Las contraseñas no coinciden'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="********" />
                  </Form.Item>
                </Col>
              </>
            )}
            
            {selectedUser && (
              <Col span={24}>
                <Alert
                  title="Para cambiar la contraseña, use la función específica en el perfil del usuario."
                  type="info"
                  showIcon
                />
              </Col>
            )}
          </Row>
          
          <Divider />
          
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {selectedUser ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
