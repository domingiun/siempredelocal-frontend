// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Space, Tag,
  Progress, Button, Avatar, Typography, Switch
} from 'antd';
import {
  TrophyOutlined, TeamOutlined, CalendarOutlined,
  EyeOutlined, FireOutlined, ThunderboltOutlined,
  RocketOutlined, CrownOutlined, StarOutlined, WalletOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import competitionService from '../services/competitionService';
import betService from '../services/betService';
import api from '../services/api';
import userService from '../services/userService';
import { formatDateTimeShortUTC } from '../utils/dateFormatter';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const [loading, setLoading] = useState(true);
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  const [competitions, setCompetitions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [betdates, setBetdates] = useState([]);
  const [betdateWinners, setBetdateWinners] = useState([]);
  const [betdateMatches, setBetdateMatches] = useState([]);

  const [stats, setStats] = useState({
    totalCompetitions: 0,
    activeCompetitions: 0,
    totalTeams: 0,
    totalMatches: 0,
    recentMatches: [],
    activeUsers: 0,
    bettingUsers: 0,
    lastActivePrize: 0,
    accumulatedPrize: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);


  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        competitionsRes,
        teamsRes,
        matchesRes,
        betdatesRes,
        betStatsRes,
        financialRes
      ] = await Promise.allSettled([
        competitionService.getCompetitions({ limit: 100 }),
        competitionService.getTeams(),
        competitionService.getMatches({ limit: 100, order: 'desc' }),
        betService.getBetDates(),
        betService.getBetStats(),
        betService.getFinancialSummary(30)
      ]);

      const competitions = competitionsRes.status === 'fulfilled' ? (competitionsRes.value.data || []) : [];
      const teams = teamsRes.status === 'fulfilled' ? (teamsRes.value.data || []) : [];
      const matches = matchesRes.status === 'fulfilled' ? (matchesRes.value.data || []) : [];
      const betdates = betdatesRes.status === 'fulfilled' ? (betdatesRes.value.data || []) : [];
      const betStats = betStatsRes.status === 'fulfilled' ? (betStatsRes.value.data || {}) : {};
      const financial = financialRes.status === 'fulfilled' ? (financialRes.value.data || {}) : {};

      const getMatchTime = (match) => {
        const raw = match?.updated_at || match?.match_date || match?.date || match?.start_datetime || match?.created_at;
        const time = raw ? new Date(raw).getTime() : NaN;
        return Number.isFinite(time) ? time : 0;
      };

      const finishedMatches = matches.filter(match => {
        const statusLower = String(match?.status || '').toLowerCase();
        return statusLower.includes('finalizado') || statusLower === 'finished';
      });

      const recentMatches = finishedMatches
        .slice()
        .sort((a, b) => getMatchTime(b) - getMatchTime(a))
        .slice(0, 5);

      const activeCompetitions = competitions.filter(c =>
        c.status === 'En curso' || c.status === 'Programado'
      ).length;

      setCompetitions(competitions);
      setTeams(teams);
      setBetdates(betdates);

      const activeBetdates = betdates.filter(bd => bd.status === 'open');
      const latestActiveBetdate = activeBetdates
        .slice()
        .sort((a, b) => new Date(b.start_datetime || b.close_datetime || 0) - new Date(a.start_datetime || a.close_datetime || 0))[0];
      const lastActivePrize = latestActiveBetdate
        ? (latestActiveBetdate.prize_cop || 0) + (latestActiveBetdate.accumulated_prize || 0)
        : 0;
      const accumulatedPrize = betdates.reduce((sum, bd) => sum + (bd.accumulated_prize || 0), 0);

      setStats({
        totalCompetitions: competitions.length,
        activeCompetitions,
        totalTeams: teams.length,
        totalMatches: matches.length,
        recentMatches,
        activeUsers: 0,
        bettingUsers: financial.active_users_count || 0,
        lastActivePrize,
        accumulatedPrize: betStats.total_prize_pool ?? accumulatedPrize
      });

      try {
        const systemStatsRes = await api.get('/admin/system/stats');
        const activeUsers = systemStatsRes?.data?.database?.active_users ?? 0;
        setStats(prev => ({ ...prev, activeUsers }));
      } catch (error) {
        try {
          const usersRes = await api.get('/users/');
          const users = usersRes?.data || [];
          setStats(prev => ({ ...prev, activeUsers: users.length }));
        } catch (fallbackError) {
          setStats(prev => ({ ...prev, activeUsers: 0 }));
        }
      }

      const finishedBetdates = betdates
        .filter(bd => bd.status === 'finished')
        .sort((a, b) => new Date(b.close_datetime || b.start_datetime || 0) - new Date(a.close_datetime || a.start_datetime || 0))
        .slice(0, 5);

      const winners = await Promise.all(
        finishedBetdates.map(async (bd) => {
          try {
            const rankingRes = await betService.getRanking(bd.id, { silent404: true });
            const ranking = rankingRes?.data?.data?.ranking || [];
            const winner = ranking[0];
            let winnerAvatarUrl = null;
            if (winner?.user_id) {
              try {
                const userRes = await userService.getUserById(winner.user_id);
                winnerAvatarUrl = userRes?.data?.avatar_url || null;
              } catch (avatarError) {
                winnerAvatarUrl = null;
              }
            }
            return {
              betdate_id: bd.id,
              betdate_name: bd.name,
              winner: winner?.username || winner?.user_name || 'Sin ganador',
              winner_user_id: winner?.user_id ?? null,
              winner_avatar_url: winnerAvatarUrl,
              points: winner?.points ?? 0,
              total_prize:
                rankingRes?.data?.data?.prize_paid_total ??
                rankingRes?.data?.data?.total_prize ??
                ((bd.prize_cop || 0) + (bd.accumulated_prize || 0)),
              qualifies: rankingRes?.data?.data?.qualifies_for_prize ?? false
            };
          } catch (e) {
            return {
              betdate_id: bd.id,
              betdate_name: bd.name,
              winner: 'Pendiente',
              winner_user_id: null,
              winner_avatar_url: null,
              points: null,
              total_prize: (bd.prize_cop || 0) + (bd.accumulated_prize || 0),
              qualifies: false
            };
          }
        })
      );
      setBetdateWinners(winners);

      const betdatesForMatches = betdates
        .slice()
        .sort((a, b) => new Date(b.start_datetime || b.close_datetime || 0) - new Date(a.start_datetime || a.close_datetime || 0))
        .slice(0, 1);

      const betdateMatchesData = await Promise.all(
        betdatesForMatches.map(async (bd) => {
          try {
            const detailsRes = await betService.getBetDateDetails(bd.id);
            const details = detailsRes?.data || {};
            const matchesSorted = (details.matches || [])
              .slice()
              .sort((a, b) => new Date(a.match_date || 0) - new Date(b.match_date || 0));

            const matchesWithScores = await Promise.all(
              matchesSorted.map(async (m) => {
                const statusLower = String(m.status || '').toLowerCase();
                const needsScore =
                  (statusLower.includes('finalizado') || statusLower === 'finished' || statusLower.includes('curso')) &&
                  extractScores(m).hasScore === false;
                if (!needsScore) return m;
                try {
                  const matchRes = await competitionService.getMatch(m.id);
                  return { ...m, ...matchRes.data };
                } catch (err) {
                  return m;
                }
              })
            );
            return {
              betdate_id: bd.id,
              betdate_name: bd.name,
              status: bd.status,
              matches: matchesWithScores
            };
          } catch (e) {
            return { betdate_id: bd.id, betdate_name: bd.name, status: bd.status, matches: [] };
          }
        })
      );
      setBetdateMatches(betdateMatchesData);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarSrc = (avatarUrl) => {
    if (!avatarUrl) return undefined;
    return avatarUrl.startsWith('http') ? avatarUrl : `${apiBaseUrl}${avatarUrl}`;
  };

  // Configuración de colores con buen contraste
  const statusConfig = {
    'Programado': {
      label: 'Programado',
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : '#bae7ff',
      borderColor: isDark ? 'rgba(59, 130, 246, 0.45)' : '#1890ff',
      textColor: isDark ? '#93c5fd' : '#003a8c',
      tagColor: 'blue'
    },
    'Finalizado': {
      label: 'Finalizado',
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : '#cffab6',
      borderColor: isDark ? 'rgba(34, 197, 94, 0.45)' : '#88d160',
      textColor: isDark ? '#86efac' : '#589139',
      tagColor: 'green'
    },
    'En Juego': {
      label: 'En Juego',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#d9f7be',
      borderColor: isDark ? 'rgba(16, 185, 129, 0.45)' : '#52c41a',
      textColor: isDark ? '#6ee7b7' : '#135200',
      tagColor: 'green'
    },
    'Cancelado': {
      label: 'Cancelado',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#ffccc7',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.45)' : '#f5222d',
      textColor: isDark ? '#fca5a5' : '#820014',
      tagColor: 'red'
    }
  };

  const getMatchStatusInfo = (status) => {
    if (!status) return {
      label: 'Desconocido',
      backgroundColor: isDark ? '#111b2a' : '#f5f5f5',
      borderColor: isDark ? '#1f2b3a' : '#d9d9d9',
      textColor: isDark ? '#e6edf3' : '#000000',
      tagColor: 'default'
    };

    const statusLower = String(status).toLowerCase().trim();

    if (statusLower.includes('programado') || statusLower === 'scheduled') {
      return statusConfig['Programado'];
    }
    if (statusLower.includes('finalizado') || statusLower === 'finished') {
      return statusConfig['Finalizado'];
    }
    if (statusLower.includes('curso') || statusLower.includes('progress')) {
      return statusConfig['En Juego'];
    }
    if (statusLower.includes('aplazado') || statusLower === 'postponed') {
      return {
        label: 'Aplazado',
        backgroundColor: isDark ? 'rgba(249, 115, 22, 0.18)' : '#fff7e6',
        borderColor: isDark ? 'rgba(249, 115, 22, 0.45)' : '#fa8c16',
        textColor: isDark ? '#fdba74' : '#873800',
        tagColor: 'orange'
      };
    }
    if (statusLower.includes('cancelado') || statusLower === 'cancelled') {
      return statusConfig['Cancelado'];
    }

    return {
      label: status,
      backgroundColor: isDark ? '#111b2a' : '#f5f5f5',
      borderColor: isDark ? '#1f2b3a' : '#d9d9d9',
      textColor: isDark ? '#e6edf3' : '#000000',
      tagColor: 'default'
    };
  };

  const getBetDateStatusStyle = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'open' || value.includes('abierta')) {
      return {
        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : undefined,
        borderColor: isDark ? 'rgba(34, 197, 94, 0.45)' : undefined,
        color: isDark ? '#86efac' : undefined
      };
    }
    if (value === 'finished' || value.includes('finalizada')) {
      return {
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : undefined,
        borderColor: isDark ? 'rgba(59, 130, 246, 0.45)' : undefined,
        color: isDark ? '#93c5fd' : undefined
      };
    }
    if (value === 'closed' || value.includes('cerrada')) {
      return {
        backgroundColor: isDark ? 'rgba(249, 115, 22, 0.18)' : undefined,
        borderColor: isDark ? 'rgba(249, 115, 22, 0.45)' : undefined,
        color: isDark ? '#fdba74' : undefined
      };
    }
    return isDark
      ? { backgroundColor: '#111b2a', borderColor: '#1f2b3a', color: '#e6edf3' }
      : undefined;
  };

  const getResultTagStyle = () => (
    isDark
      ? { backgroundColor: '#111b2a', borderColor: '#1f2b3a', color: '#e6edf3' }
      : undefined
  );

  const parseScoreText = (value) => {
    if (!value) return null;
    const text = String(value);
    const match = text.match(/(\d+)\s*[-:]\s*(\d+)/);
    if (!match) return null;
    return { home: Number(match[1]), away: Number(match[2]) };
  };

  const extractScores = (match) => {
    const directHome = match.home_score ?? match.home_team_score ?? match.home_goals ?? match.home_score_ft;
    const directAway = match.away_score ?? match.away_team_score ?? match.away_goals ?? match.away_score_ft;
    const homeNum = Number(directHome);
    const awayNum = Number(directAway);
    if (Number.isFinite(homeNum) && Number.isFinite(awayNum)) {
      return { home: homeNum, away: awayNum, hasScore: true };
    }
    const fromText =
      parseScoreText(match.result) ||
      parseScoreText(match.score) ||
      parseScoreText(match.final_score);
    if (fromText) {
      return { home: fromText.home, away: fromText.away, hasScore: true };
    }
    return { home: null, away: null, hasScore: false };
  };

  const getDisplayScore = (match) => {
    const status = String(match.status || '').toLowerCase();
    const extracted = extractScores(match);
    if (status.includes('programado') || status === 'scheduled') {
      return { home: 0, away: 0, hasScore: true };
    }
    if (status.includes('finalizado') || status === 'finished' || status === 'completed') {
      return extracted.hasScore ? extracted : { home: 0, away: 0, hasScore: true };
    }
    if (status.includes('curso') || status.includes('progress') || status === 'in_progress') {
      return extracted.hasScore ? extracted : { home: 0, away: 0, hasScore: true };
    }
    return extracted.hasScore ? extracted : { home: 0, away: 0, hasScore: true };
  };

  const getTeamLabel = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.name || value.team_name || value.label || '';
    return String(value);
  };

  const competitionColumns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      render: (text, record) => (
        <Space orientation="vertical" size={0}>
          <strong>{text}</strong>
          <small>{record.season}</small>
        </Space>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      render: status => {
        const statusInfo = getMatchStatusInfo(status);
        return (
          <Tag 
            color={statusInfo.tagColor}
            style={{
              fontWeight: 'bold',
              border: `1px solid ${statusInfo.borderColor}`,
              color: statusInfo.textColor,
              backgroundColor: statusInfo.backgroundColor
            }}
          >
            {statusInfo.label}
          </Tag>
        );
      }
    },
    {
      title: 'Acción',
      responsive: ['md'],
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/competitions/${record.id}`)}
        >
          Ver
        </Button>
      )
    }
  ];

  const winnersColumns = [
    {
      title: 'Fecha',
      dataIndex: 'betdate_name',
      key: 'betdate_name',
      width: 90,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Pronosticador(a)',
      dataIndex: 'winner',
      key: 'winner',
      width: 150,
      ellipsis: true,
      render: (text, record) => (
        <Space size={2} style={{ minWidth: 0 }}>
          <Avatar
            size={20}
            src={getAvatarSrc(record.winner_avatar_url)}
          >
            {text?.charAt(0)?.toUpperCase()}
          </Avatar>
          <span
            style={{
              fontSize: '12px',
              display: 'inline-block',
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={text}
          >
            {text}
          </span>
          <span className="winner-points-mobile">
            • {record.points ?? 0} pts
          </span>
        </Space>
      )
    },
    {
      title: 'Puntos',
      dataIndex: 'points',
      key: 'points',
      responsive: ['md'],
      width: 90,
      align: 'center',
      render: (value) => (value === null ? '-' : value)
    },
    {
      title: 'Premio',
      dataIndex: 'total_prize',
      key: 'total_prize',
      width: 110,
      align: 'right',
      render: (value) => (
        <span style={{ display: 'inline-block', width: '100%', textAlign: 'right', fontSize: '12px' }}>
          ${Number(value || 0).toLocaleString()}
        </span>
      )
    }
  ];

  const competitionsPercent = stats.totalCompetitions
    ? (stats.activeCompetitions / stats.totalCompetitions) * 100
    : 0;
  const competitionsPercentRounded = Number(competitionsPercent.toFixed(2));

  return (
    <div className={isDark ? 'dashboard-shell dashboard-shell--dark' : 'dashboard-shell'}>
      <style>{`
        .dashboard-shell {
          padding: 24px;
          background: radial-gradient(1100px 520px at 10% -10%, #e7fff3 0%, #f6fff9 35%, #ffffff 70%);
          min-height: 100vh;
        }
        .dashboard-shell--dark {
          background: radial-gradient(1200px 600px at 10% -10%, #0c141f 0%, #0a0f16 50%, #0a0f14 100%);
          color: #e6edf3;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .dashboard-title {
          margin: 0;
          letter-spacing: -0.3px;
        }
        .dashboard-subtitle {
          color: #5f6b7a;
        }
        .dashboard-shell--dark .dashboard-subtitle {
          color: #9fb0c2;
        }
        .dash-stat {
          border: 1px solid #e4f3ea;
          border-left: 4px solid #10b981;
          background: linear-gradient(135deg, #ffffff 0%, #f1fff7 100%);
          box-shadow: 0 10px 28px rgba(16, 185, 129, 0.12);
        }
        .dashboard-shell--dark .dash-stat {
          border-color: #1f2b3a;
          background: linear-gradient(135deg, #0f1824 0%, #0b141e 100%);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
        }
        .dashboard-shell--dark .dash-stat .ant-statistic-title {
          color: #cbd5e1;
        }
        .dashboard-shell--dark .dash-stat .ant-statistic-content {
          color: #e6edf3;
        }
        .dashboard-shell--dark .dash-stat .ant-progress-text,
        .dashboard-shell--dark .dash-stat .ant-progress .ant-progress-text {
          color: #cbd5e1 !important;
        }
        .dash-panel {
          border: 1px solid #e9f2ea;
          box-shadow: 0 14px 34px rgba(10, 110, 70, 0.12);
          background: #ffffff;
        }
        .dashboard-shell--dark .dash-panel {
          border-color: #1f2b3a;
          background: #0f1824;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.35);
        }
        .dash-panel .ant-card-head {
          border-bottom: 1px solid #eef5ee;
          background: #f7fff9;
        }
        .dashboard-shell--dark .dash-panel .ant-card-head {
          border-bottom-color: #1f2b3a;
          background: #0c141f;
        }
        .dashboard-shell--dark .dash-panel .ant-card-head-title,
        .dashboard-shell--dark .dash-panel .ant-card-extra {
          color: #e6edf3;
        }
        .dash-highlight {
          border-left: 4px solid #16a34a;
          background: linear-gradient(135deg, #ffffff 0%, #ecfff1 100%);
        }
        .dash-warn {
          border-left: 4px solid #f97316;
          background: linear-gradient(135deg, #ffffff 0%, #fff2e6 100%);
        }
        .dashboard-shell--dark .dash-highlight {
          background: linear-gradient(135deg, #0f1824 0%, #0f241a 100%);
        }
        .dashboard-shell--dark .dash-warn {
          background: linear-gradient(135deg, #0f1824 0%, #2a1b0b 100%);
        }
        .dash-table .ant-table {
          background: transparent;
        }
        .dashboard-shell--dark .ant-card,
        .dashboard-shell--dark .ant-card-body,
        .dashboard-shell--dark .ant-statistic-title,
        .dashboard-shell--dark .ant-statistic-content,
        .dashboard-shell--dark .ant-typography,
        .dashboard-shell--dark .ant-table-cell {
          color: #e6edf3;
        }
        .dashboard-shell--dark .ant-table-thead > tr > th {
          background: #0c141f;
          color: #cbd5e1;
          border-bottom: 1px solid #1f2b3a;
        }
        .dashboard-shell--dark .ant-table-tbody > tr > td {
          border-bottom: 1px solid #1f2b3a;
          color: #e6edf3;
        }
        .dashboard-shell--dark .ant-table-tbody > tr.ant-table-row:hover > td {
          background: #0f1b2a;
        }
        .dashboard-shell--dark .ant-table {
          color: #e6edf3;
        }
        .dashboard-shell--dark .ant-table-container {
          background: #0f1824;
        }
        .sport-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #0f172a;
          color: #ffffff;
          margin-right: 10px;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.22);
        }
        .sport-icon.green { background: #16a34a; }
        .sport-icon.blue { background: #2563eb; }
        .sport-icon.orange { background: #f97316; }
        .sport-icon.red { background: #ef4444; }
        .toggle-dark {
          background: #e5e7eb;
          border-color: #a1a7ad;
        }
        .toggle-dark .ant-switch-inner {
          font-weight: 700;
        }
        .toggle-dark .ant-switch-inner .ant-switch-inner-unchecked {
          color: #111827;
        }
        .toggle-dark.ant-switch-checked .ant-switch-inner .ant-switch-inner-checked {
          color: #ffffff;
        }
        .dashboard-shell--dark .toggle-dark {
          background: #0f1824;
          border-color: #1f2b3a;
        }
        .dashboard-shell--dark .toggle-dark:hover {
          background: #162233;
          border-color: #2a3a4f;
        }
        .dashboard-shell--dark .toggle-dark.ant-switch-checked .ant-switch-inner .ant-switch-inner-checked {
          color: #93c5fd;
        }
        .dashboard-shell--dark .match-card {
          background: #0f1824 !important;
          border-color: #1f2b3a;
        }
        .dashboard-shell--dark .match-card .match-subtle {
          color: #9fb0c2;
        }
        .dashboard-shell--dark .match-card strong {
          color: #e6edf3;
        }
        .dashboard-shell--dark .match-card .match-hr {
          border-top-color: #1f2b3a;
        }
        .dashboard-shell--dark .ant-tag {
          border-color: #1f2b3a;
          background: #111b28;
          color: #cbd5e1;
        }
        @media (max-width: 480px) {
          .dashboard-shell {
            padding: 12px;
          }
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .dashboard-header .ant-space {
            width: 100%;
            justify-content: space-between;
          }
          .dashboard-title {
            font-size: 20px;
          }
          .dashboard-subtitle {
            font-size: 12px;
          }
          .dash-stat {
            box-shadow: none;
          }
          .dashboard-shell .ant-row {
            row-gap: 10px;
          }
          .dashboard-shell .ant-col-xs-24 {
            max-width: 50%;
            flex: 0 0 50%;
          }
          .dashboard-shell .ant-col-xs-24:nth-child(n + 7) {
            max-width: 100%;
            flex: 0 0 100%;
          }
          .dashboard-shell .ant-col-xs-24:nth-child(n + 5):nth-child(-n + 7) {
            display: none;
          }
          .dash-stat .ant-statistic-title {
            font-size: 11px;
          }
          .dash-stat .ant-statistic-content {
            font-size: 18px;
          }
          .dash-panel {
            box-shadow: none;
          }
          .dash-panel .ant-card-body {
            padding: 12px;
          }
          .dash-panel .ant-card-head-title {
            font-size: 12px;
          }
          .dashboard-shell .ant-table {
            font-size: 11px;
          }
          .dashboard-shell .ant-table-thead > tr > th,
          .dashboard-shell .ant-table-tbody > tr > td {
            padding: 6px 8px;
          }
          .winners-table .ant-table-thead > tr > th,
          .winners-table .ant-table-tbody > tr > td {
            padding: 4px 6px;
          }
          .winner-points-mobile {
            display: inline;
            font-size: 11px;
            color: #5f6b7a;
            margin-left: 4px;
          }
          .dashboard-shell .ant-btn {
            font-size: 11px;
            height: 30px;
            padding: 4px 10px;
            border-radius: 8px;
          }
          .match-card {
            margin-bottom: 8px !important;
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .match-card .ant-card-body {
            padding: 8px 0 !important;
          }
          .match-card strong,
          .match-card span,
          .match-card div {
            font-size: 11px;
          }
          .sport-icon {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            margin-right: 8px;
          }
        }
        @media (min-width: 768px) {
          .winner-points-mobile {
            display: none;
          }
        }
      `}</style>
      <div className="dashboard-header">
        <div>
          <Title level={2} className="dashboard-title">Panel de Control</Title>
          <Text className="dashboard-subtitle">Resumen operativo y resultados recientes</Text>
        </div>
        <Space size="small">
          <Text className="dashboard-subtitle">Vista oscura</Text>
          <Switch
            checked={isDark}
            onChange={(checked) => setMode(checked ? 'dark' : 'light')}
            className="toggle-dark"
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        </Space>
      </div>

      {/* ── Accesos rápidos ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={6}>
          <Button
            type="primary"
            icon={<FireOutlined />}
            size="large"
            block
            onClick={() => {
              // Última fecha disponible (open primero, si no la más reciente)
              const sorted = [...betdates].sort((a, b) =>
                new Date(b.start_datetime || b.close_datetime || 0) -
                new Date(a.start_datetime || a.close_datetime || 0)
              );
              const target = sorted.find(d => d.status === 'open') || sorted[0];
              if (target) navigate(`/bets/${target.id}`);
              else navigate('/bets');
            }}
            style={{ fontWeight: 700, backgroundColor: '#0958d9', borderColor: '#0958d9' }}
          >
            Hacer Pronósticos
          </Button>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Button
            icon={<WalletOutlined />}
            size="large"
            block
            onClick={() => navigate('/wallet')}
            style={{
              fontWeight: 700,
              backgroundColor: isDark ? '#0f1824' : '#fff',
              borderColor: '#52c41a',
              color: '#52c41a'
            }}
          >
            Recargar Créditos
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>

        <Col xs={24} sm={6}>
          <Card loading={loading} className="dash-stat">
            <Statistic
              title="Competencias"
              value={stats.totalCompetitions}
              prefix={<span className="sport-icon blue"><TrophyOutlined /></span>}
            />
            <Progress
              percent={competitionsPercentRounded}
              size="small"
              format={(percent) => (
                <span style={{ color: isDark ? '#ffffff' : '#111827' }}>
                  {percent}%
                </span>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card loading={loading} className="dash-stat">
            <Statistic
              title="Equipos"
              value={stats.totalTeams}
              prefix={<span className="sport-icon green"><TeamOutlined /></span>}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card loading={loading} className="dash-stat">
            <Statistic
              title="Partidos"
              value={stats.totalMatches}
              prefix={<span className="sport-icon orange"><CalendarOutlined /></span>}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card loading={loading} className="dash-stat">
            <Statistic
              title="Usuarios activos"
              value={stats.activeUsers}
              prefix={<span className="sport-icon red"><FireOutlined /></span>}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card loading={loading} className="dash-stat dash-highlight">
            <Statistic
              title="Usuarios pronosticando"
              value={stats.bettingUsers}
              prefix={<span className="sport-icon green"><ThunderboltOutlined /></span>}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card loading={loading} className="dash-stat dash-warn">
            <Statistic
              title="Premio última fecha activa"
              value={stats.lastActivePrize}
              suffix="puntos"
              prefix={<span className="sport-icon orange"><CrownOutlined /></span>}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card loading={loading} className="dash-stat dash-warn">
            <Statistic
              title="Premio acumulado"
              value={stats.accumulatedPrize}
              suffix="puntos"
              prefix={<span className="sport-icon orange"><StarOutlined /></span>}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Card
              title={<span><RocketOutlined style={{ marginRight: 8 }} />Competencias Activas</span>}
              loading={loading}
              className="dash-panel dash-table"
            >
              <Table
                dataSource={competitions.filter(c => c.status !== 'Finalizado')}
                columns={competitionColumns}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 520 }}
              />
            </Card>

            <Card
              title={<span><CalendarOutlined style={{ marginRight: 8 }} />Los 10 Partidos de esta Fecha</span>}
              loading={loading}
              className="dash-panel"
            >
              {betdateMatches.length === 0 ? (
                <div style={{ color: '#999' }}>No hay fecha activa para mostrar.</div>
              ) : (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <Space>
                      <Tag
                        color={betdateMatches[0]?.status === 'open' ? 'green' : betdateMatches[0]?.status === 'finished' ? 'blue' : 'default'}
                        style={getBetDateStatusStyle(betdateMatches[0]?.status)}
                      >
                        {betdateMatches[0]?.status}
                      </Tag>
                      <strong>{betdateMatches[0]?.betdate_name}</strong>
                    </Space>
                  </div>
                  <Table
                  dataSource={(betdateMatches[0]?.matches || [])
                    .slice(0, 10)
                    .map((m) => ({
                      key: m.id,
                      match_date: m.match_date,
                      home_team: m.home_team,
                      away_team: m.away_team,
                      competition: m.competition,
                      competition_name: m.competition_name || m.competition?.name,
                      home_logo: m.home_team_logo,
                      away_logo: m.away_team_logo,
                      status: m.status,
                      home_score: getDisplayScore(m).home,
                      away_score: getDisplayScore(m).away,
                      has_score: getDisplayScore(m).hasScore
                    }))}
                  columns={[
                    {
                      title: 'Fecha',
                      dataIndex: 'match_date',
                      render: (value, row) => (
                        <Space orientation="vertical" size={2}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: '11px', color: isDark ? '#9fb0c2' : '#6b7280' }}>
                              {value ? formatDateTimeShortUTC(value) : 'Sin fecha'}
                            </span>
                            <span style={{ fontSize: '11px', color: isDark ? '#9fb0c2' : '#6b7280' }}>
                              {row.competition_name || row.competition || 'Competencia'}
                            </span>
                          </div>
                          <Space align="center" size="small">
                            <Avatar src={row.home_logo} size={20}>
                              {getTeamLabel(row.home_team)?.charAt(0)}
                            </Avatar>
                            <span>{getTeamLabel(row.home_team)} vs {getTeamLabel(row.away_team)}</span>
                            <Avatar src={row.away_logo} size={20}>
                              {getTeamLabel(row.away_team)?.charAt(0)}
                            </Avatar>
                          </Space>
                          <Space size={6}>
                            <Tag
                              color={row.status === 'open' ? 'green' : row.status === 'finished' ? 'blue' : 'default'}
                              style={getBetDateStatusStyle(row.status)}
                            >
                              {row.status || 'Estado'}
                            </Tag>
                            <Tag style={getResultTagStyle()}>
                              Resultado: {row.has_score ? `${row.home_score} - ${row.away_score}` : 'Sin resultado'}
                            </Tag>
                          </Space>
                        </Space>
                      ),
                      responsive: ['xs']
                    },
                    {
                      title: 'Partido',
                      responsive: ['md'],
                      render: (_, row) => (
                        <Space align="center" size="small">
                          <Avatar src={row.home_logo} size="small">
                            {getTeamLabel(row.home_team)?.charAt(0)}
                          </Avatar>
                          <span>{getTeamLabel(row.home_team)}</span>
                          <span style={{ color: '#8c8c8c' }}>vs</span>
                          <span>{getTeamLabel(row.away_team)}</span>
                          <Avatar src={row.away_logo} size="small">
                            {getTeamLabel(row.away_team)?.charAt(0)}
                          </Avatar>
                        </Space>
                      )
                    },
                    {
                      title: 'Competencia',
                      dataIndex: 'competition'
                    }
                  ]}
                  pagination={false}
                  size="small"
                  locale={{ emptyText: 'Sin partidos' }}
                  scroll={{ x: 520 }}
                  />
                </>
              )}
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<span><FireOutlined style={{ marginRight: 8 }} />Últimos Partidos</span>}
            loading={loading}
            className="dash-panel"
          >
            {stats.recentMatches.map(match => {
              const home = teams.find(t => t.id === match.home_team_id);
              const away = teams.find(t => t.id === match.away_team_id);
              
              const statusInfo = getMatchStatusInfo(match.status);

              const homeScore = match.home_score ?? 0;
              const awayScore = match.away_score ?? 0;
              const stadiumName = home?.stadium || 'Estadio no definido';

              const isScheduled = statusInfo.label === 'Programado';

              return (
                <Card
                  key={match.id}
                  size="small"
                  className="match-card"
                  style={{ 
                    marginBottom: 6, 
                    borderLeft: `4px solid ${statusInfo.borderColor}`,
                    backgroundColor: isScheduled
                      ? (isDark ? '#0f1a24' : '#ebf7fa')
                      : (isDark ? '#0f1824' : '#ffffff'),
                    cursor: 'pointer'
                  }}
                  hoverable
                  onClick={() => navigate(`/matches/${match.id}`)}
                >
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    {/* Encabezado con estado */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      width: '100%',
                      marginBottom: 8
                    }}>
                      <div style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: statusInfo.backgroundColor,
                        border: `1px solid ${statusInfo.borderColor}`,
                        fontSize: '12px',
                        fontWeight: '600',
                        color: statusInfo.textColor,
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}>
                        {statusInfo.label}
                      </div>
                      <span style={{ fontSize: 12, color: isDark ? '#9fb0c2' : '#666' }} className="match-subtle">
                        Estadio: <strong>{stadiumName}</strong>
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? '#9fb0c2' : '#666' }} className="match-subtle">
                      {match.competition_name || `Competencia #${match.competition_id || 'N/D'}`}
                      {' • '}
                      {match.round_name
                        ? match.round_name
                        : match.round_number
                          ? `Jornada ${match.round_number}`
                          : `Jornada #${match.round_id || 'N/D'}`}
                    </div>

                    {/* Equipos y marcador */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        width: '100%',
                        padding: '8px 0'
                      }}>
                      {/* Equipo local */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        flex: 1,
                        justifyContent: 'flex-start'
                      }}>
                        <Avatar src={home?.logo_url} size={24}>
                          {getTeamLabel(home?.name)?.charAt(0)}
                        </Avatar>
                        <strong style={{ 
                          fontSize: '12px',
                          color: isScheduled ? (isDark ? '#9fb0c2' : '#8c8c8c') : (isDark ? '#e6edf3' : '#000')
                        }}>
                          {getTeamLabel(match.home_team_name)}
                        </strong>
                      </div>

                      {/* Marcador */}
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '12px',
                        minWidth: '70px',
                        textAlign: 'center',
                        padding: '4px 12px',
                        backgroundColor: isScheduled ? (isDark ? '#1c2533' : '#f0f0f0') : statusInfo.backgroundColor,
                        borderRadius: '6px',
                        border: `1px solid ${isScheduled ? (isDark ? '#2a3a4f' : '#d9d9d9') : statusInfo.borderColor}`,
                        color: isScheduled ? (isDark ? '#9fb0c2' : '#8c8c8c') : statusInfo.textColor,
                        margin: '0 12px'
                      }}>
                        {isScheduled ? '0 - 0' : `${homeScore} - ${awayScore}`}
                      </div>

                      {/* Equipo visitante */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        flex: 1,
                        justifyContent: 'flex-end'
                      }}>
                        <strong style={{ 
                          fontSize: '12px',
                          color: isScheduled ? (isDark ? '#9fb0c2' : '#8c8c8c') : (isDark ? '#e6edf3' : '#000'),
                          textAlign: 'right'
                        }}>
                          {getTeamLabel(match.away_team_name)}
                        </strong>
                        <Avatar src={away?.logo_url} size={24}>
                          {getTeamLabel(away?.name)?.charAt(0)}
                        </Avatar>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '12px', 
                      color: isDark ? '#9fb0c2' : '#8c8c8c',
                      marginTop: '4px',
                      paddingTop: '4px',
                      borderTop: `1px dashed ${isDark ? '#1f2b3a' : '#f0f0f0'}`
                    }} className="match-hr">
                      <span>
                        <strong>{match.match_date ? new Date(match.match_date).toLocaleDateString() : 'Fecha no definida'}</strong>
                      </span>
                      
                    </div>
                  </Space>
                </Card>
              );
            })}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <>
                <span><CrownOutlined style={{ marginRight: 8 }} />Ganadores por Fecha</span>
                <span style={{ fontSize: '12px', color: '#8c8c8c', marginLeft: 6 }}>
                  (Mira en Ranking los resultados y pronósticos de todos los participantes de cada fecha)
                </span>
              </>
            }
            loading={loading}
            className="dash-panel dash-table"
          >
            <Table
              dataSource={betdateWinners}
              columns={winnersColumns}
              rowKey="betdate_id"
              pagination={false}
              size="small"
              locale={{ emptyText: 'Sin resultados disponibles' }}
              scroll={{ x: 520 }}
              className="winners-table"
            />
          </Card>
        </Col>

        {/* Se eliminó bloque duplicado de partidos */}

      </Row>
    </div>
  );
};

export default Dashboard;
