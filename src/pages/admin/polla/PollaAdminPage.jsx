// frontend/src/pages/admin/polla/PollaAdminPage.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  Card, Tabs, Table, Button, Select, Tag, Modal, Form, Input,
  InputNumber, message, Space, Spin, Badge, Tooltip,
  Row, Col,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, TrophyOutlined, TeamOutlined,
  SettingOutlined, UnorderedListOutlined, ReloadOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CalendarOutlined,
} from '@ant-design/icons';
import pollaService from '../../../services/pollaService';
import { competitionsAPI, matchesAPI } from '../../../services/api';
import './PollaAdminPage.css';

const { Option } = Select;

const PHASES = [
  { value: 'groups', label: 'Fase de Grupos', color: 'blue',   pts: 1 },
  { value: 'r32',    label: 'Ronda de 32',    color: 'purple', pts: 2 },
  { value: 'r16',    label: 'Octavos',        color: 'purple', pts: 2 },
  { value: 'qf',     label: 'Cuartos',        color: 'gold',   pts: 3 },
  { value: 'sf',     label: 'Semifinales',    color: 'gold',   pts: 3 },
  { value: 'third',  label: 'Tercer puesto',  color: 'green',  pts: 3 },
  { value: 'final',  label: 'Final',          color: 'green',  pts: 3 },
];

const STATUS_OPTIONS = [
  { value: 'upcoming',    label: 'Próximamente', cls: 'upcoming' },
  { value: 'open',        label: 'Abierta',      cls: 'open' },
  { value: 'in_progress', label: 'En curso',     cls: 'in_progress' },
  { value: 'finished',    label: 'Finalizada',   cls: 'finished' },
  { value: 'cancelled',   label: 'Cancelada',    cls: 'cancelled' },
];

const fmtDate = (d) => d
  ? new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
  : '—';

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

