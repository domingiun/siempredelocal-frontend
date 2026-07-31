// frontend/src/pages/matches/MatchesPage.jsx
import React, { useState, useEffect } from 'react';
import { Button, Typography, Empty, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import competitionService from '../../services/competitionService';
import MatchCard from '../../components/matches/MatchCard';
import { formatForInputUTC } from '../../utils/dateFormatter';
import './MatchesPage.css';

const { Text } = Typography;

const FINISHED_PAGE_SIZE = 30;

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Clave de agrupación por día (hora local, ya convertida desde UTC)
const dayKey = (match) => {
  const d = formatForInputUTC(match.match_date);
  return d ? d.format('YYYY-MM-DD') : null;
};

const getGroupLabel = (dayjsDate) => {
  const today = dayjs().startOf('day');
  const diff = dayjsDate.startOf('day').diff(today, 'day');
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return capitalize(dayjsDate.format('dddd D [de] MMMM'));
};

// Agrupa una lista (ya ordenada) de partidos en bloques por día,
// preservando el orden de aparición.
const groupByDay = (list) => {
  const groups = [];
  const byKey = new Map();
  list.forEach((match) => {
    const key = dayKey(match);
    if (!key) return;
    if (!byKey.has(key)) {
      const group = { key, date: formatForInputUTC(match.match_date), matches: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).matches.push(match);
  });
  return groups;
};

const sortAsc = (list) => [...list].sort((a, b) => {
  const aTime = formatForInputUTC(a.match_date)?.valueOf() ?? 0;
  const bTime = formatForInputUTC(b.match_date)?.valueOf() ?? 0;
  return aTime - bTime;
});

const sortDesc = (list) => [...list].sort((a, b) => {
  const aTime = formatForInputUTC(a.match_date)?.valueOf() ?? 0;
  const bTime = formatForInputUTC(b.match_date)?.valueOf() ?? 0;
  return bTime - aTime;
});

const MatchesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scheduled, setScheduled] = useState([]);
  const [live, setLive] = useState([]);
  const [finished, setFinished] = useState([]);
  const [finishedSkip, setFinishedSkip] = useState(0);
  const [finishedHasMore, setFinishedHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [schedRes, liveRes, finRes] = await Promise.all([
        competitionService.getMatches({ status: 'Programado', order: 'asc', limit: 100 }),
        competitionService.getMatches({ status: 'En curso', order: 'asc', limit: 50 }),
        competitionService.getMatches({ status: 'Finalizado', order: 'desc', limit: FINISHED_PAGE_SIZE, skip: 0 }),
      ]);
      setScheduled(schedRes.data || []);
      setLive(liveRes.data || []);
      const finData = finRes.data || [];
      setFinished(finData);
      setFinishedSkip(0);
      setFinishedHasMore(finData.length === FINISHED_PAGE_SIZE);
    } catch (error) {
      message.error('Error al cargar los partidos');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFinished = async () => {
    setLoadingMore(true);
    try {
      const nextSkip = finishedSkip + FINISHED_PAGE_SIZE;
      const res = await competitionService.getMatches({
        status: 'Finalizado', order: 'desc', limit: FINISHED_PAGE_SIZE, skip: nextSkip,
      });
      const data = res.data || [];
      setFinished((prev) => [...prev, ...data]);
      setFinishedSkip(nextSkip);
      setFinishedHasMore(data.length === FINISHED_PAGE_SIZE);
    } catch (error) {
      message.error('Error al cargar más resultados');
    } finally {
      setLoadingMore(false);
    }
  };

  const todayKey = dayjs().format('YYYY-MM-DD');

  // Partidos de hoy (cualquier estado) van primero, sin importar el grupo al que pertenezcan
  const today = sortAsc(
    [...scheduled, ...live, ...finished].filter((m) => dayKey(m) === todayKey)
  );

  const programados = groupByDay(
    sortAsc(scheduled.filter((m) => dayKey(m) !== todayKey))
  );

  const resultados = groupByDay(
    sortDesc([...live, ...finished].filter((m) => dayKey(m) !== todayKey))
  );

  const isEmpty = !loading && scheduled.length === 0 && live.length === 0 && finished.length === 0;

  const renderCards = (list) => (
    <div className="matches-day-cards">
      {list.map((match) => (
        <div
          key={match.id}
          className="matches-card-click"
          onClick={() => navigate(`/matches/${match.id}`)}
        >
          <MatchCard match={match} roundName={match.round_name} showActions={false} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="matches-page" style={{ padding: '16px' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : isEmpty ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Empty description="No hay partidos registrados" />
        </div>
      ) : (
        <>
          {today.length > 0 && (
            <section className="matches-day-group matches-day-group--today">
              <div className="matches-day-header matches-day-header--today">
                <span className="matches-day-badge">HOY</span>
                <Text strong>{capitalize(dayjs().format('dddd D [de] MMMM'))}</Text>
              </div>
              {renderCards(today)}
            </section>
          )}

          {programados.length > 0 && (
            <>
              <div className="matches-section-label">Próximos partidos</div>
              {programados.map((group) => (
                <section key={`p-${group.key}`} className="matches-day-group">
                  <div className="matches-day-header">
                    <Text strong>{getGroupLabel(group.date)}</Text>
                  </div>
                  {renderCards(group.matches)}
                </section>
              ))}
            </>
          )}

          {resultados.length > 0 && (
            <>
              <div className="matches-section-label">Resultados</div>
              {resultados.map((group) => (
                <section key={`r-${group.key}`} className="matches-day-group">
                  <div className="matches-day-header">
                    <Text strong>{getGroupLabel(group.date)}</Text>
                  </div>
                  {renderCards(group.matches)}
                </section>
              ))}
            </>
          )}

          {finishedHasMore && (
            <div style={{ textAlign: 'center', margin: '16px 0 24px' }}>
              <Button onClick={loadMoreFinished} loading={loadingMore}>
                Cargar más resultados
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MatchesPage;
