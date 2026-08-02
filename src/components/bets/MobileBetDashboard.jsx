// frontend/src/components/bets/MobileBetDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClockCircleOutlined, TrophyOutlined, RightOutlined
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import betService from '../../services/betService';
import { calculateTimeRemaining } from '../../utils/betCalculations';
import './MobileBetDashboard.css';

const MobileBetDashboard = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [activeBetDate, setActiveBetDate] = useState(null);

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

      {/* ── CTA FECHA ACTIVA — pronósticos gratuitos ── */}
      {activeBetDate && (
        <button
          className="mbd__bet-cta"
          onClick={() => navigate(`/bets/${activeBetDate.id}/place`)}
          aria-label="Ir a pronosticar"
        >
          <div className="mbd__bet-info">
            <span className="mbd__bet-prize">
              <TrophyOutlined style={{ marginRight: 4, color: '#fadb14' }} />
              {(
                activeBetDate.total_prize ||
                (activeBetDate.prize_PTS || 0) + (activeBetDate.accumulated_prize || 0) ||
                activeBetDate.prize_cop ||
                0
              ).toLocaleString()}
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
            <span className="mbd__bet-action-label">Pronosticar</span>
            <RightOutlined />
          </div>
        </button>
      )}
    </div>
  );
};

export default MobileBetDashboard;
