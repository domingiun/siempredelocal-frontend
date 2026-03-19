// frontend/src/pages/bets/BetDateDetail.jsx
import React, { useState } from 'react';
import { Tabs, Card, Alert } from 'antd';
import { useParams } from 'react-router-dom';
import BetDateInfo from '../../components/bets/BetDateInfo';
import PlaceBetForm from '../../components/bets/PlaceBetForm';
import BetRanking from '../../components/bets/BetRanking';

const BetDateDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('bet');

  if (!id) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          title="ID no proporcionado"
          description="No se proporcionó un ID de fecha válido"
          type="error"
          showIcon
        />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'bet',
      label: 'Hacer Pronósticos',
      children: <PlaceBetForm />,
    },
    {
      key: 'ranking',
      label: 'Ranking',
      children: <BetRanking betDateId={id} />,
    },
    {
      key: 'info',
      label: 'Información',
      children: <BetDateInfo betDateId={id} />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
};

export default BetDateDetail;

