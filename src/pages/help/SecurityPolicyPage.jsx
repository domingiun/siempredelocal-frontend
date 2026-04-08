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
          <SafetyOutlined style={{ marginRight: 8 }} />
            <Title level={3}>
              Políticas de Seguridad y Tratamiento de Datos
            </Title>

            <Text>
              En cumplimiento de la Ley 1581 de 2012 y demás normas aplicables en Colombia,
              nuestra plataforma garantiza la protección, privacidad y uso adecuado de los
              datos personales de los usuarios. Nuestro compromiso es brindar un entorno
              seguro, transparente y confiable.
            </Text>

            <Title level={4}>Datos recolectados</Title>
            <Text>
              La información que solicitamos es mínima y estrictamente necesaria para el
              funcionamiento de la plataforma. Únicamente recolectamos:
            </Text>
            <Text>• Nombre o identificador de usuario</Text>
            <Text>• Correo electrónico</Text>
            <Text>• Número de teléfono celular</Text>

            <Text>
              No solicitamos ni almacenamos información sensible o financiera como números
              de cuentas bancarias, tarjetas de crédito, direcciones de residencia o datos
              personales de alto riesgo.
            </Text>

            <Title level={4}>Seguridad en transacciones</Title>
            <Text>
              Los procesos de compensación o gestión de puntos se realizan mediante
              comunicación directa, como canales oficiales (por ejemplo, WhatsApp), donde
              se brindan las instrucciones correspondientes. No realizamos cargos automáticos
              ni solicitamos acceso a cuentas bancarias o información financiera.
            </Text>

            <Title level={4}>Uso de la información</Title>
            <Text>
              Los datos personales recolectados serán utilizados únicamente para:
            </Text>
            <Text>• Identificar a los usuarios dentro de la plataforma</Text>
            <Text>• Gestionar cuentas y participación</Text>
            <Text>• Validar accesos y prevenir fraudes</Text>
            <Text>• Brindar soporte en caso de incidencias</Text>
            <Text>• Cumplir con obligaciones legales</Text>

            <Text>
              En ningún caso la información será vendida, compartida o utilizada para fines
              comerciales o de beneficio económico.
            </Text>

            <Title level={4}>Protección y confidencialidad</Title>
            <Text>
              Implementamos medidas de seguridad como protocolos seguros (HTTPS), control
              de accesos y buenas prácticas de protección de datos para evitar accesos no
              autorizados, pérdida o uso indebido de la información.
            </Text>

            <Text>
              El acceso a los datos está restringido y se maneja bajo estrictos criterios
              de confidencialidad.
            </Text>

            <Title level={4}>Limitación sobre datos sensibles</Title>
            <Text>
              Nuestra plataforma no solicita ni gestiona datos sensibles o financieros.
              Cualquier información de este tipo que sea compartida por el usuario fuera de
              los canales oficiales será bajo su propia responsabilidad.
            </Text>

            <Title level={4}>Derechos del usuario</Title>
            <Text>
              Como titular de la información, el usuario tiene derecho a conocer, actualizar,
              rectificar o solicitar la eliminación de sus datos personales en cualquier momento.
            </Text>

            <Title level={4}>Soporte</Title>
            <Text>
              Si tienes dudas o solicitudes relacionadas con tus datos personales o la seguridad
              de la plataforma, puedes comunicarte con nuestro equipo de soporte.
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

