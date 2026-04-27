// frontend/src/pages/admin/polla/PollaAdminPage.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  Card, Tabs, Table, Button, Select, Tag, Modal, Form, Input,
  InputNumber, message, Space, Spin, Badge, Tooltip, Switch,
  Row, Col, Statistic, Checkbox,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, TrophyOutlined, TeamOutlined,
  SettingOutlined, UnorderedListOutlined, ReloadOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import pollaService from '../../../services/pollaService';
import { competitionsAPI, matchesAPI } from '../../../services/api';

const { Option } = Select;

const PHASES = [
  { value: 'groups', label: 'Fase de Grupos', color: 'blue', pts: 1 },
  { value: 'r32',    label: 'Ronda de 32',    color: 'purple', pts: 2 },
  { value: 'r16',    label: 'Octavos',        color: 'purple', pts: 2 },
  { value: 'qf',     label: 'Cuartos',        color: 'gold', pts: 3 },
  { value: 'sf',     label: 'Semifinales',    color: 'gold', pts: 3 },
  { value: 'third',  label: 'Tercer puesto',  color: 'green', pts: 3 },
  { value: 'final',  label: 'Final',          color: 'green', pts: 3 },
];

const STATUS_OPTIONS = [
  { value: 'upcoming',    label: 'Próximamente', color: 'default' },
  { value: 'open',        label: 'Abierta',      color: 'green' },
  { value: 'in_progress', label: 'En curso',     color: 'blue' },
  { value: 'finished',    label: 'Finalizada',   color: 'purple' },
  { value: 'cancelled',   label: 'Cancelada',    color: 'red' },
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

  // Competencias y partidos
  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useState(null);
  const [compMatches, setCompMatches]   = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Partidos en la polla
  const [pollaMatches, setPollaMatches] = useState([]);
  const [loadingPM, setLoadingPM]       = useState(false);

  // Selección múltiple
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkPhase, setBulkPhase]             = useState('groups');
  const [addingBulk, setAddingBulk]           = useState(false);

  // Participantes
  const [participants, setParticipants] = useState([]);
  const [loadingPart, setLoadingPart]   = useState(false);

  // ── Carga inicial ──────────────────────────────────────────────────────

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

  // ── Cargar partidos de una competencia ────────────────────────────────

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

  // ── Cargar partidos de la polla ───────────────────────────────────────

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

  // ── Cargar participantes ──────────────────────────────────────────────

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

  // ── IDs ya en la polla (para marcarlos como agregados) ────────────────
  const pollaMatchIds = new Set(pollaMatches.map(pm => pm.match_id));

  // ── Agregar partidos en bloque ────────────────────────────────────────

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

  // ── Quitar partido de la polla ────────────────────────────────────────

  const handleRemove = async (pmId) => {
    try {
      await pollaService.adminRemoveMatch(polla.id, pmId);
      message.success('Partido eliminado de la polla');
      loadPollaMatches();
    } catch (err) {
      message.error(err?.response?.data?.detail || 'No se pudo eliminar');
    }
  };

  // ── Actualizar rankings ───────────────────────────────────────────────

  const handleUpdateRankings = async () => {
    try {
      await pollaService.adminUpdateRankings(polla.id);
      message.success('Rankings actualizados');
      loadParticipants();
    } catch { message.error('Error al actualizar rankings'); }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
            ⚽ Admin — Polla Mundial 2026
          </h1>
          {polla && (
            <Tag color={STATUS_OPTIONS.find(s => s.value === polla.status)?.color || 'default'} style={{ marginTop: 6 }}>
              {STATUS_OPTIONS.find(s => s.value === polla.status)?.label || polla.status}
            </Tag>
          )}
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadPolla}>Recargar</Button>
      </div>

      {/* Stats rápidos */}
      {polla && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}><Card size="small"><Statistic title="Participantes" value={polla.participant_count} prefix={<TeamOutlined />} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small"><Statistic title="Premio actual" value={fmtCOP(polla.current_prize_cop)} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small"><Statistic title="Partidos en polla" value={pollaMatches.length} prefix={<UnorderedListOutlined />} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small"><Statistic title="Entrada" value={`${polla.entry_credits} créditos`} /></Card></Col>
        </Row>
      )}

      <Tabs
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
            label: <Badge count={pollaMatches.length} color="blue"><span style={{ paddingRight: 8 }}><UnorderedListOutlined /> Partidos en la polla</span></Badge>,
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
  const [creating, setCreating] = useState(false);

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
        setCreating(true);
        await pollaService.adminCreatePolla({ ...values, edition_year: 2026 });
        message.success('Polla creada');
      }
      onSaved();
    } catch (err) {
      message.error(err?.response?.data?.detail || 'Error al guardar');
    } finally { setSaving(false); setCreating(false); }
  };

  return (
    <Card>
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ maxWidth: 600 }}>
        <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
          <Input placeholder="Polla Mundial 2026" />
        </Form.Item>
        <Form.Item name="description" label="Descripción">
          <Input.TextArea rows={2} />
        </Form.Item>
        {polla && (
          <Form.Item name="status" label="Estado">
            <Select>
              {STATUS_OPTIONS.map(s => (
                <Option key={s.value} value={s.value}>
                  <Tag color={s.color}>{s.label}</Tag>
                </Option>
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
            <Form.Item name="platform_fee_pct" label="% plataforma">
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
              label="Suma por participante (COP)"
              extra="Lo que crece el pozo con cada inscrito. Ej: 32000"
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
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
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
  if (!polla) return <Card><p style={{ color: '#94a3b8' }}>Primero crea la Polla en la pestaña Configuración.</p></Card>;

  const pending = selectedRowKeys.filter(id => !pollaMatchIds.has(id));

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
          <span style={{ color: '#64748b', margin: '0 8px' }}>vs</span>
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
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: '',
      width: 100,
      render: (_, r) => pollaMatchIds.has(r.id)
        ? <Tag color="green"><CheckCircleOutlined /> En polla</Tag>
        : null,
    },
  ];

  // Filtrar los ya agregados de los disponibles
  const available = compMatches.filter(m => !pollaMatchIds.has(m.id));
  const alreadyIn = compMatches.filter(m => pollaMatchIds.has(m.id));

  return (
    <Card>
      {/* Selector de competencia */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <Select
          placeholder="Selecciona la competencia"
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
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {available.length} disponibles · {alreadyIn.length} ya en la polla
          </span>
        )}
      </div>

      {/* Barra de acción masiva */}
      {pending.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16, flexWrap: 'wrap',
        }}>
          <span style={{ fontWeight: 600 }}>{pending.length} partido(s) seleccionado(s)</span>
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
          >
            Agregar a la polla
          </Button>
          <Button onClick={() => onSelectChange([])}>Limpiar selección</Button>
        </div>
      )}

      {/* Tabla de partidos */}
      <Table
        rowKey="id"
        dataSource={compMatches}
        columns={cols}
        loading={loadingMatches}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        rowSelection={{
          selectedRowKeys,
          onChange: onSelectChange,
          getCheckboxProps: (record) => ({
            disabled: pollaMatchIds.has(record.id),
          }),
        }}
        rowClassName={(r) => pollaMatchIds.has(r.id) ? 'polla-admin-row-added' : ''}
        locale={{ emptyText: selectedComp ? 'Sin partidos en esta competencia' : 'Selecciona una competencia' }}
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
        return <Tag color={ph?.color}>{ph?.label || v}</Tag>;
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
        <span>
          {r.home_logo && <img src={r.home_logo} style={{ width: 20, marginRight: 6, verticalAlign: 'middle' }} alt="" />}
          {r.home_team || '?'}
          <span style={{ color: '#64748b', margin: '0 8px' }}>vs</span>
          {r.away_team || '?'}
          {r.away_logo && <img src={r.away_logo} style={{ width: 20, marginLeft: 6, verticalAlign: 'middle' }} alt="" />}
        </span>
      ),
    },
    {
      title: 'Estado',
      width: 100,
      render: (_, r) => r.is_scored
        ? <Tag color="green"><CheckCircleOutlined /> Puntuado</Tag>
        : <Tag color="default"><ClockCircleOutlined /> Pendiente</Tag>,
    },
    {
      title: 'Cierre predicciones',
      dataIndex: 'close_at',
      width: 140,
      render: fmtDate,
    },
    {
      title: '',
      width: 60,
      render: (_, r) => (
        <Tooltip title={r.is_scored ? 'Ya puntuado, no se puede eliminar' : 'Quitar de la polla'}>
          <Button
            danger size="small" icon={<DeleteOutlined />}
            disabled={r.is_scored}
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
    <Card>
      {/* Resumen por fase */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Tag
          style={{ cursor: 'pointer', fontWeight: phaseFilter === null ? 700 : 400 }}
          onClick={() => setPhaseFilter(null)}
        >
          Todos ({pollaMatches.length})
        </Tag>
        {groupedCounts.filter(p => p.count > 0).map(p => (
          <Tag
            key={p.value}
            color={phaseFilter === p.value ? p.color : 'default'}
            style={{ cursor: 'pointer' }}
            onClick={() => setPhaseFilter(phaseFilter === p.value ? null : p.value)}
          >
            {p.label} ({p.count})
          </Tag>
        ))}
        <Button size="small" icon={<ReloadOutlined />} onClick={onReload} style={{ marginLeft: 'auto' }} />
      </div>

      <Table
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
    { title: '#', dataIndex: 'rank', width: 50, render: r => r || '—' },
    { title: 'Usuario', dataIndex: 'username', render: (n, r) => <span>{n}{r.prize_won_cop > 0 && <Tag color="gold" style={{ marginLeft: 8 }}>Premio</Tag>}</span> },
    { title: 'Pts base', dataIndex: 'base_points', align: 'right' },
    { title: 'Bonos', dataIndex: 'bonus_points', align: 'right', render: v => <Tag color={v > 0 ? 'gold' : 'default'}>{v > 0 ? `+${v}` : v}</Tag> },
    { title: 'Total', dataIndex: 'total_points', align: 'right', render: v => <strong style={{ color: '#22c55e' }}>{v}</strong>, sorter: (a, b) => b.total_points - a.total_points, defaultSortOrder: 'descend' },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={onReload}>Recargar</Button>
        <Button type="primary" icon={<TrophyOutlined />} onClick={onUpdateRankings}>
          Recalcular rankings
        </Button>
      </div>
      <Table
        rowKey="user_id"
        dataSource={participants}
        columns={cols}
        loading={loading}
        size="small"
        pagination={{ pageSize: 30, showSizeChanger: false }}
      />
    </Card>
  );
}
