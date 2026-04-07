// frontend/src/components/competitions/CompetitionCard.jsx
import React from 'react';
import { Popconfirm, Tooltip } from 'antd';
import {
  TrophyOutlined, TeamOutlined, CalendarOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined,
  LockOutlined, UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './CompetitionCard.css';

const statusConfig = (status) => {
  const v = String(status || '').toLowerCase();
  if (v.includes('curso') || v === 'active' || v === 'ongoing')
    return { bar: '#22c55e', bg: 'rgba(34,197,94,.13)', border: 'rgba(34,197,94,.35)', text: '#16a34a', label: 'En curso', darkText: '#86efac' };
  if (v.includes('programado') || v === 'scheduled')
    return { bar: '#3b82f6', bg: 'rgba(59,130,246,.13)', border: 'rgba(59,130,246,.3)', text: '#1d4ed8', label: 'Programado', darkText: '#93c5fd' };
  if (v.includes('finalizado') || v === 'completed')
    return { bar: '#64748b', bg: 'rgba(100,116,139,.13)', border: 'rgba(100,116,139,.3)', text: '#475569', label: 'Finalizado', darkText: '#94a3b8' };
  if (v.includes('cancelado') || v === 'cancelled')
    return { bar: '#ef4444', bg: 'rgba(239,68,68,.13)', border: 'rgba(239,68,68,.3)', text: '#dc2626', label: 'Cancelado', darkText: '#fca5a5' };
  return { bar: '#94a3b8', bg: 'rgba(148,163,184,.1)', border: 'rgba(148,163,184,.3)', text: '#64748b', label: status || '—', darkText: '#94a3b8' };
};

const typeLabel = (type) => {
  const map = { league: 'Liga', cup: 'Copa', league_cup: 'Liga + Copa', groups_playoff: 'Grupos + Playoff' };
  return map[type] || type || '—';
};

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

const CompetitionCard = ({ competition, showActions = true, onDelete }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const logoSrc = competition.logo_url
    ? (competition.logo_url.startsWith('http') ? competition.logo_url : `${apiBaseUrl}${competition.logo_url}`)
    : null;

  const sc = statusConfig(competition.status);
  const isUserComp = competition.created_by === user?.id;
  const canEdit = isAdmin || competition.created_by === user?.id;
  const canDelete = isAdmin;

  const card = isDark
    ? { bg: '#0f1824', border: '#1f2b3a', text: '#e6edf3', sub: '#94a3b8', action: '#1a2536' }
    : { bg: '#ffffff', border: '#e5e7eb', text: '#111827', sub: '#6b7280', action: '#f8fafc' };

  return (
    <div
      className="cc"
      style={{
        background: card.bg,
        border: `1px solid ${card.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow .2s, transform .2s',
        boxShadow: isDark ? '0 4px 16px rgba(0,0,0,.3)' : '0 2px 10px rgba(17,24,39,.07)',
        position: 'relative',
      }}
      onClick={() => navigate(`/competitions/${competition.id}`)}
    >
      {/* Barra de color superior */}
      <div style={{ height: 4, background: sc.bar, width: '100%' }} />

      {/* Cuerpo */}
      <div style={{ padding: '12px 14px 0' }}>
        {/* Fila principal: logo + nombre + estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {/* Logo */}
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: isDark ? '#0c141f' : '#f1f5f9',
            border: `1px solid ${card.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {logoSrc
              ? <img src={logoSrc} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              : <TrophyOutlined style={{ fontSize: 18, color: isDark ? '#475569' : '#94a3b8' }} />}
          </div>

          {/* Nombre + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: card.text,
                lineHeight: 1.3, flex: 1, minWidth: 0,
              }}>
                {competition.name}
              </span>
              {/* Pill de estado */}
              <span style={{
                flexShrink: 0,
                padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                background: isDark ? sc.bg : sc.bg,
                border: `1px solid ${sc.border}`,
                color: isDark ? sc.darkText : sc.text,
                lineHeight: '16px', whiteSpace: 'nowrap',
              }}>
                {sc.label}
              </span>
            </div>

            {/* Sub-info en una línea */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: card.sub }}>
                <TrophyOutlined style={{ marginRight: 3 }} />{typeLabel(competition.competition_type)}
              </span>
              <span style={{ fontSize: 11, color: card.sub }}>
                <TeamOutlined style={{ marginRight: 3 }} />{competition.total_teams || 0} equipos
              </span>
              {competition.season && (
                <span style={{ fontSize: 11, color: card.sub }}>
                  <CalendarOutlined style={{ marginRight: 3 }} />{competition.season}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Fechas (solo si existen) */}
        {(competition.start_date || competition.end_date) && (
          <div style={{
            display: 'flex', gap: 16, marginBottom: 10,
            padding: '6px 10px', borderRadius: 8,
            background: isDark ? 'rgba(15,24,36,.6)' : '#f8fafc',
            border: `1px solid ${card.border}`,
          }}>
            {competition.start_date && (
              <span style={{ fontSize: 10, color: card.sub }}>
                Inicio: <strong style={{ color: card.text }}>{formatDate(competition.start_date)}</strong>
              </span>
            )}
            {competition.end_date && (
              <span style={{ fontSize: 10, color: card.sub }}>
                Fin: <strong style={{ color: card.text }}>{formatDate(competition.end_date)}</strong>
              </span>
            )}
          </div>
        )}

        {/* Badges admin / tu competencia */}
        {(isAdmin || isUserComp) && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {isAdmin && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(239,68,68,.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,.3)' }}>
                ADMIN
              </span>
            )}
            {isUserComp && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(234,179,8,.15)', color: isDark ? '#fde68a' : '#b45309', border: '1px solid rgba(234,179,8,.3)' }}>
                <UserOutlined style={{ marginRight: 3 }} />Tu competencia
              </span>
            )}
          </div>
        )}
      </div>

      {/* Barra de acciones */}
      {showActions && (
        <div style={{
          display: 'flex', borderTop: `1px solid ${card.border}`,
          background: card.action,
        }}
          onClick={e => e.stopPropagation()}
        >
          {/* Ver */}
          <button
            style={actionBtn(card)}
            onClick={() => navigate(`/competitions/${competition.id}`)}
          >
            <EyeOutlined style={{ color: '#1677ff', fontSize: 14 }} />
          </button>

          {/* Editar */}
          {canEdit ? (
            <button
              style={actionBtn(card)}
              onClick={() => navigate(`/competitions/${competition.id}/edit`)}
            >
              <EditOutlined style={{ color: '#22c55e', fontSize: 14 }} />
            </button>
          ) : (
            <Tooltip title="Sin permisos para editar">
              <button style={{ ...actionBtn(card), opacity: .4, cursor: 'not-allowed' }}>
                <LockOutlined style={{ fontSize: 14, color: card.sub }} />
              </button>
            </Tooltip>
          )}

          {/* Eliminar */}
          {canDelete ? (
            <Popconfirm
              title="¿Eliminar competencia?"
              description="Esta acción no se puede deshacer."
              onConfirm={() => onDelete && onDelete(competition.id)}
              okText="Eliminar"
              cancelText="Cancelar"
              okType="danger"
              placement="top"
            >
              <button style={actionBtn(card)}>
                <DeleteOutlined style={{ color: '#ef4444', fontSize: 14 }} />
              </button>
            </Popconfirm>
          ) : (
            <Tooltip title="Solo administradores pueden eliminar">
              <button style={{ ...actionBtn(card), opacity: .4, cursor: 'not-allowed' }}>
                <LockOutlined style={{ fontSize: 14, color: card.sub }} />
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};

const actionBtn = (card) => ({
  flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
  padding: '9px 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRight: `1px solid ${card.border}`,
  transition: 'background .15s',
});

export default CompetitionCard;
