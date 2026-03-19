// frontend/src/components/layout/MainLayout.jsx
import React, { useEffect, useState } from 'react';
import { Layout, theme } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const { Content } = Layout;
const MOBILE_BREAKPOINT = 768;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const sidebarExpandedWidth = 280;
  const sidebarCollapsedWidth = isMobile ? 0 : 80;
  const sidebarWidth = collapsed ? sidebarCollapsedWidth : sidebarExpandedWidth;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar como componente separado */}
      <div
        style={{
          width: sidebarWidth,
          transition: 'all 0.2s',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'hidden',
        }}
      >
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} isMobile={isMobile} />
      </div>

      {/* Backdrop en mobile cuando el sidebar estÃ¡ abierto */}
      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 99,
          }}
        />
      )}
      
      {/* Layout principal con margen para el sidebar */}
      <Layout style={{ 
        marginLeft: isMobile ? 0 : (collapsed ? 80 : 280),
        transition: 'all 0.2s',
        minHeight: '100vh',
        background: 'var(--app-shell-bg)'
      }}>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />
        <Content
          className="app-content"
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: 'var(--app-content-bg)',
            borderRadius: borderRadiusLG,
            overflow: 'initial'
          }}
        >
          <Outlet />
        </Content>
        
        {/* Footer opcional */}
        <Layout.Footer style={{ 
          textAlign: 'center', 
          padding: '16px 50px',
          background: 'var(--app-footer-bg)',
          borderTop: '1px solid var(--app-footer-border)'
        }}>
          Chain Reaction Projects S.A.S. Sofrware ©2026 - Siempre de Local
        </Layout.Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
