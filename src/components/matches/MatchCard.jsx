// frontend/src/components/matches/MatchCard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Space, Tag, Typography, Badge, Skeleton } from 'antd';
import { 
  CalendarOutlined, TeamOutlined, EnvironmentOutlined, 
  HomeOutlined, FireOutlined, TrophyOutlined 
} from '@ant-design/icons';
import { formatDateTimeShort, formatForInputUTC } from '../../utils/dateFormatter';
import MatchActions from './MatchActions';
import competitionService from '../../services/competitionService';
import './MatchCard.css';

const { Text } = Typography;

// Mapear estados backend → UI
const STATUS_MAP = {
  scheduled: 'Programado',
  in_progress: 'En curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
  postponed: 'Aplazado'
};

const MatchCard = ({ match, roundName, size = 'default', showActions = true }) => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roundInfo, setRoundInfo] = useState(null);

  useEffect(() => {
    // Cargar informaci?n de equipos
    if (match.home_team && typeof match.home_team === 'object') {
      setHomeTeam(match.home_team);
    } else if (match.home_team_name || match.home_team_logo || match.home_team_id) {
      setHomeTeam({
        id: match.home_team_id,
        name: match.home_team_name || (match.home_team_id ? `Equipo ${match.home_team_id}` : 'Equipo'),
        logo_url: match.home_team_logo || match.home_logo || null,
        stadium: match.home_team_stadium || null,
        city: match.home_team_city || null
      });
    } else if (match.home_team_id) {
      fetchTeam(match.home_team_id, true);
    }

    if (match.away_team && typeof match.away_team === 'object') {
      setAwayTeam(match.away_team);
    } else if (match.away_team_name || match.away_team_logo || match.away_team_id) {
      setAwayTeam({
        id: match.away_team_id,
        name: match.away_team_name || (match.away_team_id ? `Equipo ${match.away_team_id}` : 'Equipo'),
        logo_url: match.away_team_logo || match.away_logo || null,
        stadium: match.away_team_stadium || null,
        city: match.away_team_city || null
      });
    } else if (match.away_team_id) {
      fetchTeam(match.away_team_id, false);
    }
    // Cargar información de jornada si no está disponible
    if (match.round && typeof match.round === 'object') {
      setRoundInfo(match.round);
    } else if (match.round_id && !roundName) {
      if (match.competition_id) {
        fetchRoundInfo(match.competition_id, match.round_id);
      } else {
        setRoundInfo({
          id: match.round_id,
          name: `Jornada ${match.round_id}`,
          round_number: match.round_number || match.round_id
        });
      }
    }
  }, [match, roundName]);

  const fetchTeam = async (teamId, isHome) => {
    setLoading(true);
    try {
      const res = await competitionService.getTeam(teamId);
      if (isHome) setHomeTeam(res.data);
      else setAwayTeam(res.data);
    } catch {
      const fallback = { 
        id: teamId, 
        name: `Equipo ${teamId}`, 
        stadium: null, 
        city: null, 
        logo_url: null 
      };
      if (isHome) setHomeTeam(fallback);
      else setAwayTeam(fallback);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoundInfo = async (competitionId, roundId) => {
    try {
      const res = await competitionService.getRound(competitionId, roundId);
      setRoundInfo(res.data);
    } catch (error) {
      console.warn(`No se pudo obtener jornada ${roundId}:`, error);
      setRoundInfo({
        id: roundId,
        name: `Jornada ${roundId}`,
        round_number: match.round_number || roundId
      });
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Fecha no disponible';
    const parsed = formatForInputUTC(date);
    return parsed ? formatDateTimeShort(parsed) : formatDateTimeShort(date);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'blue';     // Programado → azul
      case 'finished': return 'green';     // Finalizado → verde
      case 'in_progress': return 'orange'; // En curso → naranja
      case 'cancelled': return 'red';      // Cancelado → rojo
      case 'postponed': return 'yellow';   // Aplazado → amarillo
      default: return 'default';
    }
  };

  const renderTeam = (team) => (
    <div className="team-container">
      <div className="team-logo-container">
        {team?.logo_url ? (
          <img
            src={team.logo_url.startsWith('http')
              ? team.logo_url
              : `${apiBaseUrl}${team.logo_url.startsWith('/') ? '' : '/'}${team.logo_url}`}
            alt={team.name}
            className="team-logo"
          />
        ) : (
          <div className="team-logo-placeholder">
            <TeamOutlined />
          </div>
        )}
      </div>
      <Text className="team-name" strong>
        {team?.name || 'Equipo'}
      </Text>
    </div>
  );

  const stadium = match.stadium && match.stadium !== 'string' ? match.stadium : homeTeam?.stadium;
  const city = match.city && match.city !== 'string' ? match.city : homeTeam?.city;
  
  // Determinar nombre de la jornada
  const displayRoundName = roundName || roundInfo?.name || 
    (match.round_id ? `Jornada ${match.round_id}` : null);

  if (loading && (!homeTeam || !awayTeam)) {
    return (
      <Card className={`match-card ${size}`}>
        <Skeleton active />
      </Card>
    );
  }

  return (
    <Card 
      className={`match-card ${size}`} 
      hoverable 
      size={size === 'small' ? 'small' : 'default'}
    >
      {/* Badge EN VIVO */}
      {match.status === 'in_progress' && (
        <div className="live-badge">
          <FireOutlined spin /> EN VIVO
        </div>
      )}

      {/* Encabezado con información de jornada */}
      <div className="match-header">
        <div style={{ display: 'flex', alignItems: 'left', gap: 8 }}>
          <Tag color={getStatusColor(match.status)}>
            {STATUS_MAP[match.status] || match.status}
          </Tag>
          
          {/* Badge de jornada */}
          {displayRoundName && (
            <Badge
              count={`Jornada ${roundInfo?.round_number || match.round_number || match.round_id}`}
              style={{ 
                backgroundColor: roundInfo?.is_completed ? '#52c41a' : '#1890ff',
                cursor: 'help'
              }}
              title={`${displayRoundName}${roundInfo?.is_completed ? ' ✓ Completada' : ''}`}
            />
          )}
        </div>

        <Text type="secondary">
          <CalendarOutlined /> {formatDate(match.match_date)}
        </Text>
      </div>

      {/* Información adicional de jornada si está disponible */}
      {displayRoundName && (
        <div className="round-info" style={{ 
          marginBottom: 8, 
          padding: '6px 12px', 
          backgroundColor: match.round_is_completed ? '#f6ffed' : '#f0f9ff', 
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: `1px solid ${match.round_is_completed ? '#b7eb8f' : '#d0e9ff'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TrophyOutlined style={{ marginRight: 6, color: '#1890ff' }} />
            <Text style={{ fontSize: '0.85em', fontWeight: 'bold' }}>
              {displayRoundName}
            </Text>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {match.round_total_matches && (
              <Badge 
                count={`${match.round_matches_played || 0}/${match.round_total_matches}`}
                style={{ 
                  backgroundColor: '#f0f0f0',
                  color: '#666'
                }}
              />
            )}
            
            {match.round_is_completed && (
              <Badge 
                status="success" 
                text="Completada"
                style={{ fontSize: '0.75em' }}
              />
            )}
          </div>
        </div>
      )}


      {/* Equipos y marcador */}
      <div className="match-teams">
        <Row justify="space-around" align="middle">
          <Col>{renderTeam(homeTeam)}</Col>

          <Col className="vs-container">
            <Text style={{ color: '#666', fontSize: 14 }}>VS</Text>
            <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
              {match.status === 'scheduled' || !match.status 
                ? '0 - 0'
                : `${match.home_score || 0} - ${match.away_score || 0}`}
            </Text>
          </Col>

          <Col>{renderTeam(awayTeam)}</Col>
        </Row>
      </div>

      {/* Ubicación */}
      {(stadium || city) && (
        <div className="match-location">
          <Space>
            <HomeOutlined />
            <EnvironmentOutlined />
            <Text type="secondary">
              {stadium}{stadium && city && ', '}{city}
            </Text>
          </Space>
        </div>
      )}

      {/* Competencia (si está disponible) */}
      {match.competition_name && match.competition_name !== 'Sin competencia' && (
        <div className="competition-info" style={{ 
          marginTop: 8, 
          textAlign: 'center',
          padding: '4px 8px',
          backgroundColor: '#f6ffed',
          borderRadius: 4
        }}>
          <Text type="secondary" style={{ fontSize: '0.85em' }}>
            {match.competition_name}
          </Text>
        </div>
      )}

      {/* Acciones */}
      {showActions && (
        <div className="match-actions">
          <MatchActions matchId={match.id} showView showDropdown={false} />
        </div>
      )}
    </Card>
  );
};

export default MatchCard;

