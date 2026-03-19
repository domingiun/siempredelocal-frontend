// frontend/src/components/wallet/TransactionHistoryList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Typography, Space, Button, 
  DatePicker, Select, Input, Card, Row, Col, Alert 
} from 'antd';
import { 
  SearchOutlined, FilterOutlined, DownloadOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const TransactionHistoryList = () => {
  const { user } = useAuth();
  const { transactions, loading, refreshWallet } = useWallet();
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filters, setFilters] = useState({
    type: null,
    search: '',
    dateRange: null,
  });

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions([]);
    }
  }, [transactions]);

  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Filtrar por tipo
    if (filters.type) {
      filtered = filtered.filter(tx => tx.transaction_type === filters.type);
    }
    
    // Filtrar por búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(searchTerm) ||
        tx.transaction_type?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtrar por fecha
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = filters.dateRange[0].startOf('day');
      const endDate = filters.dateRange[1].endOf('day');
      
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.created_at);
        return txDate >= startDate && txDate <= endDate;
      });
    }
    
    setFilteredTransactions(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, transactions]);

  const getTransactionTypeColor = (type) => {
    const colors = {
      'CREDIT_PURCHASE': 'green',
      'BET_PLACEMENT': 'blue',
      'PRIZE_WIN': 'gold',
      'CREDIT_CONVERSION': 'purple',
      'WITHDRAWAL': 'cyan',
      'REFUND': 'orange'
    };
    return colors[type] || 'default';
  };

  const getTransactionTypeText = (type) => {
    const texts = {
      'CREDIT_PURCHASE': 'Recarga Créditos',
      'BET_PLACEMENT': 'Pronósticos',
      'PRIZE_WIN': 'Premio Ganado',
      'CREDIT_CONVERSION': 'Conversión',
      'WITHDRAWAL': 'Retiro',
      'REFUND': 'Reembolso'
    };
    return texts[type] || type;
  };

  const getAmountDisplay = (transaction) => {
    const amount = transaction.amount || 0;
    const isPositive = amount > 0;
    
    return (
      <Space>
        {isPositive ? (
          <ArrowUpOutlined style={{ color: '#52c41a' }} />
        ) : (
          <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
        )}
        <Text strong type={isPositive ? 'success' : 'danger'}>
          {isPositive ? '+' : ''}${Math.abs(amount).toLocaleString()} PTS
        </Text>
      </Space>
    );
  };

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => {
        if (!date) return '-';
        try {
          return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch {
          return date;
        }
      },
      width: 150,
    },
    {
      title: 'Tipo',
      dataIndex: 'transaction_type',
      key: 'type',
      render: (type) => (
        <Tag color={getTransactionTypeColor(type)}>
          {getTransactionTypeText(type)}
        </Tag>
      ),
      width: 120,
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc) => desc || '-',
    },
    {
      title: 'Monto (PTS)',
      key: 'amount',
      render: (_, record) => getAmountDisplay(record),
      width: 120,
      align: 'right',
    },
    {
      title: 'Créditos',
      key: 'credits',
      render: (_, record) => {
        const credits = record.credits_affected || 0;
        if (credits === 0) return '-';
        
        return (
          <Text strong type={credits > 0 ? 'success' : 'danger'}>
            {credits > 0 ? '+' : ''}{credits}
          </Text>
        );
      },
      width: 100,
      align: 'center',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (!status) return '-';
        
        const statusMap = {
          'completed': { color: 'green', text: 'Completado' },
          'pending': { color: 'orange', text: 'Pendiente' },
          'failed': { color: 'red', text: 'Fallido' },
          'cancelled': { color: 'default', text: 'Cancelado' },
        };
        
        const config = statusMap[status.toLowerCase()] || statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      width: 100,
    },
  ];

  // Función para el summary de la tabla
  const getTableSummary = (pageData) => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalCredits = 0;
    
    pageData.forEach(({ amount, credits_affected }) => {
      const safeAmount = Number(amount) || 0;
      const safeCredits = Number(credits_affected) || 0;

      if (safeAmount > 0) totalIncome += safeAmount;
      else totalExpense += Math.abs(safeAmount);
      
      if (safeCredits) {
        totalCredits += safeCredits;
      }
    });
    
    return (
      <Table.Summary.Row>
        <Table.Summary.Cell index={0} colSpan={2}>
          <Text strong>Resumen</Text>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={1}>
          <Text type="secondary">{filteredTransactions.length} transacciones</Text>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={2} align="right">
          <Space orientation="vertical" size="small">
            <Text type="success">Ingresos: +${totalIncome.toLocaleString()}</Text>
            <Text type="danger">Gastos: -${totalExpense.toLocaleString()}</Text>
          </Space>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={3} align="center">
          <Text strong type={totalCredits > 0 ? 'success' : totalCredits < 0 ? 'danger' : 'default'}>
            {totalCredits > 0 ? '+' : ''}{totalCredits} créditos
          </Text>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={4} />
      </Table.Summary.Row>
    );
  };

  return (
    <div>
      {/* Alerta de debug si no hay datos */}
      {(!transactions || transactions.length === 0) && !loading && (
        <Alert
          title="No hay transacciones"
          description={
            <div>
              <p>Puede ser porque:</p>
              <ul>
                <li>El usuario no tiene transacciones aún</li>
                <li>Hay un error de conexión con el backend</li>
                <li>Los datos no están en el formato esperado</li>
              </ul>
              <Button 
                type="primary" 
                onClick={refreshWallet}
                icon={<ReloadOutlined />}
                style={{ marginTop: 10 }}
              >
                Intentar de nuevo
              </Button>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input
              placeholder="Buscar en descripción..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              allowClear
            />
          </Col>
          
          <Col xs={24} md={6}>
            <Select
              placeholder="Tipo de transacción"
              style={{ width: '100%' }}
              allowClear
              value={filters.type}
              onChange={(value) => setFilters({ ...filters, type: value })}
            >
              <Option value="CREDIT_PURCHASE">Recarga Créditos</Option>
              <Option value="BET_PLACEMENT">Pronósticos</Option>
              <Option value="PRIZE_WIN">Premio</Option>
              <Option value="CREDIT_CONVERSION">Conversión</Option>
            </Select>
          </Col>
          
          <Col xs={24} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Desde', 'Hasta']}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              value={filters.dateRange}
            />
          </Col>
          
          <Col xs={24} md={2}>
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshWallet}
              loading={loading}
              block
            >
              Actualizar
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tabla */}
      <Table
        columns={columns}
        dataSource={filteredTransactions}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} transacciones`
        }}
        scroll={{ x: 800 }}
        locale={{ emptyText: 'No hay transacciones para mostrar' }}
        summary={getTableSummary}
      />
    </div>
  );
};

export default TransactionHistoryList;
