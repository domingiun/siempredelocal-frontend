// frontend/src/pages/articles/ArticlePage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button } from 'antd';
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import logo from '../../assets/logo.png';
import './ArticlePage.css';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

const ArticlePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await publicApi.get(`/articles/${id}`);
        setArticle(res.data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="ap ap--loading"><Spin size="large" /></div>;
  if (notFound || !article) return (
    <div className="ap ap--notfound">
      <p>Artículo no encontrado.</p>
      <Button onClick={() => navigate('/')}>Volver al inicio</Button>
    </div>
  );

  const hasAuthor = article.author_name || article.author_bio || article.author_photo_url;

  return (
    <div className="ap">

      {/* Nav */}
      <nav className="ap__nav">
        <img src={logo} alt="Siempre de Local" className="ap__logo" />
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} className="ap__back-btn">
          Volver
        </Button>
      </nav>

      <article className="ap__article">

        {/* Imagen hero con título encima */}
        {article.image_url && (
          <div className="ap__hero-img-wrap">
            <img src={article.image_url} alt={article.title} className="ap__hero-img" />
            <div className="ap__hero-img-overlay" />
            <h1 className="ap__title-over-img">{article.title}</h1>
          </div>
        )}

        <div className="ap__body">

          {/* Título (solo si no hay imagen) */}
          {!article.image_url && <h1 className="ap__title">{article.title}</h1>}

          {/* Autor */}
          {hasAuthor && (
            <div className="ap__author">
              <div className="ap__author-avatar">
                {article.author_photo_url
                  ? <img src={article.author_photo_url} alt={article.author_name || 'Autor'} className="ap__author-img" />
                  : <div className="ap__author-placeholder"><UserOutlined /></div>
                }
              </div>
              <div className="ap__author-info">
                {article.author_name && (
                  <span className="ap__author-name">{article.author_name}</span>
                )}
                {article.author_bio && (
                  <span className="ap__author-bio">{article.author_bio}</span>
                )}
              </div>
              <div className="ap__author-date">
                {new Date(article.created_at).toLocaleDateString('es-CO', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
            </div>
          )}

          {/* Fecha (si no hay autor) */}
          {!hasAuthor && (
            <div className="ap__meta">
              {new Date(article.created_at).toLocaleDateString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          )}

          {/* Contenido */}
          <div className="ap__content">
            {(article.content || '').split('\n').map((line, i) =>
              line.trim() === '' ? <br key={i} /> : <p key={i}>{line}</p>
            )}
          </div>

        </div>
      </article>
    </div>
  );
};

export default ArticlePage;