export default function PollaAdminPage() {
  const [polla, setPolla]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('config');

  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useState(null);
  const [compMatches, setCompMatches]   = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const [pollaMatches, setPollaMatches] = useState([]);
  const [loadingPM, setLoadingPM]       = useState(false);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkPhase, setBulkPhase]             = useState('groups');
  const [addingBulk, setAddingBulk]           = useState(false);

  const [participants, setParticipants] = useState([]);
  const [loadingPart, setLoadingPart]   = useState(false);

  const loadPolla = useCallback(async () => {
    setLoading(true);
    try {
      const list = await pollaService.listPollas();
      if (list.length > 0) {
        const detail = await pollaService.getPolla(list[0].id);
        setPolla(detail);
      }
    } catch { }
    finally { setLoading(false); }
  }, []);

  const loadCompetitions = useCallback(async () => {
    try {
      const res = await competitionsAPI.getAll({ limit: 100 });
      setCompetitions(res.data?.competitions || res.data || []);
    } catch { }
  }, []);

  useEffect(() => {
    loadPolla();
    loadCompetitions();
  }, [loadPolla, loadCompetitions]);

  const loadCompMatches = useCallback(async (compId) => {
    setLoadingMatches(true);
    try {
      const res = await matchesAPI.getByCompetition(compId, { limit: 200 });
      setCompMatches(res.data?.matches || res.data || []);
    } catch { message.error('No se pudieron cargar los partidos'); }
    finally { setLoadingMatches(false); }
  }, []);

  const handleCompChange = (compId) => {
    setSelectedComp(compId);
    setSelectedRowKeys([]);
    loadCompMatches(compId);
  };

  const loadPollaMatches = useCallback(async () => {
    if (!polla) return;
    setLoadingPM(true);
    try {
      const data = await pollaService.getPollaMatches(polla.id);
      setPollaMatches(data);
    } catch { }
    finally { setLoadingPM(false); }
  }, [polla]);

  useEffect(() => {
    if (activeTab === 'matches') loadPollaMatches();
  }, [activeTab, loadPollaMatches]);

  const loadParticipants = useCallback(async () => {
    if (!polla) return;
    setLoadingPart(true);
    try {
      const data = await pollaService.adminListParticipants(polla.id);
      setParticipants(data);
    } catch { }
    finally { setLoadingPart(false); }
  }, [polla]);

  useEffect(() => {
    if (activeTab === 'participants') loadParticipants();
  }, [activeTab, loadParticipants]);

  const pollaMatchIds = new Set(pollaMatches.map(pm => pm.match_id));

  const handleAddBulk = async () => {
    if (!polla || selectedRowKeys.length === 0) return;
    setAddingBulk(true);
    let ok = 0; let fail = 0;
    for (const matchId of selectedRowKeys) {
      try {
        await pollaService.adminAddMatch(polla.id, {
          match_id: matchId,
          phase: bulkPhase,
          match_order: 0,
        });
        ok++;
      } catch { fail++; }
    }
    message.success(`${ok} partido(s) agregados${fail > 0 ? ` · ${fail} fallaron` : ''}`);
    setSelectedRowKeys([]);
    setAddingBulk(false);
    loadPollaMatches();
  };

  const handleRemove = async (pmId) => {
    try {
      await pollaService.adminRemoveMatch(polla.id, pmId);
      message.success('Partido eliminado de la polla');
      loadPollaMatches();
    } catch (err) {
      message.error(err?.response?.data?.detail || 'No se pudo eliminar');
    }
  };

  const handleUpdateRankings = async () => {
    try {
      await pollaService.adminUpdateRankings(polla.id);
      message.success('Rankings actualizados');
      loadParticipants();
    } catch { message.error('Error al actualizar rankings'); }
  };

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const statusOpt = STATUS_OPTIONS.find(s => s.value === polla?.status);

  return (
    <div className="polla-admin">

      {/* Hero header */}
      <div className="polla-admin__hero">
        <div className="polla-admin__hero-top">
          <div className="polla-admin__title-block">
            <h1>⚽ Admin — Polla Mundial 2026</h1>
            <p>Gestiona la polla, partidos y participantes del Mundial 2026</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {polla && statusOpt && (
              <span className={`polla-admin__status polla-admin__status--${statusOpt.cls}`}>
                {statusOpt.label}
              </span>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={loadPolla}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
            >
              Recargar
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      {polla && (
        <div className="polla-admin__stats">
          <div className="polla-admin__stat">
            <div className="polla-admin__stat-icon polla-admin__stat-icon--blue">
              <TeamOutlined />
            </div>
            <div>
              <div className="polla-admin__stat-val">{polla.participant_count}</div>
              <div className="polla-admin__stat-lbl">Participantes</div>
            </div>
          </div>
          <div className="polla-admin__stat">
            <div className="polla-admin__stat-icon polla-admin__stat-icon--gold">
              <TrophyOutlined />
            </div>
            <div>
              <div className="polla-admin__stat-val" style={{ fontSize: '1rem' }}>{fmtCOP(polla.current_prize_cop)}</div>
              <div className="polla-admin__stat-lbl">Premio actual</div>
            </div>
          </div>
          <div className="polla-admin__stat">
            <div className="polla-admin__stat-icon polla-admin__stat-icon--purple">
              <UnorderedListOutlined />
            </div>
            <div>
              <div className="polla-admin__stat-val">{pollaMatches.length}</div>
              <div className="polla-admin__stat-lbl">Partidos en la polla</div>
            </div>
          </div>
          <div className="polla-admin__stat">
            <div className="polla-admin__stat-icon polla-admin__stat-icon--green">
              <CalendarOutlined />
            </div>
            <div>
              <div className="polla-admin__stat-val">{polla.entry_credits} créditos</div>
              <div className="polla-admin__stat-lbl">Inscripción</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        className="polla-admin__tabs"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'config',
            label: <><SettingOutlined /> Configuración</>,
            children: <ConfigTab polla={polla} onSaved={loadPolla} />,
          },
          {
            key: 'add',
            label: <><PlusOutlined /> Agregar partidos</>,
            children: (
              <AddMatchesTab
                polla={polla}
                competitions={competitions}
                selectedComp={selectedComp}
                onCompChange={handleCompChange}
                compMatches={compMatches}
                loadingMatches={loadingMatches}
                pollaMatchIds={pollaMatchIds}
                selectedRowKeys={selectedRowKeys}
                onSelectChange={setSelectedRowKeys}
                bulkPhase={bulkPhase}
                onBulkPhaseChange={setBulkPhase}
                onAddBulk={handleAddBulk}
                addingBulk={addingBulk}
              />
            ),
          },
          {
            key: 'matches',
            label: (
              <Badge count={pollaMatches.length} color="#22c55e" size="small">
                <span style={{ paddingRight: 10 }}><UnorderedListOutlined /> Partidos ({pollaMatches.length})</span>
              </Badge>
            ),
            children: (
              <PollaMatchesTab
                pollaMatches={pollaMatches}
                loading={loadingPM}
                onRemove={handleRemove}
                onReload={loadPollaMatches}
              />
            ),
          },
          {
            key: 'participants',
            label: <><TeamOutlined /> Participantes ({polla?.participant_count || 0})</>,
            children: (
              <ParticipantsTab
                participants={participants}
                loading={loadingPart}
                onUpdateRankings={handleUpdateRankings}
                onReload={loadParticipants}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

// ── Tab: Configuración ─────────────────────────────────────────────────

function ConfigTab({ polla, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (polla) {
      form.setFieldsValue({
        name: polla.name,
        description: polla.description,
        status: polla.status,
        entry_credits: polla.entry_credits,
        guaranteed_prize_cop: polla.guaranteed_prize_cop,
        prize_per_user_cop: polla.prize_per_user_cop,
        threshold_users: polla.threshold_users,
        platform_fee_pct: polla.platform_fee_pct,
      });
    }
  }, [polla, form]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (polla) {
        await pollaService.adminUpdatePolla(polla.id, values);
        message.success('Polla actualizada');
      } else {
        await pollaService.adminCreatePolla({ ...values, edition_year: 2026 });
        message.success('Polla creada');
      }
      onSaved();
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 401 || status === 403) {
        message.error('Sesión expirada — vuelve a iniciar sesión');
      } else if (detail) {
        message.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      } else {
        message.error(`Error al guardar (${status || 'sin respuesta'})`);
      }
    } finally { setSaving(false); }
  };

  return (
    <Card className="pa-card">
      <div className="pa-section-label">Datos de la polla</div>
      <Form form={form} layout="vertical" onFinish={handleSave} className="pa-form" style={{ maxWidth: 620 }}>
        <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
          <Input placeholder="Polla Mundial 2026" />
        </Form.Item>
        <Form.Item name="description" label="Descripción">
          <Input.TextArea rows={2} placeholder="Descripción visible para los participantes" />
        </Form.Item>

        {polla && (
          <Form.Item name="status" label="Estado">
            <Select>
              {STATUS_OPTIONS.map(s => (
                <Option key={s.value} value={s.value}>{s.label}</Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="entry_credits" label="Créditos de entrada">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="platform_fee_pct" label="% comisión plataforma">
              <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="guaranteed_prize_cop"
              label="Premio mínimo garantizado (COP)"
              extra="Ej: 1000000 = $1.000.000"
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={v => v ? `$ ${Number(v).toLocaleString('es-CO')}` : ''}
                parser={v => v.replace(/[^0-9]/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="prize_per_user_cop"
              label="Premio por participante (COP)"
              extra="Lo que suma cada inscripción al pozo"
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={v => v ? `$ ${Number(v).toLocaleString('es-CO')}` : ''}
                parser={v => v.replace(/[^0-9]/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 8 }}>
          <Button type="primary" htmlType="submit" loading={saving} className="pa-form-save-btn">
            {polla ? 'Guardar cambios' : 'Crear Polla'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

// ── Tab: Agregar partidos ──────────────────────────────────────────────

function AddMatchesTab({
  polla, competitions, selectedComp, onCompChange,
  compMatches, loadingMatches, pollaMatchIds,
  selectedRowKeys, onSelectChange,
  bulkPhase, onBulkPhaseChange, onAddBulk, addingBulk,
}) {
  if (!polla) {
    return (
      <Card className="pa-card">
        <div className="pa-empty">
          <SettingOutlined style={{ fontSize: 36, color: '#334155' }} />
          <p>Primero crea la Polla en la pestaña Configuración.</p>
        </div>
      </Card>
    );
  }

  const pending = selectedRowKeys.filter(id => !pollaMatchIds.has(id));
  const available = compMatches.filter(m => !pollaMatchIds.has(m.id));
  const alreadyIn = compMatches.filter(m => pollaMatchIds.has(m.id));

  const cols = [
    {
      title: 'Fecha',
      dataIndex: 'match_date',
      width: 140,
      render: fmtDate,
      sorter: (a, b) => new Date(a.match_date) - new Date(b.match_date),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Partido',
      render: (_, r) => (
        <span>
          {r.home_team?.name || r.home_team_name || '?'}
          <span style={{ color: '#475569', margin: '0 8px' }}>vs</span>
          {r.away_team?.name || r.away_team_name || '?'}
        </span>
      ),
    },
    {
      title: 'Jornada',
      dataIndex: 'round_name',
      width: 160,
      render: (v, r) => v || r.round?.name || '—',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      width: 110,
      render: (v) => <Tag style={{ fontSize: '0.75rem' }}>{v}</Tag>,
    },
    {
      title: '',
      width: 100,
      render: (_, r) => pollaMatchIds.has(r.id)
        ? <Tag color="green" style={{ fontSize: '0.72rem' }}><CheckCircleOutlined /> En polla</Tag>
        : null,
    },
  ];

  return (
    <Card className="pa-card">
      <div className="pa-section-label">Selecciona una competencia</div>
      <div className="pa-comp-selector">
        <Select
          placeholder="Buscar competencia..."
          style={{ width: 320 }}
          onChange={onCompChange}
          value={selectedComp}
          showSearch
          optionFilterProp="children"
        >
          {competitions.map(c => (
            <Option key={c.id} value={c.id}>{c.name}</Option>
          ))}
        </Select>
        {compMatches.length > 0 && (
          <span className="pa-comp-count">
            {available.length} disponibles · {alreadyIn.length} ya en la polla
          </span>
        )}
      </div>

      {pending.length > 0 && (
        <div className="pa-bulk-bar">
          <span className="pa-bulk-bar-label">{pending.length} partido(s) seleccionado(s)</span>
          <Select value={bulkPhase} onChange={onBulkPhaseChange} style={{ width: 180 }}>
            {PHASES.map(p => (
              <Option key={p.value} value={p.value}>
                <Tag color={p.color}>{p.label}</Tag>
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddBulk}
            loading={addingBulk}
            style={{ background: '#22c55e', borderColor: '#22c55e' }}
          >
            Agregar a la polla
          </Button>
          <Button
            onClick={() => onSelectChange([])}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
          >
            Limpiar
          </Button>
        </div>
      )}

      <Table
        className="pa-table"
        rowKey="id"
        dataSource={compMatches}
        columns={cols}
        loading={loadingMatches}
        size="small"
        pagination={{ pageSize: 200, showSizeChanger: false, hideOnSinglePage: true }}
        rowSelection={{
          selectedRowKeys,
          onChange: onSelectChange,
          getCheckboxProps: (record) => ({
            disabled: pollaMatchIds.has(record.id),
          }),
        }}
        rowClassName={(r) => pollaMatchIds.has(r.id) ? 'polla-admin-row-added' : ''}
        locale={{ emptyText: selectedComp ? 'Sin partidos en esta competencia' : 'Selecciona una competencia para ver sus partidos' }}
      />
    </Card>
  );
}

// ── Tab: Partidos en la polla ──────────────────────────────────────────

function PollaMatchesTab({ pollaMatches, loading, onRemove, onReload }) {
  const [phaseFilter, setPhaseFilter] = useState(null);

  const filtered = phaseFilter
    ? pollaMatches.filter(pm => pm.phase === phaseFilter)
    : pollaMatches;

  const groupedCounts = PHASES.map(p => ({
    ...p,
    count: pollaMatches.filter(pm => pm.phase === p.value).length,
  }));

  const cols = [
    {
      title: 'Fase',
      dataIndex: 'phase',
      width: 130,
      render: (v) => {
        const ph = PHASES.find(p => p.value === v);
        return <Tag color={ph?.color} style={{ fontSize: '0.75rem' }}>{ph?.label || v}</Tag>;
      },
    },
    {
      title: 'Fecha',
      dataIndex: 'match_date',
      width: 140,
      render: fmtDate,
      sorter: (a, b) => new Date(a.match_date) - new Date(b.match_date),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Partido',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
          {r.home_logo && <img src={r.home_logo} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} alt="" />}
          <span style={{ whiteSpace: 'nowrap' }}>{r.home_team || '?'}</span>
          <span style={{ color: '#475569', flexShrink: 0 }}>vs</span>
          <span style={{ whiteSpace: 'nowrap' }}>{r.away_team || '?'}</span>
          {r.away_logo && <img src={r.away_logo} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} alt="" />}
        </div>
      ),
    },
    {
      title: 'Estado',
      width: 120,
      render: (_, r) => r.is_scored
        ? <Tag color="green" style={{ fontSize: '0.72rem' }}><CheckCircleOutlined /> Puntuado</Tag>
        : <Tag style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#64748b' }}><ClockCircleOutlined /> Pendiente</Tag>,
    },
    {
      title: 'Cierre',
      dataIndex: 'close_at',
      width: 140,
      render: fmtDate,
    },
    {
      title: '',
      width: 50,
      render: (_, r) => (
        <Tooltip title={r.is_scored ? 'Ya puntuado' : 'Quitar de la polla'}>
          <Button
            danger size="small" icon={<DeleteOutlined />}
            disabled={r.is_scored}
            style={{ opacity: r.is_scored ? 0.4 : 1 }}
            onClick={() => Modal.confirm({
              title: '¿Quitar este partido de la polla?',
              content: `${r.home_team} vs ${r.away_team}`,
              onOk: () => onRemove(r.id),
            })}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Card className="pa-card">
      <div className="pa-phase-pills">
        <span
          className={`pa-pill${phaseFilter === null ? ' pa-pill--active' : ''}`}
          onClick={() => setPhaseFilter(null)}
        >
          Todos ({pollaMatches.length})
        </span>
        {groupedCounts.filter(p => p.count > 0).map(p => (
          <span
            key={p.value}
            className={`pa-pill${phaseFilter === p.value ? ' pa-pill--active' : ''}`}
            onClick={() => setPhaseFilter(phaseFilter === p.value ? null : p.value)}
          >
            {p.label} ({p.count})
          </span>
        ))}
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={onReload}
          style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
        />
      </div>

      <Table
        className="pa-table"
        rowKey="id"
        dataSource={filtered}
        columns={cols}
        loading={loading}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />
    </Card>
  );
}

// ── Tab: Participantes ─────────────────────────────────────────────────

function ParticipantsTab({ participants, loading, onUpdateRankings, onReload }) {
  const cols = [
    {
      title: '#',
      dataIndex: 'rank',
      width: 50,
      render: (r) => <span style={{ color: '#64748b', fontWeight: 700 }}>{r || '—'}</span>,
    },
    {
      title: 'Usuario',
      dataIndex: 'username',
      render: (n, r) => (
        <span>
          {n}
          {r.prize_won_cop > 0 && (
            <Tag color="gold" style={{ marginLeft: 8, fontSize: '0.72rem' }}>
              <TrophyOutlined /> Premio
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: 'Pts base',
      dataIndex: 'base_points',
      align: 'right',
      render: (v) => <span style={{ color: '#94a3b8' }}>{v}</span>,
    },
    {
      title: 'Bonos',
      dataIndex: 'bonus_points',
      align: 'right',
      render: (v) => (
        <span style={{ color: v > 0 ? '#fbbf24' : '#475569', fontWeight: v > 0 ? 700 : 400 }}>
          {v > 0 ? `+${v}` : v}
        </span>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total_points',
      align: 'right',
      render: (v) => <strong style={{ color: '#22c55e', fontSize: '1rem' }}>{v}</strong>,
      sorter: (a, b) => b.total_points - a.total_points,
      defaultSortOrder: 'descend',
    },
  ];

  return (
    <Card className="pa-card">
      <div className="pa-actions">
        <Button
          icon={<ReloadOutlined />}
          onClick={onReload}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
        >
          Recargar
        </Button>
        <Button
          type="primary"
          icon={<TrophyOutlined />}
          onClick={onUpdateRankings}
          style={{ background: '#22c55e', borderColor: '#22c55e' }}
        >
          Recalcular rankings
        </Button>
      </div>
      <Table
        className="pa-table"
        rowKey="user_id"
        dataSource={participants}
        columns={cols}
        loading={loading}
        size="small"
        pagination={{ pageSize: 30, showSizeChanger: false }}
        locale={{ emptyText: 'Sin participantes aún' }}
      />
    </Card>
  );
}
