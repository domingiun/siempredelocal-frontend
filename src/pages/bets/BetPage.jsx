// frontend/src/pages/bets/BetPage.jsx
import React from 'react';
import { Row, Col } from 'antd';
import BetDateList from '../../components/bets/BetDateList';
import WalletBalance from '../../components/wallet/WalletBalance';
import './BetPage.css';

const BetPage = () => {
  return (
    <div className="bet-page">
      <div className="bet-hero">
        <div>
          <div className="bet-hero__eyebrow">pronósticos deportivos</div>
          <div className="bet-hero__title">Pronósticos de la semana</div>
          <div className="bet-hero__subtitle">
            Elige 10 marcadores, gana puntos y compite por premios en Puntos.
          </div>
          <div className="bet-hero__meta">
            <span>1 credito por apuesta</span>
            <span>10 partidos por fecha</span>
            <span>Resultados en tiempo real</span>
          </div>
        </div>
        <img
          className="bet-hero__logo"
          src="/siempredelocal-logo.png"
          alt="Siempre de Local"
        />
      </div>

      <Row gutter={[24, 24]} className="bet-page__grid">
        
        <Col xs={24} lg={14}>
          <div className="bet-panel bet-panel--list">
            <BetDateList />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default BetPage;
