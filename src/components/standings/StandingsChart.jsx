import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Select, Radio, Space, Typography, 
  Tooltip, Progress, message 
} from 'antd';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area 
} from 'recharts';
import { 
  TrophyOutlined, TeamOutlined, BarChartOutlined,
  LineChartOutlined, PieChartOutlined, AreaChartOutlined,
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined 
} from '@ant-design/icons';
import competitionService from '../../services/competitionService';

const { Title, Text } = Typography;
const { Option } = Select;

const StandingsChart = ({ competitionId }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const [metric, setMetric] = useState('points');
  const [selectedTeams, setSelectedTeams] = useState([]);

  useEffect(() => {
    if (competitionId) {
      fetchChartData();
    }
  }, [competitionId, metric]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const standings = await competitionService.getStandings(competitionId);
      
      // Preparar datos para gráficos
      const data = standings.map((team, index) => ({
        name: team.team,
        position: index + 1,
        points: team.points,
        played: team.played,
        won: team.won,
        drawn: team.drawn,
        lost: team.lost,
        goalsFor: team.goalsFor,
        goalsAgainst: team.goalsAgainst,
        goalDifference: team.goalDifference,
        winPercentage: team.played > 0 ? (team.won / team.played) * 100 : 0,
        pointsPerGame: team.played > 0 ? (team.points / team.played).toFixed(2) : 0,
      }));
      
      setChartData(data);
      
      // Seleccionar top 5 equipos por defecto
      setSelectedTeams(data.slice(0, 5).map(team => team.name));
    } catch (error) {
      message.error('Error al cargar datos para gráficos');
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { key: 'points', label: 'Puntos', color: '#1890ff' },
    { key: 'won', label: 'Victorias', color: '#52c41a' },
    { key: 'drawn', label: 'Empates', color: '#faad14' },
    { key: 'lost', label: 'Derrotas', color: '#ff4d4f' },
    { key: 'goalsFor', label: 'Goles a Favor', color: '#722ed1' },
    { key: 'goalsAgainst', label: 'Goles en Contra', color: '#eb2f96' },
    { key: 'goalDifference', label: 'Diferencia de Goles', color: '#13c2c2' },
    { key: 'winPercentage', label: '% Victorias', color: '#f759ab' },
  ];

  const chartTypes = [
    { key: 'bar', label: 'Barras', icon: <BarChartOutlined /> },
    { key: 'line', label: 'Líneas', icon: <LineChartOutlined /> },
    { key: 'area', label: 'Área', icon: <AreaChartOutlined /> },
    { key: 'pie', label: 'Tarta', icon: <PieChartOutlined /> },
  ];

  const renderBarChart = () => {
    const filteredData = chartData.filter(team => 
      selectedTeams.length === 0 || selectedTeams.includes(team.name)
    );

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <RechartsTooltip 
            formatter={(value) => [value, metric]}
            labelFormatter={(label) => `Equipo: ${label}`}
          />
          <Legend />
          <Bar 
            dataKey={metric} 
            fill={metrics.find(m => m.key === metric)?.color || '#1890ff'}
            name={metrics.find(m => m.key === metric)?.label}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderLineChart = () => {
    const filteredData = chartData.filter(team => 
      selectedTeams.length === 0 || selectedTeams.includes(team.name)
    );

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <RechartsTooltip 
            formatter={(value) => [value, metric]}
            labelFormatter={(label) => `Equipo: ${label}`}
          />
          <Legend />
          <Line 
            type="monotone"
            dataKey={metric}
            stroke={metrics.find(m => m.key === metric)?.color || '#1890ff'}
            name={metrics.find(m => m.key === metric)?.label}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderAreaChart = () => {
    const filteredData = chartData.filter(team => 
      selectedTeams.length === 0 || selectedTeams.includes(team.name)
    );

    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <RechartsTooltip 
            formatter={(value) => [value, metric]}
            labelFormatter={(label) => `Equipo: ${label}`}
          />
          <Legend />
          <Area 
            type="monotone"
            dataKey={metric}
            stroke={metrics.find(m => m.key === metric)?.color || '#1890ff'}
            fill={metrics.find(m => m.key === metric)?.color || '#1890ff'}
            fillOpacity={0.3}
            name={metrics.find(m => m.key === metric)?.label}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = () => {
    const topTeams = chartData.slice(0, 6); // Top 6 equipos para la tarta
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={topTeams}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey={metric}
            nameKey="name"
          >
            {topTeams.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip 
            formatter={(value, name, props) => [
              value, 
              `${props.payload.name} - ${metrics.find(m => m.key === metric)?.label}`
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderBarChart();
    }
  };

  const renderMetricCards = () => {
    if (chartData.length === 0) return null;

    const topTeam = chartData[0];
    const avgPoints = chartData.reduce((sum, team) => sum + team.points, 0) / chartData.length;
    const totalGoals = chartData.reduce((sum, team) => sum + team.goalsFor, 0);
    const avgWinPercentage = chartData.reduce((sum, team) => sum + team.winPercentage, 0) / chartData.length;

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Text type="secondary">Líder</Text>
              <Title level={4} style={{ margin: 0 }}>
                <TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />
                {topTeam.name}
              </Title>
              <Text strong>{topTeam.points} puntos</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Text type="secondary">Promedio de Puntos</Text>
              <Title level={4} style={{ margin: 0 }}>
                {avgPoints.toFixed(1)}
              </Title>
              <Progress 
                percent={Math.min((avgPoints / topTeam.points) * 100, 100)} 
                size="small" 
                showInfo={false}
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Text type="secondary">Total Goles</Text>
              <Title level={4} style={{ margin: 0 }}>
                {totalGoals}
              </Title>
              <Text type="secondary">{chartData.length} equipos</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Text type="secondary">% Victorias Promedio</Text>
              <Title level={4} style={{ margin: 0 }}>
                {avgWinPercentage.toFixed(1)}%
              </Title>
              <Progress 
                percent={avgWinPercentage} 
                size="small" 
                showInfo={false}
                strokeColor="#52c41a"
              />
            </Space>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderTeamPerformance = () => {
    if (chartData.length === 0) return null;

    return (
      <Card 
        title="Rendimiento por Equipo" 
        style={{ marginTop: 24 }}
        size="small"
      >
        {chartData.slice(0, 5).map((team, index) => (
          <div key={team.name} style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text strong>{team.name}</Text>
              <Space>
                <Tag color="green">{team.won}G</Tag>
                <Tag color="blue">{team.drawn}E</Tag>
                <Tag color="red">{team.lost}P</Tag>
              </Space>
            </Space>
            <Progress 
              percent={team.winPercentage}
              success={{ percent: (team.won / team.played) * 100 || 0 }}
              strokeColor={{
                '0%': '#ff4d4f',
                '100%': '#52c41a',
              }}
              format={percent => `${percent.toFixed(1)}%`}
            />
          </div>
        ))}
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <span>Análisis Estadístico</span>
          </Space>
        }
        loading={loading}
        extra={
          <Space>
            <Select
              placeholder="Seleccionar equipos..."
              mode="multiple"
              style={{ width: 200 }}
              value={selectedTeams}
              onChange={setSelectedTeams}
              maxTagCount={3}
            >
              {chartData.map(team => (
                <Option key={team.name} value={team.name}>
                  {team.name}
                </Option>
              ))}
            </Select>
            
            <Select
              value={metric}
              onChange={setMetric}
              style={{ width: 180 }}
            >
              {metrics.map(m => (
                <Option key={m.key} value={m.key}>
                  <Space>
                    <div style={{
                      width: 12,
                      height: 12,
                      backgroundColor: m.color,
                      borderRadius: '50%'
                    }} />
                    {m.label}
                  </Space>
                </Option>
              ))}
            </Select>

            <Radio.Group 
              value={chartType} 
              onChange={e => setChartType(e.target.value)}
              buttonStyle="solid"
            >
              {chartTypes.map(type => (
                <Radio.Button key={type.key} value={type.key}>
                  <Space size={4}>
                    {type.icon}
                    {type.label}
                  </Space>
                </Radio.Button>
              ))}
            </Radio.Group>
          </Space>
        }
      >
        {renderMetricCards()}
        
        <div style={{ height: 400, marginBottom: 24 }}>
          {renderChart()}
        </div>

        {renderTeamPerformance()}
      </Card>
    </div>
  );
};

export default StandingsChart;
