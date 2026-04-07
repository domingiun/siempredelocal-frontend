// frontend/src/components/bets/MobileBetDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import {
  FireOutlined, WalletOutlined, RightOutlined,
  ClockCircleOutlined, TrophyOutlined
} from '@ant-design/icons';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import betService from '../../services/betService';
import { calculateTimeRemaining } from '../../utils/betCalculations';
import './MobileBetDashboard.css';

const MobileBetDashboard = () => {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [activeBetDate, setActiveBetDate] = useState(null);

  const credits = wallet?.credits ?? 0;
  const hasCredits = credits > 0;

  useEffect(() => {
    betService.getBetDates()
      .then(res => {
        const dates = res.data || [];
        const open = dates.find(d => d.status === 'open' || d.is_betting_open === true);
        setActiveBetDate(open || null);
      })
      .catch(() => {});
  }, []);

  return (
    <div className={`mbd ${isDark ? 'mbd--dark' : ''}`} aria-label="Panel rápido móvil">

      {/* ── BARRA DE CRÉDITOS ── */}
      <div className={`mbd__credits-bar ${hasCredits ? '' : 'mbd__credits-bar--empty'}`}>
        <div className="mbd__credits-left">
          <FireOutlined className="mbd__fire-icon" />
          <span className="mbd__credits-num">{credits}</span>
          <span className="mbd__credits-label">
            crédito{credits !== 1 ? 's' : ''}
          </span>
        </div>

        {hasCredits ? (
          <span className="mbd__credits-ok">✓ Listo para apostar</span>
        ) : (
          <Button
            type="primary"
            danger
            size="small"
            icon={<WalletOutlined />}
            onClick={() => navigate('/wallet')}
          >
            Recargar
          </Button>
        )}
      </div>

      {/* ── CTA FECHA ACTIVA ── */}
      {activeBetDate && (
        <button
          className="mbd__bet-cta"
          onClick={() =>
            navigate(hasCredits ? `/bets/${activeBetDate.id}/place` : '/wallet')
          }
          aria-label={hasCredits ? 'Ir a pronosticar' : 'Solicitar créditos'}
        >
          <div className="mbd__bet-info">
            <span className="mbd__bet-prize">
              <TrophyOutlined style={{ marginRight: 4, color: '#fadb14' }} />
              {(
                activeBetDate.total_prize ||
                (activeBetDate.prize_PTS || 0) + (activeBetDate.accumulated_prize || 0) ||
                activeBetDate.prize_cop ||
                0
              ).toLocaleString()} PTS
            </span>
            <span className="mbd__bet-name">
              {activeBetDate.name || `Fecha #${activeBetDate.id}`}
            </span>
            <span className="mbd__bet-time">
              <ClockCircleOutlined style={{ marginRight: 3 }} />
              {calculateTimeRemaining(activeBetDate)}
            </span>
          </div>
          <div className="mbd__bet-arrow">
            <span className="mbd__bet-action-label">
              {hasCredits ? 'Pronosticar' : 'Ver fecha'}
            </span>
            <RightOutlined />
          </div>
        </button>
      )}

      {/* ── BANNER SIN CRÉDITOS ── */}
      {!hasCredits && (
        <button
          className="mbd__no-credits-banner"
          onClick={() => navigate('/wallet')}
          aria-label="Solicitar créditos"
        >
          <WalletOutlined className="mbd__no-credits-icon" />
          <span>Solicita créditos para participar en la fecha</span>
          <RightOutlined className="mbd__no-credits-arrow" />
        </button>
      )}
    </div>
  );
};

export default MobileBetDashboard;
