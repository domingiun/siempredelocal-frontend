// frontend/src/components/competitions/CompetitionGroups.jsx
import React, { useState, useEffect } from 'react';
import { Button, Select, message, Typography, Avatar, Spin, Alert, Tag, Grid } from 'antd';
import { SaveOutlined, TeamOutlined } from '@ant-design/icons';
import competitionService from '../../services/competitionService';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';

const { Text } = Typography;
const { Option } = Select;

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const CompetitionGroups = ({ competitionId, competition }) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { isAdmin } = usePermissions();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const numGroups = competition?.groups || 8;
  const validGroups = GROUP_LETTERS.slice(0, numGroups);

  const card = isDark
    ? { bg: '#0c141f', border: '#1f2b3a', text: '#e6edf3', muted: '#94a3b8', row: '#0f1824' }
    : { bg: '#ffffff', border: '#e5e7eb', text: '#111827', muted: '#6b7280', row: '#f8fafc' };

  const [teams, setTeams] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTeams(); }, [competitionId]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await competitionService.getCompetition(competitionId);
      const data = res.data;
      const teamsData = data.teams || [];
      setTeams(teamsData);

      // Pre-fill from existing group assignments via groups standings endpoint
      try {
        const groupsRes = await competitionService.getStandingsGroups(competitionId);
        const groupsData = groupsRes?.data?.groups_data || {};
        const existing = {};
        Object.entries(groupsData).forEach(([, groupInfo]) => {
          const letter = groupInfo.group_letter;
          (groupInfo.standings || []).forEach(row => {
            if (letter) existing[row.team_id] = letter;
          });
        });
        setAssignments(existing);
      } catch {
        setAssignments({});
      }
    } catch {
      message.error('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      teams.forEach(t => {
        if (assignments[t.id]) payload[String(t.id)] = assignments[t.id];
      });
      await competitionService.assignGroups(competitionId, payload);
      message.success('Grupos asignados correctamente');
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error al guardar grupos';
      message.error(detail);
    } finally {
      setSaving(false);
    }
  };

  const groupedTeams = {};
  validGroups.forEach(g => { groupedTeams[g] = []; });
  groupedTeams['sin_grupo'] = [];

  teams.forEach(t => {
    const g = assignments[t.id];
    if (g && validGroups.includes(g)) groupedTeams[g].push(t);
    else groupedTeams['sin_grupo'].push(t);
  });

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: isMobile ? '12px' : '16px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Text strong style={{ fontSize: 15, color: card.text }}>
          <TeamOutlined style={{ marginRight: 6, color: '#1677ff' }} />
          Asignación de Grupos ({teams.length} equipos · {numGroups} grupos)
        </Text>
        {isAdmin && (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
          >
            Guardar grupos
          </Button>
        )}
      </div>

      {isAdmin && (
        <Alert
          type="info"
          showIcon
          message="Asigna cada equipo a su grupo usando el selector. Cuando termines, haz clic en 'Guardar grupos'."
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Team assignment list */}
      <div style={{ marginBottom: 24 }}>
        {teams.map(team => (
          <div
            key={team.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', marginBottom: 4, borderRadius: 6,
              background: card.row, border: `1px solid ${card.border}`,
            }}
          >
            {team.logo_url
              ? <img src={team.logo_url} alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 2 }} />
              : <Avatar size={24} style={{ fontSize: 11 }}>{team.name?.charAt(0)}</Avatar>
            }
            <Text style={{ flex: 1, fontSize: 13, color: card.text }}>{team.name}</Text>
            {team.country && <Text style={{ fontSize: 11, color: card.muted }}>{team.country}</Text>}
            {isAdmin ? (
              <Select
                size="small"
                style={{ width: 80 }}
                placeholder="Grupo"
                value={assignments[team.id] || undefined}
                allowClear
                onChange={val => setAssignments(prev => {
                  const next = { ...prev };
                  if (val) next[team.id] = val;
                  else delete next[team.id];
                  return next;
                })}
              >
                {validGroups.map(g => (
                  <Option key={g} value={g}>Grp {g}</Option>
                ))}
              </Select>
            ) : (
              assignments[team.id]
                ? <Tag color="blue">Grupo {assignments[team.id]}</Tag>
                : <Tag color="default">Sin grupo</Tag>
            )}
          </div>
        ))}
      </div>

      {/* Preview by group */}
      <Text strong style={{ fontSize: 14, color: card.text, display: 'block', marginBottom: 12 }}>
        Vista previa por grupo
      </Text>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        {validGroups.map(g => (
          <div key={g} style={{
            background: card.bg, border: `1px solid ${card.border}`, borderRadius: 8, padding: '10px 12px'
          }}>
            <Text strong style={{ fontSize: 13, color: '#1677ff', display: 'block', marginBottom: 6 }}>
              Grupo {g}
            </Text>
            {groupedTeams[g].length === 0
              ? <Text style={{ fontSize: 11, color: card.muted }}>—</Text>
              : groupedTeams[g].map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  {t.logo_url
                    ? <img src={t.logo_url} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    : <Avatar size={16} style={{ fontSize: 8 }}>{t.name?.charAt(0)}</Avatar>
                  }
                  <Text style={{ fontSize: 11, color: card.text }}>{t.short_name || t.name}</Text>
                </div>
              ))
            }
          </div>
        ))}
      </div>

      {groupedTeams['sin_grupo'].length > 0 && (
        <div style={{ marginTop: 10, padding: '10px 12px', background: card.row, border: `1px solid ${card.border}`, borderRadius: 8 }}>
          <Text strong style={{ fontSize: 13, color: card.muted, display: 'block', marginBottom: 4 }}>Sin grupo asignado</Text>
          {groupedTeams['sin_grupo'].map(t => (
            <Tag key={t.id} style={{ marginBottom: 4 }}>{t.short_name || t.name}</Tag>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompetitionGroups;
