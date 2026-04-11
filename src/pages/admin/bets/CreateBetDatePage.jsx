// frontend/src/pages/admin/bets/CreateBetDatePage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Alert, 
  Row, 
  Col, 
  DatePicker,
  Select,
  Tag,
  Spin,
  Modal,
  Table,
  Typography,
  Divider,
  Space,
  message
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  CalendarOutlined,
  TeamOutlined 
} from '@ant-design/icons';
import { useAuth } from '../../../context/AuthContext';
import betService from '../../../services/betService';
import dayjs from 'dayjs';
import { formatDateTimeShort, formatForInputUTC } from '../../../utils/dateFormatter';
import './CreateBetDatePage.css';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const CreateBetDateAdmin = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableMatches, setAvailableMatches] = useState([]);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [matchSearch, setMatchSearch] = useState('');
  const [competitionFilter, setCompetitionFilter] = useState('all');
  const [competitions, setCompetitions] = useState([]);
  const [betDates, setBetDates] = useState([]);
  const [loadingBetDates, setLoadingBetDates] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingBetDate, setEditingBetDate] = useState(null);
  const [editingMatchIds, setEditingMatchIds] = useState([]);
  
  // Cargar partidos disponibles
  useEffect(() => {
    loadAvailableMatches();
    loadCompetitions();
    loadBetDates();
  }, []);

  const loadAvailableMatches = async () => {
    try {
      setLoading(true);
      const response = await betService.getAvailableMatches();
      setAvailableMatches(response.data.matches || []);
    } catch (error) {
      console.error('Error cargando partidos:', error);
      message.error('Error al cargar partidos disponibles');
    } finally {
      setLoading(false);
    }
  };

  const loadCompetitions = async () => {
    try {
      // Esto dependería de tu API para obtener competencias
      // Por ahora, extraemos de los partidos
      const response = await betService.getAvailableMatches();
      const matches = response.data.matches || [];
      const uniqueCompetitions = [...new Set(matches.map(m => m.competition).filter(Boolean))];
      setCompetitions(uniqueCompetitions);
    } catch (error) {
      console.error('Error cargando competencias:', error);
    }
  };

  const loadBetDates = async () => {
    try {
      setLoadingBetDates(true);
      const response = await betService.getBetDates();
      setBetDates(response.data || []);
    } catch (error) {
      console.error('Error cargando fechas:', error);
      message.error('Error al cargar fechas de pronósticos');
    } finally {
      setLoadingBetDates(false);
    }
  };

  // Filtrar partidos
  const filteredMatches = availableMatches.filter(match => {
    // Filtro por competencia
    if (competitionFilter !== 'all' && match.competition !== competitionFilter) {
      return false;
    }
    
    // Filtro por búsqueda
    if (matchSearch) {
      const searchLower = matchSearch.toLowerCase();
      return (
        match.home_team.toLowerCase().includes(searchLower) ||
        match.away_team.toLowerCase().includes(searchLower) ||
        match.stadium.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Agregar partido a selección
  const addMatch = (match) => {
    if (selectedMatches.length >= 10) {
      message.warning('Máximo 10 partidos por fecha');
      return;
    }
    
    if (selectedMatches.find(m => m.id === match.id)) {
      message.warning('Este partido ya está seleccionado');
      return;
    }
    
    setSelectedMatches([...selectedMatches, match]);
    message.success(`Partido agregado: ${match.home_team} vs ${match.away_team}`);
  };

  // Remover partido de selección
  const removeMatch = (matchId) => {
    setSelectedMatches(selectedMatches.filter(m => m.id !== matchId));
  };

  // Enviar formulario
  const handleSubmit = async (values) => {
    if (selectedMatches.length !== 10) {
      message.error('Debes seleccionar exactamente 10 partidos');
      return;
    }

    try {
      setLoading(true);
      
      const formData = {
        name: values.name,
        start_datetime: values.start_datetime.format('YYYY-MM-DDTHH:mm:ss'),
        prize_PTS: values.prize_PTS || 0,
        accumulated_prize: values.accumulated_prize || 0,
        required_credits: values.required_credits || 1,
        status: 'open',
        match_ids: selectedMatches.map(m => m.id)
      };

      console.log('Enviando datos:', formData);
      
      const response = await betService.createBetDate(formData);
      
      message.success('Fecha de los pronósticos creada exitosamente');
      
      // Resetear formulario
      form.resetFields();
      setSelectedMatches([]);
      
      // Mostrar resumen
      Modal.success({
        title: '✅ Fecha Creada',
        content: (
          <div>
            <p><strong>Nombre:</strong> {response.data.name}</p>
            <p><strong>ID:</strong> {response.data.id}</p>
            <p><strong>Fecha de inicio:</strong> {new Date(response.data.start_datetime).toLocaleString()}</p>
            <p><strong>Fecha de cierre:</strong> {new Date(response.data.close_datetime).toLocaleString()}</p>
            <p><strong>Premio inicial:</strong> ${response.data.prize_PTS.toLocaleString()}</p>
          </div>
        ),
      });
      
    } catch (error) {
      console.error('Error creando fecha:', error);
      // Si el backend se reinició, la fecha puede haberse creado aunque falle la respuesta.
      try {
        const fallback = await betService.getBetDates();
        const list = fallback.data || [];
        const created = list.find((item) => {
          if (!item) return false;
          const sameName = item.name === values.name;
          const sameTime = item.start_datetime
            ? dayjs(item.start_datetime).isSame(values.start_datetime, 'minute')
            : false;
          return sameName && sameTime;
        });

        if (created) {
          message.success('Fecha creada (confirmada) aunque hubo un error de respuesta.');
          form.resetFields();
          setSelectedMatches([]);
          loadBetDates();
          Modal.info({
            title: '✅ Fecha creada',
            content: (
              <div>
                <p><strong>Nombre:</strong> {created.name}</p>
                <p><strong>ID:</strong> {created.id}</p>
                <p><strong>Fecha de inicio:</strong> {new Date(created.start_datetime).toLocaleString()}</p>
                <p><strong>Estado:</strong> {created.status}</p>
              </div>
            ),
          });
          return;
        }
      } catch (verifyError) {
        console.warn('No se pudo verificar si la fecha fue creada:', verifyError);
      }

      message.error(error.response?.data?.detail || 'Error al crear fecha de los pronósticos');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async (betDateId) => {
    try {
      const response = await betService.getBetDateDetails(betDateId);
      const betDate = response.data;
      const matchIds = (betDate.matches || []).map(m => m.id);

      setEditingBetDate(betDate);
      setEditingMatchIds(matchIds);
      editForm.setFieldsValue({
        name: betDate.name,
        start_datetime: betDate.start_datetime ? dayjs(betDate.start_datetime) : null,
        close_datetime: betDate.close_datetime ? dayjs(betDate.close_datetime) : null
      });
      // Cargar partidos disponibles si se va a permitir editar
      if (betDate.status === 'open' && (betDate.bet_count || 0) === 0) {
        loadAvailableMatches();
      }
      setEditVisible(true);
    } catch (error) {
      console.error('Error cargando detalle de fecha:', error);
      message.error('No se pudo cargar la fecha para editar');
    }
  };

  const addMatchToEdit = (match) => {
    if (editingMatchIds.length >= 10) {
      message.warning('Máximo 10 partidos por fecha');
      return;
    }
    if (editingMatchIds.includes(match.id)) {
      message.warning('Este partido ya está en la fecha');
      return;
    }
    setEditingMatchIds([...editingMatchIds, match.id]);
  };

  const removeMatchFromEdit = (matchId) => {
    setEditingMatchIds(editingMatchIds.filter(id => id !== matchId));
  };

  const handleUpdateBetDate = async (values) => {
    if (!editingBetDate) return;
    try {
      setLoading(true);
      const payload = {
        name: values.name,
        start_datetime: values.start_datetime.format('YYYY-MM-DDTHH:mm:ss'),
        close_datetime: values.close_datetime ? values.close_datetime.format('YYYY-MM-DDTHH:mm:ss') : editingBetDate.close_datetime,
        status: editingBetDate.status,
        prize_cop: editingBetDate.prize_cop || 0,
        accumulated_prize: editingBetDate.accumulated_prize || 0,
        required_credits: editingBetDate.required_credits || 1,
        match_ids: editingMatchIds
      };

      await betService.updateBetDate(editingBetDate.id, payload);
      message.success('Fecha actualizada exitosamente');
      setEditVisible(false);
      setEditingBetDate(null);
      setEditingMatchIds([]);
      editForm.resetFields();
      loadBetDates();
    } catch (error) {
      console.error('Error actualizando fecha:', error);
      message.error(error.response?.data?.detail || 'Error al actualizar la fecha');
    } finally {
      setLoading(false);
    }
  };

  // Columnas para la tabla de partidos disponibles
  const matchColumns = [
    {
      title: 'Partido',
      key: 'match',
      render: (_, record) => (
        <div>
          <div><strong>{record.home_team}</strong> vs <strong>{record.away_team}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.stadium} • {formatDateTimeShort(formatForInputUTC(record.match_date))}
          </div>
        </div>
      ),
    },
    {
      title: 'Competición',
      dataIndex: 'competition',
      key: 'competition',
      width: 150,
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="default"
          className="btn-outline-primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => addMatch(record)}
          disabled={selectedMatches.length >= 10 || selectedMatches.find(m => m.id === record.id)}
        >
          Agregar
        </Button>
      ),
    },
  ];

  const betDateColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Inicio',
      dataIndex: 'start_datetime',
      key: 'start_datetime',
      render: (value) => value ? formatDateTimeShort(value) : '-'
    },
    {
      title: 'Cierre',
      dataIndex: 'close_datetime',
      key: 'close_datetime',
      render: (value) => value ? formatDateTimeShort(value) : '-'
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => (
        <Tag color={value === 'open' ? 'green' : value === 'closed' ? 'orange' : 'red'}>
          {value}
        </Tag>
      )
    },
    {
      title: 'Partidos',
      dataIndex: 'match_count',
      key: 'match_count',
      width: 110,
      align: 'center'
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => openEditModal(record.id)}>
          Editar
        </Button>
      )
    }
  ];

  return (
    <div className="create-betdate-page" style={{ padding: '24px' }}>
      <Title level={2}>Crear Nueva Fecha de Pronósticos</Title>
      <Text type="secondary">
        Crea una nueva fecha con 10 partidos para que los usuarios apuesten
      </Text>
      
      <Divider />
      
      <Row gutter={[24, 24]}>
        {/* Formulario de configuración */}
        <Col xs={24} md={12}>
          <Card title="Configuración de la Fecha">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                required_credits: 1,
                prize_PTS: 0,
                accumulated_prize: 0
              }}
            >
              <Form.Item
                label="Nombre de la Fecha"
                name="name"
                rules={[{ required: true, message: 'Ingresa un nombre para la fecha' }]}
              >
                <Input 
                  placeholder="Ej: Fecha 1 - Liga BetPlay 2026" 
                  size="large"
                />
              </Form.Item>
              
              <Form.Item
                label="Fecha de Inicio"
                name="start_datetime"
                rules={[{ required: true, message: 'Selecciona una fecha de inicio' }]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY hh:mm A"
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="Selecciona fecha y hora"
                />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Créditos Requeridos"
                    name="required_credits"
                  >
                    <Select size="large">
                      <Option value={1}>1 crédito</Option>
                      <Option value={2}>2 créditos</Option>
                      <Option value={3}>3 créditos</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Premio Inicial"
                    name="prize_PTS"
                  >
                    <Space.Compact style={{ width: '100%' }}>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        size="large"
                      />
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0 12px',
                          background: '#fafafa',
                          border: '1px solid #d9d9d9',
                          borderLeft: 'none',
                          borderRadius: '0 6px 6px 0'
                        }}
                      >
                        $
                      </span>
                    </Space.Compact>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                label="Descripción (Opcional)"
                name="description"
              >
                <TextArea 
                  rows={3}
                  placeholder="Descripción adicional de la fecha..."
                />
              </Form.Item>
              
              <Divider>Partidos Seleccionados</Divider>
              
              <div style={{ marginBottom: '16px' }}>
                <Space wrap>
                  <Tag color={selectedMatches.length === 10 ? "success" : "warning"}>
                    {selectedMatches.length}/10 partidos seleccionados
                  </Tag>
                  {selectedMatches.length < 10 && (
                    <Tag color="red">Selecciona {10 - selectedMatches.length} más</Tag>
                  )}
                </Space>
                
                {selectedMatches.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    {selectedMatches.map(match => (
                      <Tag
                        key={match.id}
                        color="blue"
                        closable
                        onClose={() => removeMatch(match.id)}
                        style={{ marginBottom: '8px' }}
                      >
                        {match.home_team} vs {match.away_team}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
              
              <Form.Item>
                <Button
                  type="default"
                  className="btn-outline-primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  disabled={selectedMatches.length !== 10}
                  block
                >
                  {selectedMatches.length !== 10 
                    ? `Selecciona ${10 - selectedMatches.length} partidos más`
                    : 'Crear Fecha de Pronósticos'
                  }
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        
        {/* Selección de partidos */}
        <Col xs={24} md={12}>
          <Card 
            title="Seleccionar Partidos"
            extra={
              <Space>
                <Select
                  value={competitionFilter}
                  onChange={setCompetitionFilter}
                  style={{ width: 150 }}
                  placeholder="Filtrar por competencia"
                >
                  <Option value="all">Todas las competencias</Option>
                  {competitions.map(comp => (
                    <Option key={comp} value={comp}>{comp}</Option>
                  ))}
                </Select>
                
                <Button
                  icon={<SearchOutlined />}
                  className="btn-outline-primary"
                  onClick={loadAvailableMatches}
                >
                  Actualizar
                </Button>
              </Space>
            }
          >
            <Input
              placeholder="Buscar partidos por equipo o estadio..."
              prefix={<SearchOutlined />}
              value={matchSearch}
              onChange={(e) => setMatchSearch(e.target.value)}
              style={{ marginBottom: '16px' }}
              size="large"
            />
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <p>Cargando partidos disponibles...</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <Alert
                title="No hay partidos disponibles"
                description="No se encontraron partidos con los filtros aplicados"
                type="info"
                showIcon
              />
            ) : (
              <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                <Table
                  dataSource={filteredMatches}
                  columns={matchColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </div>
            )}
            
            <Divider />
            
            <Alert
              title="Instrucciones"
              description={
                <ul>
                  <li>Selecciona exactamente <strong>10 partidos</strong></li>
                  <li>Los pronósticos cerrarán automáticamente 1 hora antes del primer partido</li>
                  <li>Puedes filtrar por competencia o buscar equipos específicos</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card
        title="Fechas de Pronósticos Existentes"
        extra={
          <Button onClick={loadBetDates} icon={<SearchOutlined />}>
            Actualizar
          </Button>
        }
      >
        <Table
          dataSource={betDates}
          columns={betDateColumns}
          rowKey="id"
          loading={loadingBetDates}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Editar Fecha de Pronósticos"
        open={editVisible}
        onCancel={() => {
          setEditVisible(false);
          setEditingBetDate(null);
          setEditingMatchIds([]);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        okText="Guardar cambios"
        width={editingBetDate?.status === 'open' && (editingBetDate?.bet_count || 0) === 0 ? 900 : 520}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateBetDate}>
          <Form.Item
            label="Nombre"
            name="name"
            rules={[{ required: true, message: 'Ingrese el nombre' }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Fecha y hora de inicio"
                name="start_datetime"
                rules={[{ required: true, message: 'Seleccione fecha de inicio' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Fecha y hora de cierre" name="close_datetime">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {/* Edición de partidos — solo si open y sin apuestas */}
          {editingBetDate?.status === 'open' && (editingBetDate?.bet_count || 0) === 0 ? (
            <>
              <Divider>Partidos de esta fecha ({editingMatchIds.length}/10)</Divider>

              {/* Partidos actuales seleccionados */}
              <div style={{ marginBottom: 12 }}>
                <Space wrap>
                  {editingMatchIds.map(matchId => {
                    const m = availableMatches.find(x => x.id === matchId)
                      || (editingBetDate.matches || []).find(x => x.id === matchId);
                    const label = m
                      ? `${m.home_team || m.home_team_name || '?'} vs ${m.away_team || m.away_team_name || '?'}`
                      : `Partido #${matchId}`;
                    return (
                      <Tag
                        key={matchId}
                        color="blue"
                        closable
                        onClose={() => removeMatchFromEdit(matchId)}
                      >
                        {label}
                      </Tag>
                    );
                  })}
                  {editingMatchIds.length === 0 && (
                    <Text type="secondary">Sin partidos seleccionados</Text>
                  )}
                </Space>
              </div>

              {editingMatchIds.length < 10 && (
                <Alert
                  type="warning"
                  showIcon
                  message={`Selecciona ${10 - editingMatchIds.length} partido(s) más para completar la fecha`}
                  style={{ marginBottom: 12 }}
                />
              )}

              {/* Selector de partidos disponibles */}
              <Input
                placeholder="Buscar partido..."
                prefix={<SearchOutlined />}
                value={matchSearch}
                onChange={e => setMatchSearch(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <div style={{ maxHeight: 260, overflow: 'auto' }}>
                <Table
                  dataSource={filteredMatches.filter(m => !editingMatchIds.includes(m.id))}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: 'Partido',
                      render: (_, r) => (
                        <div>
                          <strong>{r.home_team}</strong> vs <strong>{r.away_team}</strong>
                          <div style={{ fontSize: 11, color: '#888' }}>
                            {r.competition} • {formatDateTimeShort(formatForInputUTC(r.match_date))}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: '',
                      width: 80,
                      render: (_, r) => (
                        <Button
                          size="small"
                          type="primary"
                          icon={<PlusOutlined />}
                          disabled={editingMatchIds.length >= 10}
                          onClick={() => addMatchToEdit(r)}
                        >
                          Agregar
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
            </>
          ) : (
            <Alert
              type={editingBetDate?.status !== 'open' ? 'warning' : 'info'}
              showIcon
              message={
                editingBetDate?.status !== 'open'
                  ? `Los partidos no se pueden cambiar: la fecha está en estado "${editingBetDate?.status}"`
                  : `Los partidos no se pueden cambiar: ya hay ${editingBetDate?.bet_count} pronóstico(s) registrado(s)`
              }
            />
          )}
        </Form>
      </Modal>
    </div>
  );
};

const CreateBetDatePage = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          title="Acceso denegado"
          description="Solo los administradores pueden crear fechas de pronósticos"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return <CreateBetDateAdmin />;
};

// Componente para mostrar estadisticas
const StatCard = ({ title, value, max, icon, color }) => (
  <div style={{ textAlign: 'center', padding: '16px' }}>
    <div style={{ fontSize: '32px', color, marginBottom: '8px' }}>
      {icon}
    </div>
    <Title level={3} style={{ margin: 0, color }}>{value}</Title>
    <Text type="secondary">{title}</Text>
    {max && (
      <div style={{ marginTop: '8px' }}>
        <div 
          style={{ 
            height: '4px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              height: '100%', 
              backgroundColor: color,
              width: `${(value/max)*100}%`
            }}
          />
        </div>
      </div>
    )}
  </div>
);

export default CreateBetDatePage;

