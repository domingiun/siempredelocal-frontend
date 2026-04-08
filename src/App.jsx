// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import esES from 'antd/locale/es_ES';
import './antd-theme.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CompetitionProvider } from './context/CompetitionContext';
import { WalletProvider } from './context/WalletContext';

// Páginas de Autenticación
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Páginas Principales
import Dashboard from './components/Dashboard';
import HomePage from './pages/HomePage';

// Páginas de Competencias
import CompetitionList from './components/competitions/CompetitionList';
import CompetitionDetail from './components/competitions/CompetitionDetail';
import CompetitionForm from './components/competitions/CompetitionForm';
import CompetitionDashboard from './components/competitions/CompetitionDashboard';

// Páginas de Equipos
import TeamList from './components/teams/TeamList';
import TeamDetail from './components/teams/TeamDetail';
import TeamForm from './components/teams/TeamForm';

// Páginas de Partidos
import MatchesPage from './pages/matches/MatchesPage';
import MatchDetail from './components/matches/MatchDetail';
import CreateMatchPage from './pages/matches/CreateMatchPage';
import EditMatchPage from './pages/matches/EditMatchPage';
import MatchesTodayPage from './pages/matches/MatchesTodayPage';

// Páginas de Jornadas
import RoundManagementPage from './pages/rounds/RoundManagementPage';
import CompetitionRoundsPage from './pages/rounds/CompetitionRoundsPage';
import CreateRoundPage from './pages/rounds/CreateRoundPage';
import EditRoundPage from './pages/rounds/EditRoundPage';
import RoundDetail from './components/rounds/RoundDetail';

// Páginas de Administración
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSystemPage from './pages/admin/AdminSystemPage';

// Páginas de Clasificación
import StandingsPage from './pages/StandingsPage';

// ¡NUEVAS PÁGINAS DE APUESTAS!
// Páginas de Usuario
import ProfilePage from './pages/user/ProfilePage';
import CalendarPage from './pages/CalendarPage';

// Páginas de Pronósticos
import BetPage from './pages/bets/BetPage';
import BetDateDetail from './pages/bets/BetDateDetail';
import ActiveBets from './pages/bets/ActiveBets';
import BetRankingPage from './pages/bets/BetRankingPage';

// Páginas de Mi Cuenta
import WalletPage from './pages/wallet/WalletPage';
import PurchaseCreditPage from './pages/wallet/PurchaseCreditsPage';
import TransactionHistoryPage from './pages/wallet/TransactionHistoryPage';
import SecurityPolicyPage from './pages/help/SecurityPolicyPage';
import PerformanceReportPage from './pages/reports/PerformanceReportPage';
import FinancialReportPage from './pages/reports/FinancialReportPage';
import AttendanceReportPage from './pages/reports/AttendanceReportPage';

// Páginas de Administración de Pronósticos
import BetAdminPage from './pages/admin/bets/BetAdminPage';
import CreateBetDatePage from './pages/admin/bets/CreateBetDatePage';

// Artículos
import ArticlePage from './pages/articles/ArticlePage';
import AdminArticlesPage from './pages/admin/articles/AdminArticlesPage';

// Componentes comunes
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';

