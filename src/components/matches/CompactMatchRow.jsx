// frontend/src/components/matches/CompactMatchRow.jsx
import React from 'react';
import { TeamOutlined } from '@ant-design/icons';
import { formatForInputUTC } from '../../utils/dateFormatter';
import './CompactMatchRow.css';

const getStatusAccent = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'in_progress' || s.includes('en curso')) return '#f59e0b';
  if (s === 'finished' || s.includes('finalizado')) return '#16a34a';
  if (s === 'cancelled' || s.includes('cancelado')) return '#dc2626';
  if (s === 'postponed' || s.includes('aplazado')) return '#7c3aed';
  return '#1677ff'; // scheduled
};

const teamLogo = (url, name) => (
  url ? (
    <img src={url} alt={name} className="cmr-logo" />
  ) : (
    <div className="cmr-logo cmr-logo--placeholder"><TeamOutlined /></div>
  )
);

const CompactMatchRow = ({ match, onClick }) => {
  const isFinished = String(match.status).toLowerCase().includes('finalizado') || match.status === 'finished';
  const isLive = String(match.status).toLowerCase().includes('en curso') || match.status === 'in_progress';
  const showScore = isFinished || isLive;

  const centerText = showScore
    ? `${match.home_score ?? 0} - ${match.away_score ?? 0}`
    : (formatForInputUTC(match.match_date)?.format('hh:mm a') || '--:--');

  return (
    <div
      className="compact-match-row"
      style={{ borderLeftColor: getStatusAccent(match.status) }}
      onClick={onClick}
    >
      <div className="cmr-team cmr-team--home">
        <span className="cmr-team-name">{match.home_team_name}</span>
        {teamLogo(match.home_team_logo, match.home_team_name)}
      </div>

      <div className="cmr-center">
        {isLive && <span className="cmr-live-dot" />}
        <span className={`cmr-center-text${showScore ? ' cmr-score' : ''}`}>{centerText}</span>
      </div>

      <div className="cmr-team cmr-team--away">
        {teamLogo(match.away_team_logo, match.away_team_name)}
        <span className="cmr-team-name">{match.away_team_name}</span>
      </div>
    </div>
  );
};

export default CompactMatchRow;
