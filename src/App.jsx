// frontend/src/App.jsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme, Spin } from 'antd';
import esES from 'antd/locale/es_ES';
import './antd-theme.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Layout y contextos — siempre cargados
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from './context/AuthContext';
import { CompetitionProvider } from './context/CompetitionContext';
import { WalletProvider } from './context/WalletContext';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';

// Páginas — lazy: solo se descargan cuando el usuario navega a esa ruta
const Login               = lazy(() => import('./components/auth/Login'));
const Register            = lazy(() => import('./components/auth/Register'));
const ForgotPassword      = lazy(() => import('./components/auth/ForgotPassword'));
const ResetPassword       = lazy(() => import('./components/auth/ResetPassword'));

const Dashboard           = lazy(() => import('./components/Dashboard'));
const HomePage            = lazy(() => import('./pages/HomePage'));

const CompetitionList     = lazy(() => import('./components/competitions/CompetitionList'));
const CompetitionDetail   = lazy(() => import('./components/competitions/CompetitionDetail'));
const CompetitionForm     = lazy(() => import('./components/competitions/CompetitionForm'));
const CompetitionDashboard= lazy(() => import('./components/competitions/CompetitionDashboard'));

const TeamList            = lazy(() => import('./components/teams/TeamList'));
const TeamDetail          = lazy(() => import('./components/teams/TeamDetail'));
const TeamForm            = lazy(() => import('./components/teams/TeamForm'));

const MatchesPage         = lazy(() => import('./pages/matches/MatchesPage'));
const MatchDetail         = lazy(() => import('./components/matches/MatchDetail'));
const CreateMatchPage     = lazy(() => import('./pages/matches/CreateMatchPage'));
const EditMatchPage       = lazy(() => import('./pages/matches/EditMatchPage'));
const MatchesTodayPage    = lazy(() => import('./pages/matches/MatchesTodayPage'));
const MatchManagementPage = lazy(() => import('./pages/matches/MatchManagementPage'));

const RoundManagementPage = lazy(() => import('./pages/rounds/RoundManagementPage'));
const CompetitionRoundsPage=lazy(() => import('./pages/rounds/CompetitionRoundsPage'));
const CreateRoundPage     = lazy(() => import('./pages/rounds/CreateRoundPage'));
const EditRoundPage       = lazy(() => import('./pages/rounds/EditRoundPage'));
const RoundDetail         = lazy(() => import('./components/rounds/RoundDetail'));

const AdminUsersPage      = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminSystemPage     = lazy(() => import('./pages/admin/AdminSystemPage'));
const StandingsPage       = lazy(() => import('./pages/StandingsPage'));

const ProfilePage         = lazy(() => import('./pages/user/ProfilePage'));
const CalendarPage        = lazy(() => import('./pages/CalendarPage'));

const BetPage             = lazy(() => import('./pages/bets/BetPage'));
const BetDateDetail       = lazy(() => import('./pages/bets/BetDateDetail'));
const ActiveBets          = lazy(() => import('./pages/bets/ActiveBets'));
const BetRankingPage      = lazy(() => import('./pages/bets/BetRankingPage'));
const CommunityPredictionsPage = lazy(() => import('./pages/bets/CommunityPredictionsPage'));

const WalletPage          = lazy(() => import('./pages/wallet/WalletPage'));
const PurchaseCreditPage  = lazy(() => import('./pages/wallet/PurchaseCreditsPage'));
const TransactionHistoryPage = lazy(() => import('./pages/wallet/TransactionHistoryPage'));
const SecurityPolicyPage  = lazy(() => import('./pages/help/SecurityPolicyPage'));
const HelpPage            = lazy(() => import('./pages/help/HelpPage'));
const PerformanceReportPage = lazy(() => import('./pages/reports/PerformanceReportPage'));
const FinancialReportPage = lazy(() => import('./pages/reports/FinancialReportPage'));
const AttendanceReportPage= lazy(() => import('./pages/reports/AttendanceReportPage'));

const BetAdminPage        = lazy(() => import('./pages/admin/bets/BetAdminPage'));
const CreateBetDatePage   = lazy(() => import('./pages/admin/bets/CreateBetDatePage'));

const ArticlePage         = lazy(() => import('./pages/articles/ArticlePage'));
const AdminArticlesPage   = lazy(() => import('./pages/admin/articles/AdminArticlesPage'));

const PollaLandingPage    = lazy(() => import('./pages/polla/PollaLandingPage'));
const PollaDashboardPage  = lazy(() => import('./pages/polla/PollaDashboardPage'));
const PollaPredictionsPage= lazy(() => import('./pages/polla/PollaPredictionsPage'));
const PollaCheckoutPage   = lazy(() => import('./pages/polla/PollaCheckoutPage'));
const PollaAdminPage      = lazy(() => import('./pages/admin/polla/PollaAdminPage'));

const POLLA_MODE = import.meta.env.VITE_POLLA_MODE === 'true';

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#060d18' }}>
    <Spin size="large" />
  </div>
);

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
                <Suspense fallback={<PageLoader />}>
                <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={POLLA_MODE ? <Navigate to="/mundial" replace /> : <HomePage />} />
                <Route path="/home" element={POLLA_MODE ? <Navigate to="/mundial" replace /> : <HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/help/security" element={<SecurityPolicyPage />} />
                <Route path="/articles/:id" element={<ArticlePage />} />
                {/* Polla Mundial — landing pública */}
                <Route path="/mundial" element={<PollaLandingPage />} />
                
                {/* Rutas protegidas */}
                <Route element={<PrivateRoute />}>
                  <Route element={<MainLayout />}>
                    {/* Dashboard */}
                    <Route path="/dashboard" element={POLLA_MODE ? <Navigate to="/mundial/dashboard" replace /> : <Dashboard />} />

                    {/* Ayuda */}
                    <Route path="/help" element={<HelpPage />} />

                    {/* Rutas de perfil de usuario */}
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* =========================================== */}
                    {/* SISTEMA DE APUESTAS - ¡NUEVAS RUTAS! */}
                    {/* =========================================== */}
                    
                    {/* Polla Mundial — páginas autenticadas */}
                    <Route path="/mundial/dashboard" element={<PollaDashboardPage />} />
                    <Route path="/mundial/predict" element={<PollaPredictionsPage />} />
                    <Route path="/mundial/checkout" element={<PollaCheckoutPage />} />

                    {/* Pronósticos */}
                    <Route path="/bets" element={<BetPage />} />
                    <Route path="/bets/ranking" element={<BetRankingPage />} />
                    <Route path="/bets/community" element={<CommunityPredictionsPage />} />
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
                    <Route path="/matches/calendar" element={<CalendarPage />} />
                    <Route path="/matches/management" element={<MatchManagementPage />} />
                    <Route path="/matches/edit/:id" element={<EditMatchPage />} />
                    <Route path="/matches/:id" element={<MatchDetail />} />

                    {/* Reportes (solo admin) — gestionados en el bloque AdminRoute de abajo */}
                    
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
                    {/* Polla Mundial admin */}
                    <Route path="/admin/polla" element={<PollaAdminPage />} />
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
                </Suspense>
              </CompetitionProvider>
            </WalletProvider>
          </AuthProvider>
        </Router>
      </ThemedConfigProvider>
    </ThemeProvider>
  );
}

export default App;

