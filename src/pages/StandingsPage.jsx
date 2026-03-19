// frontend/src/pages/StandingsPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import CompetitionStandings from '../components/competitions/CompetitionStandings';

const StandingsPage = () => {
  const { competitionId } = useParams();
  
  return (
    <div style={{ padding: '24px' }}>
      <CompetitionStandings competitionId={competitionId} />
    </div>
  );
};

export default StandingsPage;
