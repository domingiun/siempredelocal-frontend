// frontend/src/pages/matches/EditMatchPage.jsx - VERSIÓN COMPLETA
import React, { useState, useEffect } from 'react';
import { 
  Typography, Card, Row, Col, Button, message, 
  Breadcrumb, Spin, Alert, Space, Tag, Modal,
  Descriptions, Divider
} from 'antd';
import { 
  formatDateTimeUTC
} from '../../utils/dateFormatter';
import {
  ArrowLeftOutlined, LoadingOutlined,
  CalendarOutlined, TeamOutlined, TrophyOutlined,
  EditOutlined, DeleteOutlined, SaveOutlined,
  HistoryOutlined, WarningOutlined,
  SyncOutlined, SearchOutlined,
  CheckCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MatchForm from '../../components/matches/MatchForm';
import competitionService from '../../services/competitionService';
import api from '../../services/api';
import './EditMatchPage.css';

const { Title, Text } = Typography;

const EditMatchPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [match, setMatch] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating]       = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [hasChanges, setHasChanges]   = useState(false);

  // API-football state
  const [apiSearchDate,    setApiSearchDate]    = useState(null);
  const [apiFixtures,      setApiFixtures]      = useState([]);
  const [apiSearchLoading, setApiSearchLoading] = useState(false);
  const [apiSyncLoading,   setApiSyncLoading]   = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    
    fetchMatchData();
  }, [id]);

  useEffect(() => {
    // Verificar cambios cuando el match se actualiza
    if (match && originalData) {
      const changesDetected = JSON.stringify(match) !== JSON.stringify(originalData);
      setHasChanges(changesDetected);
    }
  }, [match, originalData]);

  const fetchMatchData = async () => {
    setLoading(true);
    try {
      console.log(`🔄 Cargando datos del partido ${id}...`);
      
      // Obtener el partido
      const matchRes = await competitionService.getMatch(id);
      const matchData = matchRes.data;
      setMatch(matchData);
      setOriginalData(JSON.parse(JSON.stringify(matchData)));
      
      console.log('✅ Partido cargado:', matchData);
      
      // Obtener información de la competencia
      if (matchData.competition_id) {
        try {
          const compRes = await competitionService.getCompetition(matchData.competition_id);
          setCompetition(compRes.data);
          console.log('✅ Competencia cargada:', compRes.data);
        } catch (compError) {
          console.error('❌ Error cargando competencia:', compError);
        }
      }
      
      // Obtener información de la jornada si existe
    if (id && matchData.round_id && matchData.competition_id) {
      try {
        const roundNumber = matchData.round_number;

        if (roundNumber) {
          const roundRes = await competitionService.getRoundByNumber(
            matchData.competition_id,
            roundNumber
          );
          setRound(roundRes.data);
        } else {
          const roundRes = await competitionService.getRound(
            matchData.competition_id,
            matchData.round_id
          );
          setRound(roundRes.data);
        }
      } catch (roundError) {
        console.warn('⚠️ Jornada no encontrada (esperado al crear)');
        setRound(null);
      }
    }
    } catch (error) {
      console.error('❌ Error cargando partido:', error);
      message.error('Error al cargar el partido');
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (updatedMatch) => {
    message.success('✅ Partido actualizado exitosamente!');
    
    Modal.success({
      title: 'Cambios guardados',
      content: (
        <div>
          <p>El partido ha sido actualizado correctamente.</p>
          <p>Se recalcularán las estadísticas automáticamente.</p>
        </div>
      ),
      onOk: () => {
        navigate(`/matches/${id}`);
      },
      okText: 'Ver partido actualizado',
      okType: 'default',
      okButtonProps: { className: 'btn-outline-primary' },
      cancelText: 'Quedarse aquí',
      cancelButtonProps: { className: 'btn-outline-primary' },
      onCancel: () => {
        // Recargar datos para ver cambios
        fetchMatchData();
      }
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '⚠️ ¿Eliminar partido permanentemente?',
      icon: <WarningOutlined />,
      content: (
        <div>
          <p><strong>Esta acción no se puede deshacer.</strong></p>
          <p>Se eliminarán:</p>
          <ul>
            <li>El registro del partido</li>
            <li>Estadísticas relacionadas</li>
            <li>Marcador y resultados</li>
          </ul>
          <p style={{ color: '#ff4d4f' }}>
            ⚠️ Esto afectará las tablas de posiciones.
          </p>
        </div>
      ),
      okText: 'Eliminar permanentemente',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await competitionService.deleteMatch(id);
          message.success('🗑️ Partido eliminado exitosamente');
          navigate('/matches');
        } catch (error) {
          console.error('❌ Error eliminando partido:', error);
          message.error('Error al eliminar el partido');
        }
      },
    });
  };

  const handleResetChanges = () => {
    Modal.confirm({
      title: '¿Restablecer cambios?',
      content: 'Se perderán todos los cambios no guardados.',
      okText: 'Sí, restablecer',
      cancelText: 'Cancelar',
      onOk: () => {
        if (originalData) {
          setMatch(JSON.parse(JSON.stringify(originalData)));
          message.info('Cambios restablecidos');
        }
      }
    });
  };

  // ── API-football handlers ──────────────────────────────────────────────

  const handleNamePreview = async () => {
    if (!apiSearchDate) { message.warning('Selecciona una fecha'); return; }
    setApiSearchLoading(true);
    setApiFixtures([]);
    try {
      const dateStr = apiSearchDate.format('YYYY-MM-DD');
      const res = await api.get(`/matches/admin/name-preview?date=${dateStr}`);
      setApiFixtures(res.data.comparisons || []);
      if (!res.data.comparisons?.length) message.info('Sin fixtures en api-football para esa fecha');
    } catch (err) {
      message.error(err?.response?.data?.detail || 'Error consultando api-football');
    } finally {
      setApiSearchLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setApiSyncLoading(true);
    try {
      const res = await api.post('/matches/admin/sync-now');
      const { updated, skipped, no_match, errors, api_called } = res.data;
      if (!api_called) {
        message.info('Sin partidos pendientes hoy — no se consumió ningún request de API');
      } else if (no_match > 0 && updated === 0) {
        message.warning(`Sync ejecutado pero ${no_match} partido(s) no encontraron match por nombre. Verifica la comparación de nombres.`);
      } else {
        message.success(`Sync completado: ${updated} actualizados, ${skipped} sin cambios`);
      }
      fetchMatchData();
    } catch (err) {
      message.error(err?.response?.data?.detail || 'Error en sync');
    } finally {
      setApiSyncLoading(false);
    }
  };

  // ── End API-football handlers ──────────────────────────────────────────

  const handleForceUpdate = async () => {
    setUpdating(true);
    try {
      // Forzar recálculo de estadísticas en el backend
      await competitionService.updateMatch(id, {
        ...match,
        force_recalculate: true
      });
      message.success('📊 Estadísticas recalculadas');
      fetchMatchData();
    } catch (error) {
      console.error('Error forzando actualización:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Si no es admin, mostrar acceso denegado
  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Alert
            title="Acceso Denegado"
            description="Solo los administradores pueden editar partidos."
            type="error"
            showIcon
          />
          <Button 
            type="primary" 
            onClick={() => navigate(`/matches/edit/${match.id}`)}
            style={{ marginTop: 16 }}
          >
            Volver a Partidos
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />} 
          size="large"
        />
        <Title level={4} style={{ marginTop: 16 }}>Cargando partido...</Title>
        <Text type="secondary">Preparando formulario de edición</Text>
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Alert
            title="Partido no encontrado"
            description={
              <div>
                <p>El partido que intenta editar no existe o fue eliminado.</p>
                <p>Redirigiendo a la lista de partidos...</p>
              </div>
            }
            type="error"
            showIcon
            action={
              <Button size="small" className="btn-outline-primary" onClick={() => navigate('/matches')}>
                Ir a Partidos
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    return formatDateTimeUTC(dateString);
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'blue';
      case 'in_progress': return 'orange';
      case 'finished': return 'green';
      case 'postponed': return 'yellow';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    const map = {
      'scheduled': 'Programado',
      'in_progress': 'En curso',
      'finished': 'Finalizado',
      'postponed': 'Aplazado',
      'cancelled': 'Cancelado'
    };
    return map[status] || status;
  };

  return (
    <div className="edit-match-page" style={{ padding: '24px' }}>
      {/* Breadcrumb */}
      <Breadcrumb
        style={{ marginBottom: 24 }}
        items={[
          { title: 'Partidos', onClick: () => navigate('/matches') },
          { 
            title: `${match.home_team?.name || 'Local'} vs ${match.away_team?.name || 'Visitante'}`, 
            onClick: () => navigate(`/matches/${id}`) 
          },
          { title: 'Edición Completa' },
        ]}
      />
      
      <Row gutter={[24, 24]}>
        {/* Header con información */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <EditOutlined />
                <span>Editar Partido - Modo Administrador</span>
                {hasChanges && (
                  <Tag color="orange" icon={<HistoryOutlined />}>
                    Cambios pendientes
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                <Button 
                  type="primary"
                  icon={<ArrowLeftOutlined />}
                  className="edit-match-primary"
                  onClick={() => navigate(`/matches/${id}`)}
                >
                  Ver Partido
                </Button>
                {hasChanges && (
                  <Button 
                    className="btn-outline-primary"
                    onClick={handleResetChanges}
                    disabled={!hasChanges}
                  >
                    Restablecer
                  </Button>
                )}
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                >
                  Eliminar
                </Button>
              </Space>
            }
          >
            <Row gutter={[24, 16]}>
                            
              {/* Información actual */}
              <Col xs={24} lg={12}>
                <Card size="small" title="Información Actual" variant={false}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Partido">
                      <Space>
                        <TeamOutlined />
                        <strong>{match.home_team?.name || 'Local'}</strong>
                        <span>vs</span>
                        <strong>{match.away_team?.name || 'Visitante'}</strong>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Estado">
                      <Tag color={getStatusColor(match.status)}>
                        {getStatusText(match.status)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Marcador">
                      {match.status === 'finished' 
                        ? `${match.home_score || 0} - ${match.away_score || 0}`
                        : '0 - 0 (programado)'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Fecha">
                      <Space>
                        <CalendarOutlined />
                        {formatDate(match.match_date)}
                      </Space>
                    </Descriptions.Item>
                    {match.stadium && (
                      <Descriptions.Item label="Estadio">
                        {match.stadium}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </Col>
              
              {/* Información de contexto */}
              <Col xs={24} lg={12}>
                <Card size="small" title="Contexto" variant={false}>
                  <Descriptions column={1} size="small">
                    {competition && (
                      <Descriptions.Item label="Competencia">
                        <Space>
                          <TrophyOutlined />
                          <strong>{competition.name}</strong>
                          <Tag size="small">{competition.season}</Tag>
                        </Space>
                      </Descriptions.Item>
                    )}
                    {round && (
                      <Descriptions.Item label="Jornada">
                        {round.name} (N° {round.round_number})
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="ID del Partido">
                      <Tag color="blue">#{match.id}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Última actualización">
                      {match.updated_at ? formatDate(match.updated_at) : 'No disponible'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Formulario de edición */}
        <Col span={24}>
          <MatchForm
            competitionId={match.competition_id}
            roundId={match.round_id}
            initialData={{
              ...match,
              // Enviar valor crudo para que MatchForm aplique parse UTC consistente.
              match_date: match.match_date,
              postponed_date: match.postponed_date
            }}
            mode="edit"
            onSuccess={handleSuccess}
            onCancel={() => navigate(`/matches/${id}`)}
            allowFullEdit={true} 
          />
        </Col>

        {/* Panel api-football */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <SyncOutlined style={{ color: '#1677ff' }} />
                <span>Sincronización automática — api-football</span>
                {match.api_synced_at && (
                  <Tag color="green" icon={<CheckCircleOutlined />}>Sincronizado</Tag>
                )}
              </Space>
            }
            extra={
              <Button
                icon={<SyncOutlined />}
                loading={apiSyncLoading}
                onClick={handleSyncNow}
                size="small"
              >
                Sync ahora
              </Button>
            }
          >
            {/* Estado de la última sync */}
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Última sync">
                {match.api_synced_at
                  ? <Space><ClockCircleOutlined />{formatDate(match.api_synced_at)}</Space>
                  : <span style={{ color: '#94a3b8' }}>Aún no sincronizado — se intentará en el próximo ciclo de 10 min si los nombres coinciden</span>
                }
              </Descriptions.Item>
              {match.api_fixture_id && (
                <Descriptions.Item label="Fixture ID interno">
                  <Tag color="blue">#{match.api_fixture_id}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Comparador de nombres */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,.06)', paddingTop: 16 }}>
              <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 13 }}>
                Comparar nombres con api-football
              </p>
              <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 12 }}>
                Si el sync no funciona, verifica que los nombres de los equipos coincidan con los de api-football.
                Busca por la fecha del partido y renombra los equipos si hay diferencias.
              </p>
              <Space.Compact style={{ width: '100%', maxWidth: 480 }}>
                <DatePicker
                  placeholder="Fecha del partido"
                  value={apiSearchDate}
                  onChange={setApiSearchDate}
                  defaultValue={match.match_date ? dayjs(match.match_date) : null}
                  style={{ flex: 1 }}
                  format="YYYY-MM-DD"
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  loading={apiSearchLoading}
                  onClick={handleNamePreview}
                >
                  Ver comparación
                </Button>
              </Space.Compact>

              {apiFixtures.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  {apiFixtures.map((f, i) => (
                    <div
                      key={f.fixture_id ?? i}
                      style={{
                        padding: '10px 14px',
                        border: `1px solid ${f.names_match ? '#b7eb8f' : '#ffa39e'}`,
                        borderRadius: 8,
                        marginBottom: 8,
                        background: f.names_match ? '#f6ffed' : '#fff2f0',
                      }}
                    >
                      <Row gutter={8} align="middle">
                        <Col flex="auto">
                          <Space wrap size={4}>
                            <Tag color="geekblue" style={{ fontSize: 11 }}>{f.league}</Tag>
                            {f.names_match
                              ? <Tag color="success" icon={<CheckCircleOutlined />}>Coincide</Tag>
                              : <Tag color="error">No coincide</Tag>
                            }
                          </Space>
                          <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                            <div style={{ fontSize: 12 }}>
                              <span style={{ color: '#94a3b8' }}>API: </span>
                              <strong>{f.api_home_team}</strong> vs <strong>{f.api_away_team}</strong>
                            </div>
                            <div style={{ fontSize: 12 }}>
                              <span style={{ color: '#94a3b8' }}>Tu BD: </span>
                              {f.local_home_team
                                ? <><strong>{f.local_home_team}</strong> vs <strong>{f.local_away_team}</strong></>
                                : <span style={{ color: '#ffa39e' }}>Sin partido local para esta fecha</span>
                              }
                            </div>
                          </div>
                        </Col>
                        {!f.names_match && f.local_match_id && (
                          <Col>
                            <Button
                              size="small"
                              type="dashed"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `Local: ${f.local_home_team} → API: ${f.api_home_team}\n` +
                                  `Local: ${f.local_away_team} → API: ${f.api_away_team}`
                                );
                                message.info('Nombres copiados al portapapeles');
                              }}
                            >
                              Copiar diferencias
                            </Button>
                          </Col>
                        )}
                      </Row>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Panel de acciones avanzadas */}
        <Col span={24}>
          <Card
            title={<Space><WarningOutlined />Acciones Avanzadas</Space>}
            type="inner"
          >
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Alert
                title="⚠️ Advertencia"
                description="Estas acciones pueden afectar significativamente las estadísticas del sistema."
                type="warning"
                showIcon
              />
              
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Button 
                    block
                    icon={<HistoryOutlined />}
                    onClick={handleForceUpdate}
                    loading={updating}
                    type="dashed"
                    danger
                  >
                    Forzar recálculo de estadísticas
                  </Button>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 8 }}>
                    Recalcula tablas de posiciones y estadísticas
                  </Text>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Button 
                    block
                    icon={<SaveOutlined />}
                    onClick={() => message.info('Función en desarrollo')}
                    type="dashed"
                  >
                    Crear PTSia de seguridad
                  </Button>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 8 }}>
                    Guarda estado actual antes de cambios masivos
                  </Text>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EditMatchPage;

