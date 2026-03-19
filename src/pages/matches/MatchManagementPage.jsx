// frontend/src/pages/matches/MatchManagementPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select,
  DatePicker, Modal, Form, message, Row, Col,
  Statistic, Tooltip, Popconfirm
} from 'antd';
import {
  PlusOutlined, SearchOutlined, FilterOutlined,
  EditOutlined, DeleteOutlined, EyeOutlined,
  ExportOutlined, ReloadOutlined, CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import competitionService from '../../services/competitionService';

const { RangePicker } = DatePicker;
const { Option } = Select;

const MatchManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetchMatches();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters
      };
      
      const response = await competitionService.getMatches(params);
      setMatches(response.data || []);
      setPagination({
        ...pagination,
        total: response.total || response.data?.length || 0
      });
    } catch (error) {
      message.error('Error al cargar partidos');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
    
    // Agregar filtros de la tabla
    const newFilters = { ...filters };
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) {
        newFilters[key] = newFilters[key][0];
      }
    });
    
    // Agregar ordenamiento
    if (sorter.field) {
      newFilters.sort_by = sorter.field;
      newFilters.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc';
    }
    
    setFilters(newFilters);
  };

  const handleDelete = async (id) => {
    try {
      await competitionService.deleteMatch(id);
      message.success('Partido eliminado');
      fetchMatches();
    } catch (error) {
      message.error('Error al eliminar partido');
    }
  };

  const handleDeleteSelected = () => {
    Modal.confirm({
      title: `¿Eliminar ${selectedRowKeys.length} partidos?`,
      content: 'Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map(id => 
            competitionService.deleteMatch(id)
          ));
          message.success(`${selectedRowKeys.length} partidos eliminados`);
          setSelectedRowKeys([]);
          fetchMatches();
        } catch (error) {
          message.error('Error al eliminar partidos');
        }
      },
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
    },
    {
      title: 'Partido',
      key: 'match',
      render: (_, record) => (
        <Space>
          <strong>{record.home_team?.name || 'Local'}</strong>
          <span>vs</span>
          <strong>{record.away_team?.name || 'Visitante'}</strong>
        </Space>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'match_date',
      key: 'match_date',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
      sorter: true,
    },
    {
      title: 'Estadio',
      dataIndex: 'stadium',
      key: 'stadium',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'scheduled': 'blue',
          'in_progress': 'orange',
          'finished': 'green',
          'cancelled': 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
      filters: [
        { text: 'Programado', value: 'scheduled' },
        { text: 'En Curso', value: 'in_progress' },
        { text: 'Finalizado', value: 'finished' },
        { text: 'Cancelado', value: 'cancelled' },
      ],
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalles">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/matches/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/matches/${record.id}/edit`)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar partido?"
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
          >
            <Tooltip title="Eliminar">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Gestión de Partidos" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: '16px' }}>
          <Col flex="auto">
            <Space wrap>
              <Input
                placeholder="Buscar por equipo o estadio..."
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Select
                placeholder="Estado"
                style={{ width: 150 }}
                allowClear
                onChange={(value) => setFilters({ ...filters, status: value })}
              >
                <Option value="scheduled">Programado</Option>
                <Option value="in_progress">En Curso</Option>
                <Option value="finished">Finalizado</Option>
                <Option value="cancelled">Cancelado</Option>
              </Select>
              <RangePicker
                onChange={(dates) => {
                  if (dates && dates.length === 2) {
                    setFilters({
                      ...filters,
                      date_from: dates[0].toISOString(),
                      date_to: dates[1].toISOString(),
                    });
                  } else {
                    const newFilters = { ...filters };
                    delete newFilters.date_from;
                    delete newFilters.date_to;
                    setFilters(newFilters);
                  }
                }}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchMatches}
              >
                Actualizar
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/matches/new')}
              >
                Nuevo Partido
              </Button>
            </Space>
          </Col>
        </Row>

        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <span>{selectedRowKeys.length} partidos seleccionados</span>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteSelected}
              >
                Eliminar seleccionados
              </Button>
            </Space>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={matches}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default MatchManagementPage;
