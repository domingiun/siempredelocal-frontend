// frontend/src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { Button, Spin } from 'antd';
import {
  LoginOutlined, UserAddOutlined, TrophyOutlined,
  FireOutlined, TeamOutlined, RightOutlined, FileTextOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import './HomePage.css';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
});

/* ─── utilidades bet dates ─── */
const getPrize = (d) =>
  (d?.total_prize || 0) ||
  ((d?.prize_PTS || 0) + (d?.accumulated_prize || 0)) ||
  (d?.prize_cop || 0);

const getStatusLabel = (status) => {
  const v = String(status || '').toLowerCase();
  if (v === 'open')     return { label: 'Abierta',    color: '#52c41a', bg: 'rgba(82,196,26,.15)' };
  if (v === 'closed')   return { label: 'Cerrada',    color: '#fa8c16', bg: 'rgba(250,140,22,.15)' };
  if (v === 'finished') return { label: 'Finalizada', color: '#1677ff', bg: 'rgba(22,119,255,.15)' };
  return                        { label: status || '—', color: '#8c9ab0', bg: 'rgba(140,154,176,.12)' };
};

const GRADIENTS = [
  'linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)',
  'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
  'linear-gradient(135deg,#0d0d0d 0%,#1a1a2e 50%,#16213e 100%)',
  'linear-gradient(135deg,#0b132b 0%,#1c2951 50%,#1b3a6b 100%)',
  'linear-gradient(135deg,#1b1b2f 0%,#162447 50%,#1f4068 100%)',
];

