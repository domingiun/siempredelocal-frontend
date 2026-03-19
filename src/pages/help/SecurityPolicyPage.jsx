// frontend/src/pages/help/SecurityPolicyPage.jsx
import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const SecurityPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Title level={2}>
            <SafetyOutlined style={{ marginRight: 8 }} />
            Políticas de Seguridad y Tratamiento de Datos
          </Title>

          <Text>
            En nuestra plataforma de pronósticos, la seguridad y la privacidad son una prioridad.
            Este documento explica cómo protegemos tu información y cómo funciona el proceso
            de compensación por puntos.
          </Text>

          <Title level={4}>Seguridad en transacciones</Title>
          <Text>
            La compensación se realizan por atravez de una comunicacion via whatsapp donde se te dara indicaciones de como hacerlo. 
            No se realizan cargos automáticos ni se solicita acceso a cuentas bancarias.
          </Text>

          <Title level={4}>Datos personales</Title>
          <Text>
            No solicitamos datos sensibles como claves bancarias, números completos de
            cuentas o información financiera privada. Solo registramos la información
            necesaria para validar y acreditar los créditos.
          </Text>

          <Title level={4}>Uso de la información</Title>
          <Text>
            La información que nos proporcionas se usa únicamente para:
          </Text>
          <Text>• Verificar y acreditar créditos</Text>
          <Text>• Generar el historial de transacciones</Text>
          <Text>• Brindar soporte en caso de incidencias</Text>

          <Title level={4}>Protección y confidencialidad</Title>
          <Text>
            Implementamos controles internos para asegurar que el acceso a la información
            esté limitado y que los datos se manejen con confidencialidad. No compartimos
            la información con terceros.
          </Text>

          <Title level={4}>Soporte</Title>
          <Text>
            Si tienes dudas o reportes relacionados con seguridad, puedes contactar al
            equipo de soporte para revisión.
          </Text>

          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/wallet')}
            style={{ alignSelf: 'flex-start' }}
          >
            Regresar
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default SecurityPolicyPage;