const ThemedConfigProvider = ({ children }) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  return (
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          ...(isDark ? {
            // Fondo base y de componentes — paleta de la app
            colorBgBase:        '#0b0f16',
            colorBgContainer:   '#0c141f',   // inputs, selects cerrados
            colorBgElevated:    '#0f1824',   // dropdowns, modales, popovers
            colorBgLayout:      '#0b0f16',
            colorBgSpotlight:   '#111b28',
            // Bordes
            colorBorder:        '#1f2b3a',
            colorBorderSecondary: '#172030',
            // Texto
            colorText:          '#e6edf3',
            colorTextSecondary: '#94a3b8',
            colorTextTertiary:  '#64748b',
            colorTextPlaceholder: '#64748b',
          } : {}),
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ThemedConfigProvider>
        <Router>
          <AuthProvider>
            <WalletProvider> {/* ¡NUEVO! Envolver todo con WalletProvider */}
              <CompetitionProvider>
                <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/help/security" element={<SecurityPolicyPage />} />
                <Route path="/articles/:id" element={<ArticlePage />} />
                
                {/* Rutas protegidas */}
                <Route element={<PrivateRoute />}>
                  <Route element={<MainLayout />}>
                    {/* Dashboard */}
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Rutas de perfil de usuario */}
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* =========================================== */}
                    {/* SISTEMA DE APUESTAS - ¡NUEVAS RUTAS! */}
                    {/* =========================================== */}
                    
                    {/* Pronósticos */}
                    <Route path="/bets" element={<BetPage />} />
                    <Route path="/bets/ranking" element={<BetRankingPage />} />
                    <Route path="/bets/:id" element={<BetDateDetail />} />
                    <Route path="/bets/:id/place" element={<BetDateDetail />} />
                    <Route path="/active-bets" element={<ActiveBets />} />
                    
                    {/* Mi Cuenta */}
                    <Route path="/wallet" element={<WalletPage />} />
                    <Route path="/purchase" element={<PurchaseCreditPage />} />
                    <Route path="/transactions" element={<TransactionHistoryPage />} />
                    
                    {/* Administración de Pronósticos — SOLO ADMIN (C6) */}

                    {/* =========================================== */}
                    {/* SISTEMA DE COMPETENCIAS - EXISTENTES */}
                    {/* =========================================== */}
                    
                    {/* Competencias */}
                    <Route path="/competitions" element={<CompetitionList />} />
                    <Route path="/competitions/new" element={<CompetitionForm />} />
                    <Route path="/competitions/:id" element={<CompetitionDashboard />} />
                    <Route path="/competitions/:id/simple" element={<CompetitionDetail />} />
                    <Route path="/competitions/:id/edit" element={<CompetitionForm />} />
                    
                    {/* Equipos */}
                    <Route path="/teams" element={<TeamList />} />
                    <Route path="/teams/new" element={<TeamForm />} />
                    <Route path="/teams/:id" element={<TeamDetail />} />
                    <Route path="/teams/:id/edit" element={<TeamForm />} />
                    
                    {/* Partidos */}
                    <Route path="/matches" element={<MatchesPage />} />
                    <Route path="/matches/today" element={<MatchesTodayPage />} />
                    <Route path="/matches/new" element={<CreateMatchPage />} />
                    <Route path="/matches/edit/:id" element={<EditMatchPage />} />
                    <Route path="/matches/:id" element={<MatchDetail />} />

                    {/* Reportes (solo admin) — gestionados en el bloque AdminRoute de abajo */}

                    {/* Calendario */}
                    <Route path="/matches/calendar" element={<CalendarPage />} />
                    
                    {/* Jornadas */}
                    <Route path="/rounds/management" element={<RoundManagementPage />} />
                    <Route path="/rounds/new" element={<CreateRoundPage />} />
                    <Route path="/rounds/edit/:id" element={<EditRoundPage />} />
                    <Route path="/competitions/:competitionId/rounds" element={<CompetitionRoundsPage />} />
                    <Route path="/competitions/:competitionId/rounds/:roundId" element={<RoundDetail />} />
                    
                    {/* Clasificación */}
                    <Route path="/standings/:competitionId" element={<StandingsPage />} />
                  </Route>
                </Route>

                {/* Rutas exclusivas de ADMIN (C6) — AdminRoute valida rol en frontend */}
                <Route element={<AdminRoute />}>
                  <Route element={<MainLayout />}>
                    {/* Pronósticos admin */}
                    <Route path="/admin/bets" element={<BetAdminPage />} />
                    <Route path="/admin/create-betdate" element={<CreateBetDatePage />} />
                    <Route path="/admin/bets/:id" element={<BetAdminPage />} />
                    {/* Artículos del homepage */}
                    <Route path="/admin/articles" element={<AdminArticlesPage />} />
                    {/* Usuarios y sistema */}
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/system" element={<AdminSystemPage />} />
                    {/* Reportes */}
                    <Route path="/reports/performance" element={<PerformanceReportPage />} />
                    <Route path="/reports/financial" element={<FinancialReportPage />} />
                    <Route path="/reports/attendance" element={<AttendanceReportPage />} />
                  </Route>
                </Route>

                {/* Ruta 404 */}
                <Route path="*" element={
                  <div style={{ padding: '50px', textAlign: 'center' }}>
                    <h1>404 - Página no encontrada</h1>
                    <p>La página que buscas no existe.</p>
                  </div>
                } />
                </Routes>
              </CompetitionProvider>
            </WalletProvider>
          </AuthProvider>
        </Router>
      </ThemedConfigProvider>
    </ThemeProvider>
  );
}

export default App;

