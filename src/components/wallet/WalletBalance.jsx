// frontend/src/components/wallet/WalletBalance.jsx
import React, { useState, useEffect } from 'react';
import { Spin, Modal, InputNumber, Radio, notification, Select, Input } from 'antd';
import {
  FireOutlined, DollarOutlined, TrophyOutlined,
  PlusCircleOutlined, HistoryOutlined, ReloadOutlined,
  SafetyOutlined, InfoCircleOutlined, CreditCardOutlined,
  BankOutlined, SwapOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import betService from '../../services/betService';
import './WalletBalance.css';

const TX_LABELS = {
  CREDIT_PURCHASE:   'Recarga de créditos',
  BET_PLACEMENT:     'Pronósticos realizados',
  PRIZE_WIN:         'Premio ganado',
  CREDIT_CONVERSION: 'Conversión a puntos',
  WITHDRAWAL:        'Retiro de fondos',
  REFUND:            'Reembolso',
};

const txColor = (type) => {
  if (['CREDIT_PURCHASE', 'PRIZE_WIN', 'REFUND'].includes(type)) return 'green';
  if (['BET_PLACEMENT', 'CREDIT_CONVERSION', 'WITHDRAWAL'].includes(type)) return 'red';
  return 'blue';
};

const txIcon = (type) => {
  switch (type) {
    case 'CREDIT_PURCHASE':   return <PlusCircleOutlined />;
    case 'BET_PLACEMENT':     return <FireOutlined />;
    case 'PRIZE_WIN':         return <TrophyOutlined />;
    case 'CREDIT_CONVERSION': return <DollarOutlined />;
    default:                  return <HistoryOutlined />;
  }
};

const txBadge = (item) => {
  if (item.type === 'CREDIT_PURCHASE')
    return { color: 'green', text: `+${item.credits} crédito${item.credits !== 1 ? 's' : ''}` };
  if (item.type === 'BET_PLACEMENT')
    return { color: 'red', text: `-${item.credits || 1} crédito` };
  if (item.type === 'PRIZE_WIN')
    return { color: 'gold', text: `+$${item.amount?.toLocaleString()}` };
  if (item.type === 'CREDIT_CONVERSION')
    return { color: 'blue', text: `-$${item.amount?.toLocaleString()}` };
  return { color: 'none', text: '' };
};

const WalletBalance = ({ compact = false, showActions = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    wallet, transactions, loading, refreshing, refreshWallet,
    requestPointsToCredits, requestWithdrawPoints,
  } = useWallet();

  const [recentActivity, setRecentActivity] = useState([]);
  const [redeemOpen, setRedeemOpen]             = useState(false);
  const [redeemType, setRedeemType]             = useState('credits');
  const [pointsToConvert, setPointsToConvert]   = useState(5000);
  const [withdrawAmount, setWithdrawAmount]     = useState(20000);
  const [withdrawBank, setWithdrawBank]         = useState(null);
  const [withdrawAccType, setWithdrawAccType]   = useState(null);
  const [withdrawAccNum, setWithdrawAccNum]     = useState('');
  const [redeemSubmitting, setRedeemSubmitting] = useState(false);
  const [stats, setStats] = useState({
    win_rate: 0, avg_points: 0, total_won: 0, total_bets: 0, wins: 0,
  });

  const pendingCredits = (transactions || [])
    .filter(tx => tx.transaction_type === 'CREDIT_PURCHASE' && tx.status === 'pending')
    .reduce((sum, tx) => sum + (tx.credits_affected || 0), 0);

  useEffect(() => {
    if (user) {
      fetchUserStats();
      processRecentActivity();
    }
  }, [user, transactions]);

  const fetchUserStats = async () => {
    try {
      const response = await betService.getUserStatus(user.id);
      if (response.data) {
        const totalBets = response.data.total_bets || 0;
        const wins      = response.data.wins || 0;
        setStats({
          win_rate:   totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0,
          avg_points: response.data.average_points || response.data.avg_points || 0,
          total_won:  response.data.total_prizes_won || response.data.total_won || 0,
          total_bets: totalBets,
          wins,
        });
      }
    } catch {}
  };

  const processRecentActivity = () => {
    if (!transactions?.length) return;
    setRecentActivity(
      transactions.slice(0, 5).map(tx => ({
        id:          tx.id,
        type:        tx.transaction_type,
        amount:      tx.amount,
        credits:     tx.credits_affected,
        date:        new Date(tx.created_at).toLocaleDateString('es-CO', { dateStyle: 'short' }),
        status:      tx.status,
      }))
    );
  };

  const handleRedeemSubmit = async () => {
    const balancePts = Number(wallet.balance_PTS || 0);
    setRedeemSubmitting(true);
    try {
      if (redeemType === 'credits') {
        if (pointsToConvert < 5000) { notification.warning({ message: 'Mínimo 5,000 puntos' }); return; }
        if (pointsToConvert % 5000 !== 0) { notification.warning({ message: 'Debe ser múltiplo de 5,000' }); return; }
        if (pointsToConvert > balancePts) { notification.warning({ message: 'Saldo insuficiente' }); return; }
        const r = await requestPointsToCredits(pointsToConvert, 5000);
        if (r?.success) { setRedeemOpen(false); refreshWallet(); }
      } else {
        if (!withdrawBank) { notification.warning({ message: 'Selecciona el banco o método de pago' }); return; }
        if (withdrawBank === 'bancolombia' && !withdrawAccType) { notification.warning({ message: 'Selecciona el tipo de cuenta' }); return; }
        if (!withdrawAccNum.trim()) { notification.warning({ message: 'Ingresa el número de cuenta' }); return; }
        if (withdrawAmount < 20000) { notification.warning({ message: 'Retiro mínimo $20,000' }); return; }
        if (withdrawAmount > 1000000) { notification.warning({ message: 'Retiro máximo $1,000,000' }); return; }
        if (withdrawAmount > balancePts) { notification.warning({ message: 'Saldo insuficiente' }); return; }
        const paymentMethod = `${withdrawBank}|${withdrawAccType || 'nequi'}|${withdrawAccNum.trim()}`;
        const r = await requestWithdrawPoints(withdrawAmount, paymentMethod);
        if (r?.success) {
          setRedeemOpen(false);
          setWithdrawBank(null); setWithdrawAccType(null); setWithdrawAccNum('');
          refreshWallet();
        }
      }
    } finally {
      setRedeemSubmitting(false);
    }
  };

  /* ── Compact mode (sidebar / dashboard widget) ─────────────────────── */
  if (compact) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #0c1a3e 0%, #0f2347 100%)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 12,
          padding: '14px 16px',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/wallet')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#60a5fa', fontSize: 13, fontWeight: 700 }}>
            <FireOutlined style={{ marginRight: 6 }} />Mi Cuenta
          </span>
          <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 13 }}>
            {wallet?.credits || 0} créditos
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: '#475569' }}>Puntos</span>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>
            ${(wallet?.balance_PTS || 0).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  const winRateColor = stats.win_rate > 50 ? '#22c55e' : stats.win_rate > 25 ? '#f59e0b' : '#94a3b8';

  /* ── Full page ──────────────────────────────────────────────────────── */
  return (
    <div className="wlt">

      {/* Hero */}
      <div className="wlt-hero">
        <div>
          <h1 className="wlt-hero-title">
            <CreditCardOutlined style={{ color: '#60a5fa', fontSize: '1.2rem' }} />
            Mi Cuenta
          </h1>
          <p className="wlt-hero-sub">Gestiona tus créditos y transacciones</p>
        </div>
        <button
          className="wlt-refresh-btn"
          onClick={refreshWallet}
          disabled={refreshing}
        >
          <ReloadOutlined spin={refreshing} />
          {refreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {/* Balance cards */}
      <div className="wlt-cards">

        {/* Créditos */}
        <div className="wlt-card wlt-card--credits">
          <div className="wlt-card-label wlt-card-label--blue">
            <FireOutlined /> Créditos disponibles
          </div>
          <div className="wlt-card-value wlt-card-value--blue">
            {wallet?.credits ?? 0}
            <span className="wlt-card-unit">créditos</span>
          </div>

          <div className="wlt-card-meta">
            <div className="wlt-card-meta-row">
              <span>Valor en COP</span>
              <span>${((wallet?.credits ?? 0) * 5000).toLocaleString('es-CO')}</span>
            </div>
            <div className="wlt-card-meta-row">
              <span>Pronósticos posibles</span>
              <span>{wallet?.credits ?? 0}</span>
            </div>
          </div>

          {pendingCredits > 0 && (
            <div className="wlt-pending-badge">
              ⏳ +{pendingCredits} crédito{pendingCredits !== 1 ? 's' : ''} pendiente{pendingCredits !== 1 ? 's' : ''} de aprobación
            </div>
          )}

          <button
            className="wlt-card-cta wlt-card-cta--blue"
            onClick={() => navigate('/purchase')}
          >
            <PlusCircleOutlined /> Recargar créditos
          </button>
        </div>

        {/* Puntos */}
        <div className="wlt-card wlt-card--points">
          <div className="wlt-card-label wlt-card-label--green">
            <TrophyOutlined /> Dinero disponible
          </div>
          <div className="wlt-card-value wlt-card-value--green">
            ${(wallet?.balance_PTS ?? 0).toLocaleString('es-CO')}
          </div>

          <div className="wlt-card-meta">
            <div className="wlt-card-meta-row">
              <span>Total ganado histórico</span>
              <span>${(wallet?.total_earned ?? 0).toLocaleString('es-CO')}</span>
            </div>
            <div className="wlt-card-meta-row">
              <span>Pronósticos ganados</span>
              <span>{wallet?.bets_won ?? 0} / {wallet?.bets_placed ?? 0}</span>
            </div>
          </div>

          {(wallet?.balance_PTS ?? 0) > 0 ? (
            <button
              className="wlt-card-cta wlt-card-cta--green"
              onClick={() => setRedeemOpen(true)}
            >
              <DollarOutlined /> Canjear puntos
            </button>
          ) : (
            <button
              className="wlt-card-cta wlt-card-cta--green"
              style={{ opacity: 0.4, cursor: 'default' }}
              disabled
            >
              <DollarOutlined /> Sin dinero disponible
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="wlt-stats">
        <div className="wlt-stat">
          <div className="wlt-stat-val">{stats.total_bets}</div>
          <div className="wlt-stat-lbl">Pronósticos</div>
        </div>
        <div className="wlt-stat">
          <div className="wlt-stat-val">{stats.wins}</div>
          <div className="wlt-stat-lbl">Ganados</div>
        </div>
        <div className="wlt-stat">
          <div className="wlt-stat-val" style={{ color: winRateColor }}>
            {stats.win_rate}%
          </div>
          <div className="wlt-stat-lbl">Tasa de acierto</div>
        </div>
        <div className="wlt-stat">
          <div className="wlt-stat-val">{Number(stats.avg_points).toFixed(1)}</div>
          <div className="wlt-stat-lbl">Pts promedio</div>
        </div>
      </div>

      {/* Body */}
      <div className="wlt-body">

        {/* Recent activity */}
        <div className="wlt-activity">
          <div className="wlt-section-title">
            <HistoryOutlined /> Actividad reciente
          </div>

          {recentActivity.length === 0 ? (
            <div className="wlt-empty">Sin actividad reciente</div>
          ) : (
            <div className="wlt-activity-list">
              {recentActivity.map(item => {
                const badge = txBadge(item);
                const color = txColor(item.type);
                return (
                  <div key={item.id} className="wlt-activity-item">
                    <div className={`wlt-activity-icon wlt-activity-icon--${color}`}>
                      {txIcon(item.type)}
                    </div>
                    <div className="wlt-activity-info">
                      <span className="wlt-activity-desc">
                        {TX_LABELS[item.type] || item.type}
                      </span>
                      <span className="wlt-activity-date">
                        {item.date} · {item.status}
                      </span>
                    </div>
                    {badge.text ? (
                      <div className={`wlt-activity-badge wlt-activity-badge--${badge.color}`}>
                        {badge.text}
                      </div>
                    ) : (
                      <div className="wlt-activity-badge wlt-activity-badge--none">—</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {recentActivity.length > 0 && (
            <button className="wlt-link" onClick={() => navigate('/transactions')}>
              Ver historial completo →
            </button>
          )}
        </div>

        {/* Side */}
        <div className="wlt-side">

          {/* Quick actions */}
          <div className="wlt-actions">
            <button
              className="wlt-action-btn wlt-action-btn--blue"
              onClick={() => navigate('/purchase')}
            >
              <PlusCircleOutlined />
              Recargar
            </button>
            <button
              className="wlt-action-btn"
              onClick={() => setRedeemOpen(true)}
            >
              <DollarOutlined />
              Canjear
            </button>
            <button
              className="wlt-action-btn"
              onClick={() => navigate('/transactions')}
            >
              <HistoryOutlined />
              Historial
            </button>
          </div>

          {/* Credit info */}
          <div className="wlt-info">
            <div className="wlt-section-title" style={{ marginBottom: 10 }}>
              <InfoCircleOutlined /> Información
            </div>
            <div className="wlt-info-row">
              <span>1 crédito</span>
              <span>$5,000 COP</span>
            </div>
            <div className="wlt-info-row">
              <span>1 pronóstico</span>
              <span>1 crédito</span>
            </div>
            <div className="wlt-info-row">
              <span>Créditos pendientes</span>
              <span style={{ color: pendingCredits > 0 ? '#fbbf24' : '#475569' }}>
                {pendingCredits > 0 ? `+${pendingCredits}` : '—'}
              </span>
            </div>
          </div>

          {/* Security */}
          <div className="wlt-security">
            <SafetyOutlined />
            Sistema auditado y 100% seguro
          </div>
        </div>
      </div>

      {/* No-credits alert */}
      {(wallet?.credits === 0) && showActions && (
        <div className="wlt-alert">
          <InfoCircleOutlined />
          <span>
            Sin créditos disponibles.{' '}
            <button className="wlt-alert-link" onClick={() => navigate('/purchase')}>
              Recarga aquí
            </button>
          </span>
        </div>
      )}

      {/* Redeem modal */}
      <Modal
        open={redeemOpen}
        onCancel={() => { setRedeemOpen(false); setWithdrawBank(null); setWithdrawAccType(null); setWithdrawAccNum(''); }}
        title={null}
        footer={null}
        width={480}
        styles={{
          content: { background: '#0c1525', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 0 },
        }}
      >
        {/* Header del modal */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9' }}>Canjear dinero disponible</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>
            Saldo disponible: <strong style={{ color: '#22c55e' }}>${(wallet?.balance_PTS ?? 0).toLocaleString()} COP</strong>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Selector de tipo — cards clickeables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { val: 'credits', icon: <CreditCardOutlined />, label: 'Dinero a créditos', sub: '5,000 COP = 1 crédito' },
              { val: 'withdraw', icon: <BankOutlined />, label: 'Solicitar retiro', sub: 'Transferencia bancaria' },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setRedeemType(opt.val)}
                style={{
                  background: redeemType === opt.val ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${redeemType === opt.val ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '1.1rem', color: redeemType === opt.val ? '#22c55e' : '#64748b', marginBottom: 6 }}>
                  {opt.icon}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>{opt.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{opt.sub}</div>
              </button>
            ))}
          </div>

          {/* Formulario: Dinero a créditos */}
          {redeemType === 'credits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Mínimo $5,000 · Múltiplos de $5,000
              </div>
              <InputNumber
                min={5000} step={5000}
                value={pointsToConvert}
                onChange={(v) => setPointsToConvert(Number(v || 0))}
                style={{ width: '100%' }}
                prefix="$"
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={v => v.replace(/\./g, '')}
              />
              <div style={{
                background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Recibirás</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#22c55e' }}>
                  {Math.floor((pointsToConvert || 0) / 5000)} crédito{Math.floor((pointsToConvert || 0) / 5000) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Formulario: Solicitar retiro */}
          {redeemType === 'withdraw' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Banco */}
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Banco / Método de pago</div>
                <Select
                  placeholder="Selecciona banco o método"
                  value={withdrawBank}
                  onChange={(v) => { setWithdrawBank(v); setWithdrawAccType(null); setWithdrawAccNum(''); }}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'bancolombia', label: '🏦 Bancolombia' },
                    { value: 'nequi',       label: '📱 Nequi' },
                  ]}
                />
              </div>

              {/* Tipo de cuenta — solo Bancolombia */}
              {withdrawBank === 'bancolombia' && (
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Tipo de cuenta</div>
                  <Select
                    placeholder="Selecciona tipo de cuenta"
                    value={withdrawAccType}
                    onChange={setWithdrawAccType}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'ahorros',   label: 'Cuenta de Ahorros' },
                      { value: 'corriente', label: 'Cuenta Corriente' },
                    ]}
                  />
                </div>
              )}

              {/* Número de cuenta / celular */}
              {withdrawBank && (
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>
                    {withdrawBank === 'nequi' ? 'Número celular' : 'Número de cuenta'}
                  </div>
                  <Input
                    placeholder={withdrawBank === 'nequi' ? '3XX XXX XXXX' : 'Ingresa el número de cuenta'}
                    value={withdrawAccNum}
                    onChange={(e) => setWithdrawAccNum(e.target.value)}
                    maxLength={20}
                  />
                </div>
              )}

              {/* Monto */}
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Monto a transferir</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 6 }}>
                  Mínimo $20,000 · Máximo $1,000,000
                </div>
                <InputNumber
                  min={20000} max={1000000} step={1000}
                  value={withdrawAmount}
                  onChange={(v) => setWithdrawAmount(Number(v || 0))}
                  style={{ width: '100%' }}
                  prefix="$"
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={v => v.replace(/\./g, '')}
                />
              </div>

              <div style={{
                background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 10, padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8',
              }}>
                ⚠️ Las solicitudes de retiro son aprobadas manualmente en menos de 24 horas hábiles.
              </div>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              onClick={() => { setRedeemOpen(false); setWithdrawBank(null); setWithdrawAccType(null); setWithdrawAccNum(''); }}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '9px 20px', color: '#94a3b8',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleRedeemSubmit}
              disabled={redeemSubmitting}
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none', borderRadius: 10, padding: '9px 24px',
                color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                cursor: redeemSubmitting ? 'default' : 'pointer',
                opacity: redeemSubmitting ? 0.7 : 1,
              }}
            >
              {redeemSubmitting ? 'Procesando…' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WalletBalance;
