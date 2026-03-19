import React from 'react';
import { Layout, Row, Col, Space, Typography, Divider } from 'antd';
import { 
  GithubOutlined, 
  TwitterOutlined, 
  LinkedinOutlined,
  HeartOutlined 
} from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <AntFooter style={{ 
      background: '#001529', 
      color: 'rgba(255, 255, 255, 0.65)',
      padding: '24px 50px',
    }}>
      <Row gutter={[32, 32]}>
        {/* Información de la empresa */}
        <Col xs={24} md={8}>
          <Space orientation="vertical" size="small">
            <Text strong style={{ color: 'white', fontSize: '16px' }}>
              SiempreDeLocal
            </Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
              Sistema de gestión de competencias deportivas. 
              Organiza, administra y sigue todas tus competencias en un solo lugar.
            </Text>
            <Space size="middle">
              <Link 
                href="https://github.com" 
                target="_blank" 
                style={{ color: 'rgba(255, 255, 255, 0.65)' }}
              >
                <GithubOutlined style={{ fontSize: '20px' }} />
              </Link>
              <Link 
                href="https://twitter.com" 
                target="_blank" 
                style={{ color: 'rgba(255, 255, 255, 0.65)' }}
              >
                <TwitterOutlined style={{ fontSize: '20px' }} />
              </Link>
              <Link 
                href="https://linkedin.com" 
                target="_blank" 
                style={{ color: 'rgba(255, 255, 255, 0.65)' }}
              >
                <LinkedinOutlined style={{ fontSize: '20px' }} />
              </Link>
            </Space>
          </Space>
        </Col>

        {/* Enlaces rápidos */}
        <Col xs={24} md={8}>
          <Space orientation="vertical" size="small">
            <Text strong style={{ color: 'white' }}>
              Enlaces Rápidos
            </Text>
            <div>
              <Link 
                href="/dashboard" 
                style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block', marginBottom: '8px' }}
              >
                Dashboard
              </Link>
              <Link 
                href="/competitions" 
                style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block', marginBottom: '8px' }}
              >
                Competencias
              </Link>
              <Link 
                href="/teams" 
                style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block', marginBottom: '8px' }}
              >
                Equipos
              </Link>
              <Link 
                href="/matches" 
                style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block', marginBottom: '8px' }}
              >
                Partidos
              </Link>
              <Link 
                href="/standings" 
                style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block', marginBottom: '8px' }}
              >
                Clasificación
              </Link>
            </div>
          </Space>
        </Col>

        {/* Información de contacto */}
        <Col xs={24} md={8}>
          <Space orientation="vertical" size="small">
            <Text strong style={{ color: 'white' }}>
              Contacto
            </Text>
            <div>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block', marginBottom: '8px' }}>
                📧 ventas@chainreactionprojects.com  info@siempredelocal.com
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block', marginBottom: '8px' }}>
                📞 +57 (321) 842 4968
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block', marginBottom: '8px' }}>
                📍 Medellín, Colombia
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block' }}>
                🕐 Lunes a Viernes: 8:00 - 18:00
              </Text>
            </div>
          </Space>
        </Col>
      </Row>

      <Divider style={{ 
        borderColor: 'rgba(255, 255, 255, 0.2)', 
        margin: '24px 0' 
      }} />

      {/* PTSyright y derechos reservados */}
      <Row justify="space-between" align="middle">
        <Col>
          <Text style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
            © {currentYear} SiempreDeLocal. Todos los derechos reservados.
          </Text>
        </Col>
        <Col>
          <Space>
            <Link 
              href="/privacy" 
              style={{ color: 'rgba(255, 255, 255, 0.65)' }}
            >
              Política de Privacidad
            </Link>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)' }}>|</Text>
            <Link 
              href="/terms" 
              style={{ color: 'rgba(255, 255, 255, 0.65)' }}
            >
              Términos de Servicio
            </Link>
            <Text style={{ color: 'rgba(255, 255, 255, 0.45)' }}>|</Text>
            <Link 
              href="/cookies" 
              style={{ color: 'rgba(255, 255, 255, 0.65)' }}
            >
              Política de Cookies
            </Link>
          </Space>
        </Col>
        <Col>
          <Text style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
            Hecho con <HeartOutlined style={{ color: '#ff4d4f' }} /> por Chain Reaction Projects S.A.S.
          </Text>
        </Col>
      </Row>

      {/* Versión del sistema */}
      <Row justify="center" style={{ marginTop: '16px' }}>
        <Col>
          <Text 
            type="secondary" 
            style={{ 
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.35)',
              fontFamily: 'monospace'
            }}
          >
            v1.0.0 • Build: 2024.01.15 • Ambiente: Producción
          </Text>
        </Col>
      </Row>
    </AntFooter>
  );
};

// Componente de footer simplificado para login/register
export const AuthFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '24px', 
      background: 'transparent',
      color: 'rgba(255, 255, 255, 0.85)',
      marginTop: 'auto'
    }}>
      <Space orientation="vertical" size="small">
        <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
          © {currentYear} SiempreDeLocal. Todos los derechos reservados.
        </Text>
        <Space split={<Text style={{ color: 'rgba(255, 255, 255, 0.45)' }}>•</Text>}>
          <Link 
            href="/privacy" 
            style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12px' }}
          >
            Privacidad
          </Link>
          <Link 
            href="/terms" 
            style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12px' }}
          >
            Términos
          </Link>
          <Link 
            href="/support" 
            style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12px' }}
          >
            Soporte
          </Link>
        </Space>
      </Space>
    </div>
  );
};

export default Footer;
