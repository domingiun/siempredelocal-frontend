//frontend/src/components/matches/MatchForm.jsx
import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Select, DatePicker, InputNumber, 
  Row, Col, Card, Space, Button, Alert, Typography, Tag, message,
  Modal,
  Collapse, 
  Tooltip,
  Badge
} from 'antd';
import { 
  TeamOutlined, CalendarOutlined, EnvironmentOutlined,
  TrophyOutlined, GlobalOutlined,
  InfoCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  WarningOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { formatForInputUTC } from '../../utils/dateFormatter';
import { matchesAPI, competitionsAPI, teamsAPI } from '../../services/api';
import api from '../../services/api';

const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;

const MatchForm = ({ 
  competitionId, 
  roundId, 
  initialData = {}, 
  mode = 'create',
  onSuccess,
  onCancel,
  allowFullEdit = false
}) => {
  const [form] = Form.useForm();
  const [teams, setTeams] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isWorldCup, setIsWorldCup] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [allCompetitions, setAllCompetitions] = useState([]);
  const [competitionRounds, setCompetitionRounds] = useState([]);
  const status = Form.useWatch('status', form);
  const homeTeamId = Form.useWatch('home_team_id', form);
  const selectedCompetitionId = Form.useWatch('competition_id', form) || competitionId;
  const worldCupStadiums = [
    'Estadio Azteca',
    'Estadio Akron',
    'Estadio BBVA',
    'BMO Field',
    'BC Place',
    'Mercedes-Benz Stadium',
    'Gillette Stadium',
    'AT&T Stadium',
    'NRG Stadium',
    'Arrowhead Stadium',
    'SoFi Stadium',
    'Hard Rock Stadium',
    'MetLife Stadium',
    'Lincoln Financial Field',
    "Levi's Stadium",
    'Lumen Field'
  ];
  const worldCupCities = [
    'Ciudad de México',
    'Guadalajara',
    'Monterrey',
    'Toronto',
    'Vancouver',
    'Atlanta',
    'Boston',
    'Dallas',
    'Houston',
    'Kansas City',
    'Los Ángeles',
    'Miami',
    'Nueva York / Nueva Jersey',
    'Filadelfia',
    'Área de la Bahía (San Francisco)',
    'Seattle'
  ];

  // 🔥 NUEVO: Observador para validación de estado FINALIZADO
  useEffect(() => {
    if (status === 'finished') {
      const homeScore = form.getFieldValue('home_score');
      const awayScore = form.getFieldValue('away_score');
      
      // Validar que tenga marcador
      if (homeScore === undefined || awayScore === undefined || 
          homeScore === null || awayScore === null) {
        message.warning({
          content: 'Partidos FINALIZADOS requieren marcador',
          icon: <ExclamationCircleOutlined />,
          duration: 3
        });
      }
    }
  }, [status, form]);

  useEffect(() => {
    if (competitionId || allowFullEdit) {
      fetchCompetitionDetails();
      fetchTeams();
      
      if (allowFullEdit && mode === 'edit') {
        fetchAllCompetitions();
      }
    }
  }, [competitionId, allowFullEdit, mode]);

  const fetchAllCompetitions = async () => {
    try {
      const response = await competitionsAPI.getAll({ limit: 100 });
      setAllCompetitions(response.data || []);
    } catch (error) {
      console.error('Error fetching all competitions:', error);
    }
  };

  useEffect(() => {
    if (selectedCompetitionId) {
      console.log(`🔄 Competencia seleccionada: ${selectedCompetitionId}`);
      fetchTeams();
      fetchCompetitionDetails();
      fetchCompetitionRounds(selectedCompetitionId);
      
      if (mode === 'create') {
        form.setFieldsValue({ round_id: null });
      }
    }
  }, [selectedCompetitionId, formReady]);

  const parseDate = (dateString) => {
    if (!dateString) return null;
    return formatForInputUTC(dateString);
  };

  // Cargar datos iniciales - CORREGIDO
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0 && !formReady) {
      // 🔥 CORRECCIÓN: Convertir estado del backend a formato frontend
      const backendToFrontendStatus = {
        'Programado': 'scheduled',
        'En curso': 'in_progress',
        'Finalizado': 'finished',
        'Cancelado': 'cancelled',
        'Aplazado': 'postponed'
      };
      
      const formattedData = {
        ...initialData,
        match_date: parseDate(initialData.match_date),
        postponed_date: parseDate(initialData.postponed_date),
        home_score: initialData.home_score ?? 0,
        away_score: initialData.away_score ?? 0,
        // 🔥 CONVERTIR ESTADO
        status: backendToFrontendStatus[initialData.status] || 'scheduled',
        competition_id: allowFullEdit && mode === 'edit' ? initialData.competition_id : undefined
      };
      
      form.setFieldsValue(formattedData);
      setFormReady(true);
      
      if (allowFullEdit && mode === 'edit' && initialData.competition_id) {
        fetchCompetitionRounds(initialData.competition_id);
      }
    }
  }, [initialData, form, formReady, allowFullEdit, mode]);

  useEffect(() => {
    if (homeTeamId && !isWorldCup && formReady) {
      const selectedTeam = teams.find(t => t.id === homeTeamId);
      if (selectedTeam && !allowFullEdit) {
        form.setFieldsValue({
          stadium: selectedTeam.stadium || '',
          city: selectedTeam.city || ''
        });
      }
    }
  }, [homeTeamId, isWorldCup, formReady, teams, form, allowFullEdit]);

  const fetchCompetitionDetails = async () => {
    try {
      const compId = selectedCompetitionId || competitionId;
      if (!compId) return;

      const response = await competitionsAPI.getById(compId);
      setCompetition(response.data);
      
      // Detectar si es mundial
      const compName = response.data?.name?.toLowerCase() || '';
      setIsWorldCup(
        compName.includes('world cup') || 
        compName.includes('mundial') || 
        compName.includes('PTSa mundial')
      );

    } catch (error) {
      console.error('Error fetching competition details:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const currentCompId = selectedCompetitionId || competitionId;
      
      if (!currentCompId) {
        try {
          const response = await teamsAPI.getAll({ limit: 100 });
          const sortedTeams = [...response.data || []].sort((b, a) => 
            a.name.localeCompare(b.name)
          );
          setTeams(sortedTeams);
        } catch (error) {
          console.error("Error cargando todos los equipos:", error);
          setTeams([]);
        }
        return;
      }
      
      // 🔥 SOLUCIÓN: Usar el endpoint CORRECTO
      try {
        console.log(`🔍 Cargando equipos para competencia ${currentCompId}`);
        
        // OPCIÓN A: Usar equipos YA en la competencia
        const response = await api.get(`/competitions/${currentCompId}/teams`);
        
        if (response.data && Array.isArray(response.data)) {
          const sortedTeams = [...response.data].sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          setTeams(sortedTeams);
          console.log(`✅ ${sortedTeams.length} equipos cargados de /competitions/${currentCompId}/teams`);
          return;
        }
      } catch (error) {
        console.warn("Endpoint /competitions/{id}/teams falló:", error.message);
      }
      
      // OPCIÓN B: Fallback - obtener equipos del país de la competencia
      try {
        // 1. Obtener información de la competencia
        const competitionRes = await api.get(`/competitions/${currentCompId}`);
        const competition = competitionRes.data;
        const country = competition.country;
        
        if (!country) {
          console.warn("La competencia no tiene país definido");
          setTeams([]);
          return;
        }
        
        console.log(`🌍 Buscando equipos de ${country} para ${competition.name}`);
        
        // 2. Obtener TODOS los equipos del país
        const teamsRes = await api.get('/teams/', {
          params: {
            country: country,
            is_active: true,
            limit: 100
          }
        });
        
        const allCountryTeams = teamsRes.data || [];
        const sortedTeams = [...allCountryTeams].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setTeams(sortedTeams);
        console.log(`✅ ${sortedTeams.length} equipos de ${country} disponibles`);
        
      } catch (error) {
        console.error("Error en fallback por país:", error);
        setTeams([]);
      }
      
    } catch (error) {
      console.error("Error crítico en fetchTeams:", error);
      setTeams([]);
    }
  };

  const fetchCompetitionRounds = async (compId) => {  
    try {
      if (!compId) {
        setCompetitionRounds([]);
        return;
      }
      
      const response = await api.get(`/competitions/${compId}/rounds`, {  
        params: { limit: 50 }
      });
      
      const roundsData = response.data || [];
      const formattedRounds = roundsData.map(round => ({
        id: round.id,
        name: round.name || `Jornada ${round.round_number}`,
        round_number: round.round_number,
        is_completed: round.is_completed || false
      }));

      const orderedRounds = formattedRounds
        .slice()
        .sort((a, b) => (b.round_number || 0) - (a.round_number || 0));
      
      setCompetitionRounds(orderedRounds);
      
    } catch (error) {
      console.error(`Error cargando jornadas:`, error);
      setCompetitionRounds([]);
    }
  };

  const validateTeams = (_, value) => {
    const homeTeam = form.getFieldValue('home_team_id');
    const awayTeam = form.getFieldValue('away_team_id');
    if (homeTeam && awayTeam && homeTeam === awayTeam) {
      return Promise.reject(new Error('El equipo local y visitante no pueden ser el mismo'));
    }
    return Promise.resolve();
  };

  // 🔥 CORREGIDO: handleSubmit con validación mejorada
  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      // Confirmación para cambios importantes
      if (allowFullEdit && mode === 'edit') {
        const hasMajorChanges = checkForMajorChanges(values);
        if (hasMajorChanges) {
          const confirmed = await confirmMajorChanges(values);
          if (!confirmed) {
            setLoading(false);
            return;
          }
        }
      }

      // 🔥 CORRECCIÓN: Mapeo correcto de estados
      const frontendToBackendStatus = {
        scheduled: 'Programado',
        in_progress: 'En curso',
        finished: 'Finalizado',
        cancelled: 'Cancelado',
        canceled: 'Cancelado', // alias
        postponed: 'Aplazado'
      };
      
      const rawStatus = values.status || 'scheduled';
      const finalStatus = frontendToBackendStatus[rawStatus] || 'Programado';

      // 🔥 VALIDACIÓN CRÍTICA: Partidos FINALIZADOS deben tener marcador
      if (finalStatus === 'Finalizado') {
        const homeScore = values.home_score;
        const awayScore = values.away_score;
        
        if (homeScore === undefined || awayScore === undefined || 
            homeScore === null || awayScore === null) {
          throw new Error('Partidos FINALIZADOS requieren marcador (home_score y away_score)');
        }
        
        // También asegurarse de que sean números
        if (isNaN(Number(homeScore)) || isNaN(Number(awayScore))) {
          throw new Error('El marcador debe ser numérico');
        }
      }

      // 🔥 CORRECCIÓN: Forzar 0-0 si es PROGRAMADO
      if (finalStatus === 'Programado') {
        values.home_score = 0;
        values.away_score = 0;
      }

      // Preparar datos para enviar
      const matchData = {
        ...values,
        status: finalStatus,
        competition_id: Number(values.competition_id || competitionId),
        round_id: values.round_id ? Number(values.round_id) : null,
        home_team_id: Number(values.home_team_id),
        away_team_id: Number(values.away_team_id),
        home_score: Number(values.home_score) || 0,
        away_score: Number(values.away_score) || 0,
        // Guardar en UTC para mantener consistencia con fechas históricas del sistema.
        match_date: values.match_date ? values.match_date.toISOString() : null,
        postponed_date: null,
        is_postponed: false,
        postponed_reason: null,
        postponed_details: null
      };

      // Estadio y ciudad
      if (isWorldCup || allowFullEdit) {
        matchData.stadium = values.stadium || '';
        matchData.city = values.city || '';
      }

      // Flag edición completa
      if (allowFullEdit && mode === 'edit') {
        matchData.full_edit_mode = true;
        matchData.original_data = initialData;
      }

      // Log para debug
      console.log('📤 Enviando datos al backend:', matchData);

      // 🔥 Llamada a API
      let result;
      if (mode === 'edit' && initialData.id) {
        result = await matchesAPI.update(initialData.id, matchData);
        message.success({
          content: '✅ Partido actualizado exitosamente',
          icon: <CheckCircleOutlined />,
        });
      } else {
        result = await matchesAPI.create(matchData);
        message.success({
          content: '✅ Partido creado exitosamente',
          icon: <CheckCircleOutlined />,
        });
      }

      // Callback
      onSuccess?.(result.data);
      form.resetFields();

    } catch (error) {
      console.error('Error completo:', error);
      
      // Manejo de errores específicos
      if (error.message.includes('FINALIZADOS requieren marcador')) {
        message.error({
          content: '❌ ' + error.message,
          duration: 5,
        });
        // Resaltar campos de marcador
        form.setFields([
          {
            name: 'home_score',
            errors: ['Requerido para partidos finalizados'],
          },
          {
            name: 'away_score',
            errors: ['Requerido para partidos finalizados'],
          },
        ]);
      } else if (error.response?.status === 400) {
        // Error del backend
        message.error({
          content: `❌ ${error.response.data.detail || 'Error del servidor'}`,
          duration: 5,
        });
      } else if (error.response?.status === 422) {
        // Error de validación
        const errors = error.response.data.detail;
        if (Array.isArray(errors)) {
          errors.forEach(err => {
            message.error(`❌ ${err.msg || 'Error de validación'}`);
          });
        }
      } else {
        // Error genérico
        message.error({
          content: '❌ Error al guardar el partido',
          duration: 3,
        });
      }

    } finally {
      setLoading(false);
    }
  };

  // 🔥 CORREGIDO: handleStatusChange con lógica mejorada
  const handleStatusChange = (value) => {
    console.log('🔄 Cambio de estado:', value);
    
    // Si cambia a PROGRAMADO y no es modo admin → forzar 0-0
    if (value === 'scheduled' && !allowFullEdit) {
      form.setFieldsValue({
        home_score: 0,
        away_score: 0
      });
      message.info('Marcador automático 0-0 para partidos programados', 3);
    }
    
    // Si cambia a FINALIZADO → validar que tenga marcador
    if (value === 'finished') {
      const homeScore = form.getFieldValue('home_score');
      const awayScore = form.getFieldValue('away_score');
      
      if (homeScore === undefined || awayScore === undefined || 
          homeScore === null || awayScore === null) {
        message.warning({
          content: '⚠️ Ingrese marcador para partido finalizado',
          duration: 4,
        });
        
        // Enfocar el primer campo de marcador
        setTimeout(() => {
          const homeScoreInput = document.querySelector('[id^="home_score"]');
          if (homeScoreInput) homeScoreInput.focus();
        }, 100);
      }
    }
  };

  // 🔥 NUEVO: Validación de marcador para partidos finalizados
  const validateScoreForFinished = (_, value) => {
    const status = form.getFieldValue('status');
    if (status === 'finished') {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Requerido para partidos finalizados'));
      }
      if (isNaN(Number(value))) {
        return Promise.reject(new Error('Debe ser un número'));
      }
      if (Number(value) < 0) {
        return Promise.reject(new Error('No puede ser negativo'));
      }
    }
    return Promise.resolve();
  };

  // NUEVO: Verificar cambios importantes
  const checkForMajorChanges = (newValues) => {
    if (!initialData) return false;
    
    const majorChanges = [
      initialData.home_team_id !== newValues.home_team_id,
      initialData.away_team_id !== newValues.away_team_id,
      initialData.competition_id !== newValues.competition_id,
      initialData.status !== newValues.status && 
        (initialData.status === 'finished' || newValues.status === 'finished'),
      Math.abs((initialData.home_score || 0) - (newValues.home_score || 0)) > 2 ||
      Math.abs((initialData.away_score || 0) - (newValues.away_score || 0)) > 2
    ];
    
    return majorChanges.some(change => change === true);
  };

  const confirmMajorChanges = (newValues) => {
    return new Promise((resolve) => {
      const changes = [];
      
      if (initialData.home_team_id !== newValues.home_team_id) {
        const oldTeam = teams.find(t => t.id === initialData.home_team_id);
        const newTeam = teams.find(t => t.id === newValues.home_team_id);
        changes.push(`• Cambiar local: ${oldTeam?.name || initialData.home_team_id} → ${newTeam?.name || newValues.home_team_id}`);
      }
      
      if (initialData.away_team_id !== newValues.away_team_id) {
        const oldTeam = teams.find(t => t.id === initialData.away_team_id);
        const newTeam = teams.find(t => t.id === newValues.away_team_id);
        changes.push(`• Cambiar visitante: ${oldTeam?.name || initialData.away_team_id} → ${newTeam?.name || newValues.away_team_id}`);
      }
      
      if (initialData.competition_id !== newValues.competition_id) {
        const oldComp = allCompetitions.find(c => c.id === initialData.competition_id);
        const newComp = allCompetitions.find(c => c.id === newValues.competition_id);
        changes.push(`• Cambiar competencia: ${oldComp?.name || initialData.competition_id} → ${newComp?.name || newValues.competition_id}`);
      }
      
      if (initialData.status !== newValues.status) {
        changes.push(`• Cambiar estado: ${initialData.status} → ${newValues.status}`);
      }
      
      const scoreChange = 
        (initialData.home_score || 0) !== (newValues.home_score || 0) ||
        (initialData.away_score || 0) !== (newValues.away_score || 0);
      
      if (scoreChange) {
        changes.push(`• Cambiar marcador: ${initialData.home_score || 0}-${initialData.away_score || 0} → ${newValues.home_score || 0}-${newValues.away_score || 0}`);
      }
      
      Modal.confirm({
        title: '⚠️ Cambios Importantes Detectados',
        icon: <WarningOutlined />,
        content: (
          <div>
            <p>Estás a punto de realizar cambios significativos:</p>
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              backgroundColor: '#fff7e6',
              padding: '8px',
              borderRadius: '4px',
              margin: '8px 0'
            }}>
              {changes.map((change, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>{change}</div>
              ))}
            </div>
            <p style={{ color: '#ff4d4f', marginTop: '8px' }}>
              ⚠️ Esto afectará estadísticas y tablas de posiciones. ¿Continuar?
            </p>
          </div>
        ),
        okText: 'Sí, guardar cambios',
        okType: 'danger',
        cancelText: 'Cancelar',
        width: 600,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };

  // 🔥 NUEVO: Advertencia de modo edición completa
  const handleFullEditWarning = () => {
    Modal.info({
      title: '⚠️ Modo Edición Completa',
      width: 600,
      content: (
        <div>
          <p>
            Estás utilizando el <strong>modo de edición completa</strong>.
          </p>
          <ul>
            <li>Puedes cambiar equipos, competencia y marcador</li>
            <li>Esto puede afectar estadísticas y tablas de posiciones</li>
            <li>Usa esta opción solo si sabes lo que estás haciendo</li>
          </ul>
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>
            ⚠️ Cambios incorrectos pueden dejar datos inconsistentes
          </p>
        </div>
      ),
      okText: 'Entendido',
      okType: 'default',
      okButtonProps: { className: 'btn-outline-primary' },
    });
  };

  // NUEVO: Renderizar campo condicionalmente
  const renderFieldWithEditMode = (fieldName, fieldComponent, options = {}) => {
    const { disabledInNormal = false, tooltip = '' } = options;
    
    if (allowFullEdit && mode === 'edit') {
      return (
        <Tooltip title={tooltip || "Modo administrador: campo editable"}>
          <div style={{ position: 'relative' }}>
            <Badge.Ribbon text="Admin" color="red">
              {fieldComponent}
            </Badge.Ribbon>
          </div>
        </Tooltip>
      );
    }
    
    if (disabledInNormal && mode === 'edit' && !allowFullEdit) {
      return (
        <Tooltip title="Campo bloqueado en modo normal. Usa modo administrador.">
          <div style={{ opacity: 0.6 }}>
            {React.cloneElement(fieldComponent, { disabled: true })}
          </div>
        </Tooltip>
      );
    }
    
    return fieldComponent;
  };

  // NUEVO: Obtener nombre de equipo para mostrar
  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || `Equipo ${teamId}`;
  };

  // NUEVO: Mostrar información del estado actual
  useEffect(() => {
    if (allowFullEdit && mode === 'edit' && formReady) {
      handleFullEditWarning();
    }
  }, [allowFullEdit, mode, formReady]);

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'scheduled',
          home_score: 0,
          away_score: 0,
          is_postponed: false
        }}
      >
        <Row gutter={[16, 16]}>
          {/* Equipos */}
          <Col span={12}>
            {/* Equipo Local */}
              <Form.Item
                name="home_team_id"
                label={
                  <Space>
                    <TeamOutlined />
                    <span>Equipo Local</span>
                    {mode === 'edit' && initialData.home_team_id && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#1677ff', fontWeight: 600 }}>
                          {getTeamName(initialData.home_team_id)}
                        </span>
                        {(() => {
                          const selected = teams.find(team => team.id === initialData.home_team_id);
                          return selected?.logo_url ? (
                            <img
                              src={selected.logo_url}
                              alt={selected.name}
                              style={{ width: 22, height: 22, borderRadius: '50%' }}
                            />
                          ) : null;
                        })()}
                      </span>
                    )}
                    {selectedCompetitionId && (
                      <Tag color="green">
                        {teams.length} equipos disponibles
                      </Tag>
                    )}
                  </Space>
                }
                rules={[
                  { required: true, message: 'Seleccione el equipo local' },
                  { validator: validateTeams }
                ]}
              >
                {renderFieldWithEditMode(
                  'home_team_id',
                  <Select 
                    placeholder="Seleccionar equipo local" 
                    showSearch
                    optionFilterProp="label"
                    optionLabelProp="label"
                    loading={!teams.length}
                    filterOption={(input, option) => {
                      if (!input || !option || !option.label) return true;
                      return option.label.toLowerCase().includes(input.toLowerCase());
                    }}
                  >
                    {teams.map(team => (
                      <Option key={team.id} value={team.id} label={team.name}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {team.logo_url && (
                            <img 
                              src={team.logo_url} 
                              alt={team.name}
                              style={{ width: 20, height: 20, borderRadius: '50%' }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{team.name}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {team.city} {team.country ? `(${team.country})` : ''}
                            </div>
                          </div>
                        </div>
                      </Option>
                    ))}
                  </Select>,
                  { 
                    disabledInNormal: mode === 'edit' && initialData.status === 'finished',
                    tooltip: mode === 'edit' ? "Cambiar equipo local" : ""
                  }
                )}
              </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="away_team_id"
              label={
                <Space>
                  <TeamOutlined />
                  <span>Equipo Visitante</span>
                  {mode === 'edit' && initialData.away_team_id && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#1677ff', fontWeight: 600 }}>
                        {getTeamName(initialData.away_team_id)}
                      </span>
                      {(() => {
                        const selected = teams.find(team => team.id === initialData.away_team_id);
                        return selected?.logo_url ? (
                          <img
                            src={selected.logo_url}
                            alt={selected.name}
                            style={{ width: 22, height: 22, borderRadius: '50%' }}
                          />
                        ) : null;
                      })()}
                    </span>
                  )}
                </Space>
              }
              rules={[
                { required: true, message: 'Seleccione el equipo visitante' },
                { validator: validateTeams }
              ]}
            >
              {renderFieldWithEditMode(
                'away_team_id',
                <Select 
                  placeholder="Seleccionar equipo visitante" 
                  showSearch
                  optionFilterProp="label"
                  optionLabelProp="label"
                  loading={!teams.length}
                  filterOption={(input, option) => {
                    if (!input || !option || !option.label) return true;
                    return option.label.toLowerCase().includes(input.toLowerCase());
                  }}
                >
                  {teams.map(team => (
                    <Option key={team.id} value={team.id} label={team.name}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {team.logo_url && (
                          <img 
                            src={team.logo_url} 
                            alt={team.name}
                            style={{ width: 20, height: 20, borderRadius: '50%' }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{team.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {team.city} {team.country ? `(${team.country})` : ''}
                          </div>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>,
                { 
                  disabledInNormal: mode === 'edit' && initialData.status === 'finished',
                  tooltip: mode === 'edit' ? "Cambiar equipo visitante" : ""
                }
              )}
            </Form.Item>
          </Col>

          {/* Fecha y hora */}
          <Col span={12}>
            <Form.Item
              name="match_date"
              label={<Space><CalendarOutlined /> Fecha y hora</Space>}
              rules={[{ required: true, message: 'Seleccione la fecha y hora' }]}
              getValueFromEvent={(date) => date}
              getValueProps={(value) => ({ value: parseDate(value) })}
              normalize={(value) => value}
            >
              <DatePicker
                showTime={{ 
                  format: 'hh:mm',
                  use12Hours: true
                }}
                format="YYYY-MM-DD hh:mm A"
                style={{ width: '100%' }}
                placeholder="Seleccionar fecha y hora"
                // Forzar zona horaria local
                getPopupContainer={trigger => trigger.parentNode}
              />
            </Form.Item>
          </Col>

          {/* Jornada */}
          <Col span={12}>
            <Form.Item 
              name="round_id" 
              label={
                <Space>
                  <CalendarOutlined />
                  <span>Jornada</span>
                  {competitionRounds.length > 0 && (
                    <Tag color="blue">
                      {competitionRounds.length} disponibles
                    </Tag>
                  )}
                </Space>
              }
              help={competitionRounds.length === 0 ? 
                "No hay jornadas creadas para esta competencia. Puedes crear el partido sin jornada o crear una jornada primero." : 
                "Opcional: Selecciona una jornada para organizar los partidos"}
            >
              <Select 
                placeholder={
                  competitionRounds.length > 0 ? 
                  "Seleccionar jornada (opcional)" : 
                  "No hay jornadas disponibles"
                } 
                allowClear
                disabled={competitionRounds.length === 0}
                loading={!formReady}
              >
                {competitionRounds.map(round => (
                  <Option key={round.id} value={round.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{round.name}</span>
                      <Space size="small">
                        {round.is_completed ? (
                          <Tag color="green" size="small">Completada</Tag>
                        ) : (
                          <Tag color="orange" size="small">Activa</Tag>
                        )}
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          N° {round.round_number}
                        </span>
                      </Space>
                    </div>
                  </Option>
                ))}
              </Select>
              
            </Form.Item>
            </Col>

          {/* Estadio y Ciudad - NUEVO: Siempre editable en modo completo */}
          {(isWorldCup || allowFullEdit) ? (
            <>
              <Col span={12}>
                <Form.Item 
                  name="stadium" 
                  label={
                    <Space>
                      <EnvironmentOutlined />
                      <span>Estadio</span>
                      {allowFullEdit && <Tag size="small">Editable</Tag>}
                    </Space>
                  }
                  rules={isWorldCup ? [{ required: true, message: 'Ingrese el estadio' }] : []}
                >
                  <Input 
                    placeholder={isWorldCup ? "Estadio del mundial" : "Nombre del estadio"} 
                    list="worldcup-stadiums"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="city" 
                  label={
                    <Space>
                      <EnvironmentOutlined />
                      <span>Ciudad</span>
                      {allowFullEdit && <Tag size="small">Editable</Tag>}
                    </Space>
                  }
                  rules={isWorldCup ? [{ required: true, message: 'Ingrese la ciudad' }] : []}
                >
                  <Input 
                    placeholder={isWorldCup ? "Ciudad sede" : "Nombre de la ciudad"} 
                    list="worldcup-cities"
                  />
                </Form.Item>
              </Col>
              <datalist id="worldcup-stadiums">
                {worldCupStadiums.map((stadium) => (
                  <option key={stadium} value={stadium} />
                ))}
              </datalist>
              <datalist id="worldcup-cities">
                {worldCupCities.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </>
          ) : (
            // Mostrar solo información del estadio (no editable)
            <Col span={24}>
              <Card size="small" style={{ background: '#fafafa' }}>
                <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                  <Text type="secondary">
                    <EnvironmentOutlined /> Estadio y Ciudad
                  </Text>
                  <Text>
                    Estadio: 
                    <Text strong>
                      {(() => {
                        const team = teams.find(t => t.id === homeTeamId);
                        return team ? ` ${team.stadium || 'Sin estadio'}, ${team.city || 'Sin ciudad'}` : ' (Seleccione equipo local)';
                      })()}
                    </Text>
                  </Text>
                  {mode === 'edit' && !allowFullEdit && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      <LockOutlined /> Para editar estadio, usa modo administrador
                    </Text>
                  )}
                </Space>
              </Card>
            </Col>
          )}

          {/* Estado */}
          <Col span={12}>
            <Form.Item 
              name="status" 
              label="Estado" 
              rules={[{ required: true }]}
            >
              <Select
                onChange={handleStatusChange}
                placeholder="Seleccionar estado"
              >
                <Option value="scheduled">
                  <Tag color="blue">Programado</Tag> - Partido futuro
                </Option>
                <Option value="in_progress">
                  <Tag color="orange">En curso</Tag> - Partido en juego
                </Option>
                <Option value="finished">
                  <Tag color="green">Finalizado</Tag> - Partido terminado
                </Option>
                <Option value="postponed">
                  <Tag color="yellow">Aplazado</Tag> - Partido aplazado
                </Option>
                <Option value="cancelled">
                  <Tag color="red">Cancelado</Tag> - Cancelado
                </Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Marcador - NUEVO: Con lógica mejorada para edición completa */}
          <Col span={24}>
            <Card 
              style={{ 
                background: status === 'scheduled' && !allowFullEdit ? '#f0f9ff' : 
                          status === 'finished' ? '#f6ffed' : '#fff',
                padding: 16,
                border: status === 'finished' ? '1px solid #b7eb8f' : '1px solid #f0f0f0'
              }}
            >
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Marcador
                  {status === 'scheduled' && !allowFullEdit && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>0-0 automático</Tag>
                  )}
                  {status === 'finished' && (
                    <Tag color="green" style={{ marginLeft: 8 }} icon={<CheckCircleOutlined />}>
                      Finalizado - Marcador requerido
                    </Tag>
                  )}
                  {allowFullEdit && mode === 'edit' && (
                    <Tag color="red" style={{ marginLeft: 8 }}>Sin restricciones</Tag>
                  )}
                </Text>
                
                {allowFullEdit && mode === 'edit' && initialData.status === 'finished' && (
                  <Alert
                    title="Marcador original"
                    description={`${initialData.home_score || 0} - ${initialData.away_score || 0}`}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                
                <Row gutter={[16, 16]}>
                  <Col span={10}>
                    <Form.Item
                      name="home_score"
                      label="Goles Local"
                      rules={[
                        { 
                          validator: validateScoreForFinished 
                        },
                        { 
                          type: 'number', 
                          min: 0, 
                          message: 'Mínimo 0' 
                        }
                      ]}
                      normalize={(value) => {
                        if (value === '' || value === null || value === undefined) {
                          return status === 'finished' ? undefined : 0;
                        }
                        return Number(value) || 0;
                      }}
                    >
                      <InputNumber 
                        min={0} 
                        max={50} 
                        style={{ width: '100%' }}
                        disabled={status === 'scheduled' && !allowFullEdit}
                        status={status === 'finished' ? 'warning' : ''}
                        placeholder={status === 'finished' ? 'Ingrese goles' : ''}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={4} style={{ textAlign: 'center', paddingTop: 30 }}>
                    <Text strong style={{ fontSize: 20 }}>vs</Text>
                  </Col>

                  <Col span={10}>
                    <Form.Item
                      name="away_score"
                      label="Goles Visitante"
                      rules={[
                        { 
                          validator: validateScoreForFinished 
                        },
                        { 
                          type: 'number', 
                          min: 0, 
                          message: 'Mínimo 0' 
                        }
                      ]}
                      normalize={(value) => {
                        if (value === '' || value === null || value === undefined) {
                          return status === 'finished' ? undefined : 0;
                        }
                        return Number(value) || 0;
                      }}
                    >
                      <InputNumber 
                        min={0} 
                        max={50} 
                        style={{ width: '100%' }}
                        disabled={status === 'scheduled' && !allowFullEdit}
                        status={status === 'finished' ? 'warning' : ''}
                        placeholder={status === 'finished' ? 'Ingrese goles' : ''}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                {/* 🔥 NUEVO: Mensajes de validación */}
                <div>
                  {status === 'finished' && (
                    <Alert
                      title="Partidos FINALIZADOS requieren marcador"
                      type="warning"
                      showIcon
                      style={{ marginBottom: 8 }}
                    />
                  )}
                  <Text type="secondary">
                    <InfoCircleOutlined /> Reglas: 
                    {status === 'scheduled' && !allowFullEdit && ' Marcador automático 0-0'}
                    {status === 'finished' && ' Marcador obligatorio'}
                    {allowFullEdit && ' Modo administrador - Sin restricciones'}
                    {!allowFullEdit && status !== 'scheduled' && status !== 'finished' && ' Ingrese resultado real'}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Botones */}
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              {onCancel && (
                <Button className="btn-outline-primary" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button 
                type="default"
                className="btn-outline-primary"
                htmlType="submit" 
                loading={loading}
                icon={mode === 'edit' ? <EditOutlined /> : null}
              >
                {mode === 'edit' ? 'Actualizar Partido' : 'Crear Partido'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default MatchForm;

