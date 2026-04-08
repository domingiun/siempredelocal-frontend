// frontend/src/components/competitions/CompetitionTeams.jsx
import React, { useState, useEffect } from 'react';
import { Input, Modal, message, Typography, Alert, Button, Grid } from 'antd';
import {
  TeamOutlined, SearchOutlined, PlusOutlined,
  DeleteOutlined, EyeOutlined, LockOutlined,
  EnvironmentOutlined, HomeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';

const { Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

const CompetitionTeams = ({ competitionId, initialTeams = [], teams: teamsProp = [] }) => {
  const seededTeams = initialTeams.length ? initialTeams : teamsProp;
  const [teams, setTeams] = useState(seededTeams);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { isAdmin } = usePermissions();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const card = isDark
    ? { bg: '#0c141f', border: '#1f2b3a', sub: '#64748b', text: '#e6edf3', hover: '#0f1b2a' }
    : { bg: '#ffffff', border: '#e5e7eb', sub: '#6b7280', text: '#111827', hover: '#f8fafc' };

  useEffect(() => {
    if (seededTeams.length) { setTeams(seededTeams); return; }
    fetchTeams();
  }, [competitionId, initialTeams, teamsProp]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await competitionService.getCompetition(competitionId);
      setTeams(response.data.teams || []);
    } catch {
      message.error('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeam = (teamId) => {
    if (!isAdmin) { message.error('No tienes permisos'); return; }
    Modal.confirm({
      title: '¿Remover equipo?',
      content: 'El equipo ya no participará en esta competencia.',
      okText: 'Remover', okType: 'danger', cancelText: 'Cancelar',
      onOk: async () => {
        try {
          message.success('Equipo removido');
          fetchTeams();
        } catch { message.error('Error al remover equipo'); }
      },
    });
  };

  const filtered = teams.filter(t => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.country?.toLowerCase().includes(q) || t.short_name?.toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: isMobile ? '12px 14px' : '16px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <Text strong style={{ fontSize: 14, color: card.text, flex: 1 }}>
          <TeamOutlined style={{ marginRight: 6, color: '#1677ff' }} />
          Equipos participantes ({teams.length})
        </Text>
        <Search
          placeholder="Buscar..."
          onSearch={setSearchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: isMobile ? '100%' : 200 }}
          allowClear
          size="small"
        />
        {isAdmin && (
          <Button
            type="primary" icon={<PlusOutlined />} size="small"
            onClick={() => navigate(`/competitions/${competitionId}/add-teams`)}
          >
            Agregar
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: card.sub }}>Cargando equipos...</div>
      ) : filtered.length === 0 ? (
        <Alert description="No hay equipos en esta competencia." type="info" showIcon />
      ) : isMobile ? (
        /* ── Vista móvil: lista de filas ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(team => (
            <div
              key={team.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: card.bg, border: `1px solid ${card.border}`,
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/teams/${team.id}`)}
            >
              {/* Logo */}
              <div style={{
                width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                background: isDark ? '#0f1824' : '#f1f5f9',
                border: `1px solid ${card.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {team.logo_url
                  ? <img src={team.logo_url} alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                  : <TeamOutlined style={{ color: card.sub, fontSize: 16 }} />}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: card.text, lineHeight: 1.2 }}>
                  {team.name}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                  {team.short_name && (
                    <span style={{ fontSize: 10, color: card.sub }}>{team.short_name}</span>
                  )}
                  {team.country && (
                    <span style={{ fontSize: 10, color: card.sub }}>
                      <EnvironmentOutlined style={{ marginRight: 2 }} />{team.country}
                    </span>
                  )}
                  {team.stadium && (
                    <span style={{ fontSize: 10, color: card.sub }}>
                      <HomeOutlined style={{ marginRight: 2 }} />{team.stadium}
                    </span>
                  )}
                </div>
              </div>

              {/* Acción eliminar (admin) */}
              {isAdmin && (
                <button
                  onClick={e => { e.stopPropagation(); handleRemoveTeam(team.id); }}
                  style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    padding: 6, color: '#ef4444', fontSize: 15, flexShrink: 0,
                  }}
                >
                  <DeleteOutlined />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── Vista desktop: tabla simple ── */
        <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${card.border}` }}>
          {/* Cabecera */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto',
            padding: '8px 14px',
            background: isDark ? '#0a1220' : '#f8fafc',
            borderBottom: `1px solid ${card.border}`,
            fontSize: 11, fontWeight: 700, color: card.sub, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span>Equipo</span><span>Estadio</span><span>País</span><span>Ciudad</span><span></span>
          </div>
          {filtered.map((team, idx) => (
            <div
              key={team.id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto',
                padding: '10px 14px', alignItems: 'center',
                background: card.bg,
                borderBottom: idx < filtered.length - 1 ? `1px solid ${card.border}` : 'none',
                cursor: 'pointer', transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = card.hover}
              onMouseLeave={e => e.currentTarget.style.background = card.bg}
              onClick={() => navigate(`/teams/${team.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                  background: isDark ? '#0f1824' : '#f1f5f9',
                  border: `1px solid ${card.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  {team.logo_url
                    ? <img src={team.logo_url} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                    : <TeamOutlined style={{ color: card.sub, fontSize: 13 }} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: card.text }}>{team.name}</div>
                  {team.short_name && <div style={{ fontSize: 10, color: card.sub }}>{team.short_name}</div>}
                </div>
              </div>
              <span style={{ fontSize: 12, color: card.sub }}>{team.stadium || '—'}</span>
              <span style={{ fontSize: 12, color: card.sub }}>{team.country || '—'}</span>
              <span style={{ fontSize: 12, color: card.sub }}>{team.city || '—'}</span>
              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => navigate(`/teams/${team.id}`)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#1677ff', fontSize: 14, padding: 4 }}>
                  <EyeOutlined />
                </button>
                {isAdmin && (
                  <button onClick={() => handleRemoveTeam(team.id)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: 14, padding: 4 }}>
                    <DeleteOutlined />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompetitionTeams;
