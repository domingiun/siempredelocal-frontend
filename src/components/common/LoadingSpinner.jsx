//frontend/src/components/common/LoadingSpinner.jsx
import React from 'react';
import { Spin, Space } from 'antd';

const LoadingSpinner = ({ size = 'large', tip = 'Cargando...' }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '200px' 
    }}>
      <Space orientation="vertical" align="center">
        <Spin size={size} tip={tip} />
      </Space>
    </div>
  );
};

export default LoadingSpinner;
