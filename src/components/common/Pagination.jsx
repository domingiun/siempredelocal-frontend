import React from 'react';
import { Pagination as AntPagination, Select, Space, Typography } from 'antd';
import { 
  LeftOutlined, RightOutlined, 
  DoubleLeftOutlined, DoubleRightOutlined 
} from '@ant-design/icons';
import './Pagination.css';

const { Text } = Typography;
const { Option } = Select;

const Pagination = ({ 
  current, 
  pageSize, 
  total, 
  onChange, 
  onPageSizeChange,
  showSizeChanger = true,
  showQuickJumper = true,
  showTotal = true,
  disabled = false,
  pageSizeOptions = ['10', '20', '50', '100'],
  simple = false,
  align = 'right' // 'left', 'center', 'right'
}) => {
  const itemRender = (_, type, originalElement) => {
    if (type === 'prev') {
      return (
        <div className="pagination-icon">
          <LeftOutlined />
        </div>
      );
    }
    if (type === 'next') {
      return (
        <div className="pagination-icon">
          <RightOutlined />
        </div>
      );
    }
    if (type === 'jump-prev') {
      return (
        <div className="pagination-icon">
          <DoubleLeftOutlined />
        </div>
      );
    }
    if (type === 'jump-next') {
      return (
        <div className="pagination-icon">
          <DoubleRightOutlined />
        </div>
      );
    }
    return originalElement;
  };

  const getAlignmentClass = () => {
    switch (align) {
      case 'left': return 'justify-start';
      case 'center': return 'justify-center';
      case 'right': return 'justify-end';
      default: return 'justify-end';
    }
  };

  if (simple) {
    return (
      <div className={`pagination-wrapper ${getAlignmentClass()}`}>
        <AntPagination
          current={current}
          pageSize={pageSize}
          total={total}
          onChange={onChange}
          simple
          disabled={disabled}
          showSizeChanger={false}
          showQuickJumper={false}
          showTotal={false}
        />
      </div>
    );
  }

  return (
    <div className={`pagination-wrapper ${getAlignmentClass()}`}>
      <Space size="middle" wrap>
        {showTotal && total > 0 && (
          <div className="pagination-total">
            <Text type="secondary">
              Total: <Text strong>{total}</Text> registros
            </Text>
          </div>
        )}
        
        {showSizeChanger && (
          <div className="pagination-size-changer">
            <Space>
              <Text type="secondary">Mostrar:</Text>
              <Select
                value={pageSize}
                onChange={onPageSizeChange}
                size="small"
                style={{ width: 80 }}
                disabled={disabled}
              >
                {pageSizeOptions.map(size => (
                  <Option key={size} value={Number(size)}>
                    {size}
                  </Option>
                ))}
              </Select>
              <Text type="secondary">por página</Text>
            </Space>
          </div>
        )}

        <AntPagination
          current={current}
          pageSize={pageSize}
          total={total}
          onChange={onChange}
          itemRender={itemRender}
          disabled={disabled}
          showSizeChanger={false}
          showQuickJumper={showQuickJumper}
          showTotal={false}
          size="small"
        />

        {showQuickJumper && (
          <div className="pagination-quick-jumper">
            <Space>
              <Text type="secondary">Ir a:</Text>
              <Select
                value={current}
                onChange={value => onChange(value, pageSize)}
                size="small"
                style={{ width: 80 }}
                disabled={disabled}
              >
                {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === Math.ceil(total / pageSize) || 
                    Math.abs(page - current) <= 2
                  )
                  .map(page => (
                    <Option key={page} value={page}>
                      {page}
                    </Option>
                  ))
                }
              </Select>
            </Space>
          </div>
        )}
      </Space>
    </div>
  );
};

export default Pagination;
