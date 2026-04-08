// frontend/src/pages/help/SecurityPolicyPage.jsx
import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Section = ({ title, children }) => (
  <>
    <Title level={4} style={{ marginTop: 24, marginBottom: 8 }}>{title}</Title>
    {children}
  </>
);

const Item = ({ children }) => (
  <Text style={{ display: 'block', paddingLeft: 12 }}>• {children}</Text>
);

const SecurityPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px', maxWidth: 860, margin: '0 auto' }}>
      <Card>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafetyOutlined style={{ fontSize: 24, color: '#1677ff' }} />
            <Title level={3} style={{ margin: 0 }}>
              Política de Seguridad de la Información y Tratamiento de Datos Personales
            </Title>
          </div>

          <Text>
            En cumplimiento de lo dispuesto en la Ley 1581 de 2012, el Decreto 1377 de 2013
            y demás normas concordantes sobre protección de datos personales en Colombia,
            nuestra plataforma adopta la presente Política de Seguridad de la Información y
            Tratamiento de Datos Personales, con el propósito de garantizar la protección de
            la información suministrada por nuestros usuarios.
          </Text>

          <Section title="1. Alcance y compromiso">
            <Text style={{ display: 'block', marginBottom: 8 }}>
              Nuestra plataforma se compromete a proteger la privacidad de los datos personales
              de sus usuarios mediante la implementación de medidas técnicas, administrativas y
              humanas adecuadas, orientadas a evitar el acceso no autorizado, la pérdida, el uso
              indebido o la divulgación de la información.
            </Text>
            <Text>
              De manera expresa, informamos que no comercializamos, vendemos, alquilamos ni
              utilizamos los datos personales con fines lucrativos o distintos a los estrictamente
              necesarios para la operación de la plataforma.
            </Text>
          </Section>

          <Section title="2. Datos recolectados">
            <Text style={{ display: 'block', marginBottom: 8 }}>
              La información que recolectamos es mínima y estrictamente necesaria para el
              funcionamiento de la plataforma. Los únicos datos personales solicitados son:
            </Text>
            <Item>Nombre o identificador de usuario</Item>
            <Item>Correo electrónico</Item>
            <Item>Número de teléfono celular</Item>
            <Text style={{ display: 'block', margin: '12px 0 8px' }}>
              No solicitamos, almacenamos ni procesamos datos sensibles o financieros, tales como:
            </Text>
            <Item>Números de cuentas bancarias</Item>
            <Item>Información de tarjetas de crédito o débito</Item>
            <Item>Direcciones de residencia</Item>
            <Item>Documentos de identidad sensibles (salvo que en el futuro sea requerido por ley, lo cual sería debidamente informado)</Item>
            <Item>Información biométrica o datos de salud</Item>
            <Text style={{ display: 'block', marginTop: 12 }}>
              En consecuencia, nuestra plataforma no administra ni tiene acceso a información
              financiera o altamente sensible de los usuarios, lo que reduce significativamente
              los riesgos asociados al tratamiento de datos.
            </Text>
          </Section>

          <Section title="3. Finalidad del tratamiento">
            <Text style={{ display: 'block', marginBottom: 8 }}>
              Los datos personales recolectados serán utilizados únicamente para:
            </Text>
            <Item>Identificar a los usuarios dentro de la plataforma</Item>
            <Item>Permitir el acceso y uso de los servicios ofrecidos</Item>
            <Item>Gestionar cuentas y participación en la plataforma</Item>
            <Item>Garantizar la seguridad y prevenir accesos no autorizados</Item>
            <Item>Cumplir con obligaciones legales aplicables</Item>
            <Text style={{ display: 'block', marginTop: 12 }}>
              En ningún caso la información será utilizada para fines comerciales propios ni
              para la generación de beneficios económicos derivados del uso de los datos personales.
            </Text>
          </Section>

          <Section title="4. Principios de tratamiento de datos">
            <Text style={{ display: 'block', marginBottom: 8 }}>
              El tratamiento de los datos personales se realizará bajo los principios establecidos en la ley:
            </Text>
            <Item>Legalidad: Cumplimiento de la normativa vigente</Item>
            <Item>Finalidad: Uso exclusivo para los fines informados</Item>
            <Item>Libertad: Autorización previa, expresa e informada del usuario</Item>
            <Item>Seguridad: Protección mediante medidas técnicas adecuadas</Item>
            <Item>Confidencialidad: Reserva permanente de la información</Item>
            <Item>Transparencia: Acceso del titular a su información</Item>
          </Section>

          <Section title="5. Medidas de seguridad">
            <Text style={{ display: 'block', marginBottom: 8 }}>
              Para proteger la información personal, implementamos medidas como:
            </Text>
            <Item>Uso de protocolos seguros (HTTPS)</Item>
            <Item>Encriptación de la información cuando aplica</Item>
            <Item>Sistemas de autenticación y control de acceso</Item>
            <Item>Restricción interna al acceso de datos</Item>
            <Item>Monitoreo y actualización de seguridad en la plataforma</Item>
            <Text style={{ display: 'block', marginTop: 12 }}>
              A pesar de aplicar buenas prácticas de seguridad, el usuario reconoce que ningún
              sistema es completamente invulnerable, por lo que se actúa bajo estándares
              razonables de protección.
            </Text>
          </Section>

          <Section title="6. Derechos de los titulares">
            <Text style={{ display: 'block', marginBottom: 8 }}>Los usuarios tienen derecho a:</Text>
            <Item>Conocer, actualizar y rectificar sus datos personales</Item>
            <Item>Solicitar la eliminación de su información cuando sea procedente</Item>
            <Item>Revocar la autorización otorgada</Item>
            <Item>Ser informados sobre el uso de sus datos</Item>
            <Item>Presentar consultas o reclamos conforme a la ley</Item>
            <Text style={{ display: 'block', marginTop: 12 }}>
              Estos derechos podrán ejercerse a través de los canales de contacto definidos por la plataforma.
            </Text>
          </Section>

          <Section title="7. Transferencia de información">
            <Text style={{ display: 'block', marginBottom: 8 }}>
              Los datos personales no serán compartidos con terceros, excepto en los siguientes casos:
            </Text>
            <Item>Por requerimiento de autoridad competente</Item>
            <Item>Para el cumplimiento de obligaciones legales</Item>
            <Item>Cuando sea necesario para la operación técnica de la plataforma (por ejemplo, servicios de hosting o infraestructura tecnológica), bajo acuerdos de confidencialidad</Item>
            <Text style={{ display: 'block', marginTop: 12 }}>
              En todos los casos, se garantizará que la información sea tratada bajo estándares
              adecuados de protección.
            </Text>
          </Section>

          <Section title="8. Autorización del usuario">
            <Text>
              Al registrarse en la plataforma, el usuario otorga su autorización libre, previa,
              expresa e informada para el tratamiento de sus datos personales conforme a esta política.
            </Text>
          </Section>

          <Section title="9. Limitación de responsabilidad sobre datos sensibles">
            <Text style={{ display: 'block', marginBottom: 8 }}>
              Dado que nuestra plataforma no solicita ni gestiona información financiera ni datos
              sensibles, cualquier suministro de este tipo de información por parte del usuario
              a través de canales no oficiales o externos será bajo su exclusiva responsabilidad.
            </Text>
            <Text>
              Nuestra plataforma no será responsable por la entrega voluntaria de información
              sensible que no haya sido requerida dentro de los procesos oficiales.
            </Text>
          </Section>

          <Section title="10. Vigencia y modificaciones">
            <Text>
              La presente política entra en vigencia a partir de su publicación y podrá ser
              actualizada en cualquier momento. Cualquier cambio será informado oportunamente
              a los usuarios.
            </Text>
          </Section>

          <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(22,119,255,0.06)', borderLeft: '3px solid #1677ff', borderRadius: '0 8px 8px 0' }}>
            <Title level={5} style={{ marginTop: 0 }}>Declaración final</Title>
            <Text style={{ display: 'block', marginBottom: 8 }}>
              Nuestra prioridad es brindar un entorno seguro, transparente y confiable. Por ello,
              limitamos estrictamente la recolección de datos a lo esencial y evitamos el manejo
              de información sensible o financiera, reduciendo riesgos tanto para los usuarios
              como para la plataforma.
            </Text>
            <Text>
              Reiteramos nuestro compromiso de proteger la información personal y utilizarla
              únicamente para fines legítimos, operativos y conforme a la ley.
            </Text>
          </div>

          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
          >
            Regresar
          </Button>

        </Space>
      </Card>
    </div>
  );
};

export default SecurityPolicyPage;
