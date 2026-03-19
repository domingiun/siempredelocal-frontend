// frontend/src/components/bets/BetPredictionCard.jsx
import React from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  InputNumber,
  Space,
  Tag
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { formatDateTimeShortUTC } from '../../utils/dateFormatter';

const { Text } = Typography;

const BetPredictionCard = ({
  match,
  value = {},
  onChange,
  disabled = false
}) => {
  if (!match) return null;

  const handleChange = (field, newValue) => {
    onChange?.({
      ...value,
      [field]: newValue
    });
  };

  return (
    <Card size="small" style={{ marginBottom: 12 }}>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        
        {/* COMPETENCIA */}
        {match.competition && (
          <Tag color="blue" icon={<TrophyOutlined />}>
            {match.competition}
          </Tag>
        )}

        {/* EQUIPOS */}
        <Row justify="space-between" align="middle">
          <Col span={8}>
            <Text strong>{match.home_team}</Text>
          </Col>

          <Col span={8} style={{ textAlign: 'center' }}>
            <Space>
              <InputNumber
                min={0}
                max={20}
                value={value.home_score}
                disabled={disabled}
                onChange={(v) => handleChange('home_score', v)}
              />
              <Text strong>:</Text>
              <InputNumber
                min={0}
                max={20}
                value={value.away_score}
                disabled={disabled}
                onChange={(v) => handleChange('away_score', v)}
              />
            </Space>
          </Col>

          <Col span={8} style={{ textAlign: 'right' }}>
            <Text strong>{match.away_team}</Text>
          </Col>
        </Row>

        {/* INFO DEL PARTIDO */}
        <Row justify="space-between">
          <Col>
            {match.match_date && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CalendarOutlined /> {formatDateTimeShortUTC(match.match_date)}
              </Text>
            )}
          </Col>
          <Col>
            {match.stadium && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <EnvironmentOutlined /> {match.stadium}
              </Text>
            )}
          </Col>
        </Row>

        {/* VALIDACIÓN */}
        {(value.home_score === undefined || value.away_score === undefined) && (
          <Text type="warning" style={{ fontSize: 12 }}>
            Debes ingresar ambos marcadores
          </Text>
        )}
      </Space>
    </Card>
  );
};

export default BetPredictionCard;

