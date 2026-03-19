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
  HistoryOutlined, WarningOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MatchForm from '../../components/matches/MatchForm';
import competitionService from '../../services/competitionService';

const { Title, Text } = Typography;

const EditMatchPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [match, setMatch] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

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
    <div style={{ padding: '24px' }}>
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
                  icon={<ArrowLeftOutlined />}
                  className="btn-outline-primary"
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