/* ─── Article Hero (artículo admin) ─── */
const ArticleHero = ({ article, onClick }) => (
  <button
    className="hp-hero-article"
    onClick={onClick}
    style={{
      background: article.image_url ? 'none' : GRADIENTS[0],
      backgroundImage: article.image_url ? `url(${article.image_url})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <div className="hp-hero-article__overlay" />
    <div className="hp-hero-article__content">
      <div className="hp-hero-article__meta">
        <span className="hp-hero-article__tag" style={{ color: '#7dd3fc', background: 'rgba(22,119,255,.15)', borderColor: '#1677ff' }}>
          Artículo
        </span>
      </div>
      <h2 className="hp-hero-article__title">{article.title}</h2>
      <p className="hp-hero-article__desc">
        {(article.content || '').slice(0, 140)}{(article.content || '').length > 140 ? '…' : ''}
      </p>
      <div className="hp-hero-article__footer">
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
          {new Date(article.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <span className="hp-hero-article__cta">
          Leer artículo <RightOutlined />
        </span>
      </div>
    </div>
  </button>
);

/* ─── Article Card pequeña ─── */
const ArticleCard = ({ article, index, onClick }) => (
  <button
    className="hp-article-card"
    onClick={onClick}
    style={{
      background: article.image_url ? 'none' : GRADIENTS[index % GRADIENTS.length],
      backgroundImage: article.image_url ? `url(${article.image_url})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <div className="hp-article-card__overlay" />
    <div className="hp-article-card__body">
      <span className="hp-article-card__tag" style={{ color: '#7dd3fc', background: 'rgba(22,119,255,.15)', borderColor: '#1677ff' }}>
        Artículo
      </span>
      <h3 className="hp-article-card__title">{article.title}</h3>
      <p className="hp-article-card__desc">
        {(article.content || '').slice(0, 100)}{(article.content || '').length > 100 ? '…' : ''}
      </p>
      <div className="hp-article-card__footer">
        <span className="hp-article-card__participants">
          {new Date(article.created_at).toLocaleDateString('es-CO')}
        </span>
      </div>
    </div>
  </button>
);

/* ─── HomePage ─── */
const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [articles, setArticles]     = useState([]);
  const [totalPrize, setTotalPrize] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [openDates, setOpenDates]   = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [articlesRes, statsRes] = await Promise.allSettled([
          publicApi.get('/articles/'),
          publicApi.get('/bet-integration/stats'),
        ]);

        if (articlesRes.status === 'fulfilled') {
          setArticles(articlesRes.value.data || []);
        }

        if (statsRes.status === 'fulfilled') {
          const s = statsRes.value.data;
          setTotalPrize(s?.total_prize_pool || 0);
          setActiveUsers(s?.total_users     || 0);
          setOpenDates(s?.active_betdates   || 0);
        }
      } catch (e) {
        console.error('HomePage load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const heroArticle   = articles[0] || null;
  const gridArticles  = articles.slice(1, 6);

  return (
    <div className="hp">

      {/* ══════════════════════════════
          HERO SECTION
      ══════════════════════════════ */}
      <header className="hp__hero">
        <div className="hp__hero-bg" />

        <nav className="hp__nav">
          <img src={logo} alt="Siempre de Local" className="hp__nav-logo" />
          <div className="hp__nav-actions">
            <Button
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
              className="hp__btn-login"
            >
              <span className="hp__btn-text">Iniciar sesión</span>
              <span className="hp__btn-text-short">Entrar</span>
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => navigate('/register')}
              className="hp__btn-register"
            >
              <span className="hp__btn-text">Obtener cuenta</span>
              <span className="hp__btn-text-short">Registro</span>
            </Button>
          </div>
        </nav>

        <div className="hp__hero-body">
          <img src={logo} alt="Siempre de Local" className="hp__hero-logo" />

          <div className="hp__hero-prize">
            <span className="hp__hero-prize-label">
              <TrophyOutlined style={{ marginRight: 6 }} />
              Acumulado total en premios
            </span>
            <span className="hp__hero-prize-value">
              {totalPrize.toLocaleString()}
              <span className="hp__hero-prize-unit"></span>
            </span>
          </div>

          <p className="hp__hero-tagline">
            Pronostica los marcadores, compite con la comunidad y Gana!.
          </p>

          <div className="hp__hero-stats">
            <div className="hp__hero-stat">
              <FireOutlined />
              <span>{openDates} fecha{openDates !== 1 ? 's' : ''} abierta{openDates !== 1 ? 's' : ''}</span>
            </div>
            <div className="hp__hero-stat-divider" />
            <div className="hp__hero-stat">
              <TeamOutlined />
              <span>{activeUsers} usuarios registrados</span>
            </div>
          </div>

          <div className="hp__hero-cta">
            <Button
              type="primary"
              size="large"
              icon={<FireOutlined />}
              onClick={() => navigate('/login')}
              className="hp__btn-play"
            >
              Participar ahora
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/register')}
              className="hp__btn-secondary"
            >
              Crear cuenta gratis
            </Button>
          </div>

          {/* Polla Mundial CTA */}
          <div className="hp__polla-cta">
            <button
              className="hp__polla-btn"
              onClick={() => navigate('/mundial')}
            >
              <span className="hp__polla-emoji">⚽</span>
              <span className="hp__polla-text">
                <span className="hp__polla-label">Polla Mundial 2026</span>
                <span className="hp__polla-sub">Predice los 104 partidos · Premio desde $1.000.000</span>
              </span>
              <span className="hp__polla-arrow">→</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════
          CONTENIDO: ARTÍCULOS
      ══════════════════════════════ */}
      <main className="hp__content">
        {loading ? (
          <div className="hp__loading">
            <Spin size="large" />
            <span>Cargando...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="hp__empty">
            <FileTextOutlined style={{ fontSize: 32, color: '#4a6fa5' }} />
            <span>No hay artículos publicados por el momento.</span>
          </div>
        ) : (
          <>
            <div className="hp__section-label">
              <FileTextOutlined style={{ marginRight: 6, color: '#1677ff' }} />
              Noticias y Artículos
            </div>

            {/* ── Article Hero ── */}
            {heroArticle && (
              <div className="hp__hero-article-wrap">
                <ArticleHero
                  article={heroArticle}
                  onClick={() => navigate(`/articles/${heroArticle.id}`)}
                />
              </div>
            )}

            {/* ── Grid de artículos ── */}
            {gridArticles.length > 0 && (
              <div className="hp__grid">
                {gridArticles.map((article, i) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    index={i + 1}
                    onClick={() => navigate(`/articles/${article.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer className="hp__footer">
        <div className="hp__footer-inner">
          <div className="hp__footer-col">
            <img src={logo} alt="Siempre de Local" className="hp__footer-logo" />
            <p className="hp__footer-about">
              Plataforma de pronósticos deportivos desarrollada por Chain Reaction
              Projects S.A.S. Para uso recreativo y de entretenimiento.
            </p>
          </div>
          <div className="hp__footer-col">
            <span className="hp__footer-heading">Plataforma</span>
            <a href="/login">Iniciar sesión</a>
            <a href="/register">Crear cuenta</a>
            <a href="/help/security">Política de seguridad</a>
          </div>
          <div className="hp__footer-col">
            <span className="hp__footer-heading">Contacto</span>
            <span>soporte@siempredelocal.com</span>
            <span>ventas@chainreactionprojects.com</span>
            <span>+57 321 842 4968</span>
            <span>Medellín, Colombia</span>
          </div>
        </div>
        <div className="hp__footer-bottom">
          <span>© {new Date().getFullYear()} Chain Reaction Projects S.A.S. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
