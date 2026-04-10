// frontend/src/pages/bets/BetPage.jsx
import React from 'react';
import { Row, Col } from 'antd';
import BetDateList from '../../components/bets/BetDateList';
import WalletBalance from '../../components/wallet/WalletBalance';
import MobileBetDashboard from '../../components/bets/MobileBetDashboard';
import logo from '../../assets/logo.png';
import './BetPage.css';

const BetPage = () => {
  return (
    <div className="bet-page">
      {/* Dashboard compacto solo en móvil: créditos + CTA fecha activa */}
      <MobileBetDashboard />

      <div className="bet-hero bet-hero--desktop">
        {/* Glow orbs de fondo */}
        <div className="bet-hero__orb bet-hero__orb--green" />
        <div className="bet-hero__orb bet-hero__orb--blue" />

        <div className="bet-hero__content">
          <div className="bet-hero__eyebrow">⚽ Pronósticos Deportivos</div>
          <div className="bet-hero__title">Predice. Compite. <span className="bet-hero__title--accent">Gana.</span></div>
          <div className="bet-hero__subtitle">
            Elige los 10 marcadores de la fecha, acumula puntos y llévate el premio del pozo.
          </div>
          <div className="bet-hero__meta">
            <span>🎯 1 crédito por fecha</span>
            <span>📋 10 partidos por fecha</span>
            <span>⚡ Resultados en tiempo real</span>
          </div>
        </div>

        <div className="bet-hero__logo-wrap">
          <div className="bet-hero__logo-glow" />
          <img
            className="bet-hero__logo"
            src={logo}
            alt="Siempre de Local"
          />
        </div>
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
