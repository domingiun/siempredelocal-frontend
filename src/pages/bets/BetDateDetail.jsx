// frontend/src/pages/bets/BetDateDetail.jsx
import React, { useState } from 'react';
import { Alert } from 'antd';
import { useParams } from 'react-router-dom';
import BetDateInfo from '../../components/bets/BetDateInfo';
import PlaceBetForm from '../../components/bets/PlaceBetForm';
import BetRanking from '../../components/bets/BetRanking';
import './BetDateDetail.css';

const TABS = [
  { key: 'bet',     label: 'Hacer Pronósticos' },
  { key: 'ranking', label: 'Ranking'            },
  { key: 'info',    label: 'Información'        },
];

const BetDateDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('bet');

  if (!id) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          description="No se proporcionó un ID de fecha válido"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="bdd">
      {/* ── Barra de pestañas ── */}
      <div className="bdd__tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`bdd__tab${activeTab === tab.key ? ' bdd__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Contenido ── */}
      <div className="bdd__content">
        {activeTab === 'bet'     && <PlaceBetForm />}
        {activeTab === 'ranking' && <BetRanking betDateId={id} />}
        {activeTab === 'info'    && <BetDateInfo betDateId={id} />}
      </div>
    </div>
  );
};

export default BetDateDetail;
