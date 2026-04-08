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

// ─── Inline formatter: **bold**, *italic* ──────────────────────────────────
const parseInline = (text) => {
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  const parts = [];
  let last = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith('**'))
      parts.push(<strong key={m.index}>{m[2]}</strong>);
    else
      parts.push(<em key={m.index}>{m[3]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 1 ? parts : text;
};

// ─── Block parser ──────────────────────────────────────────────────────────
const parseContent = (raw = '') => {
  const lines = raw.split('\n');
  const blocks = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Pull quote:  >> frase <<
    const quoteMatch = trimmed.match(/^>>\s*(.+?)\s*<<$/);
    if (quoteMatch) { blocks.push({ type: 'quote', text: quoteMatch[1] }); continue; }

    // Inline image:  [IMG-LEFT: url | caption]  /  RIGHT / CENTER
    const imgMatch = trimmed.match(/^\[IMG-(LEFT|RIGHT|CENTER):\s*(.+?)(?:\s*\|\s*(.+?))?\]$/i);
    if (imgMatch) {
      blocks.push({ type: 'img', align: imgMatch[1].toLowerCase(), src: imgMatch[2].trim(), caption: imgMatch[3]?.trim() || '' });
      continue;
    }

    // H2
    if (trimmed.startsWith('## ')) { blocks.push({ type: 'h2', text: trimmed.slice(3) }); continue; }

    // H3
    if (trimmed.startsWith('### ')) { blocks.push({ type: 'h3', text: trimmed.slice(4) }); continue; }

    // Divider
    if (trimmed === '---') { blocks.push({ type: 'hr' }); continue; }

    // Empty
    if (trimmed === '') { blocks.push({ type: 'br' }); continue; }

    // Paragraph
    blocks.push({ type: 'p', text: line });
  }
  return blocks;
};

// ─── Block renderer ────────────────────────────────────────────────────────
const renderBlocks = (blocks) => {
  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    switch (b.type) {
      case 'quote':
        out.push(
          <blockquote key={i} className="ap__pullquote">
            <span className="ap__pullquote-mark">&ldquo;</span>
            <span className="ap__pullquote-text">{b.text}</span>
            <span className="ap__pullquote-mark ap__pullquote-mark--close">&rdquo;</span>
          </blockquote>
        );
        break;

      case 'img':
        out.push(
          <figure key={i} className={`ap__fig ap__fig--${b.align}`}>
            <img src={b.src} alt={b.caption || ''} className="ap__fig-img" />
            {b.caption && <figcaption className="ap__fig-caption">{b.caption}</figcaption>}
          </figure>
        );
        break;

      case 'h2':
        out.push(<h2 key={i} className="ap__h2">{b.text}</h2>);
        break;

      case 'h3':
        out.push(<h3 key={i} className="ap__h3">{b.text}</h3>);
        break;

      case 'hr':
        out.push(<hr key={i} className="ap__hr" />);
        break;

      case 'br':
        out.push(<div key={i} className="ap__spacer" />);
        break;

      default:
        out.push(<p key={i}>{parseInline(b.text)}</p>);
    }
  }
  return out;
};

// ─── Component ─────────────────────────────────────────────────────────────
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
  const blocks = parseContent(article.content);

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

        {/* Hero con imagen y título encima */}
        {article.image_url && (
          <div className="ap__hero-img-wrap">
            <img src={article.image_url} alt={article.title} className="ap__hero-img" />
            <div className="ap__hero-img-overlay" />
            <h1 className="ap__title-over-img">{article.title}</h1>
          </div>
        )}

        <div className="ap__body">

          {/* Título (sin imagen hero) */}
          {!article.image_url && <h1 className="ap__title">{article.title}</h1>}

          {/* Autor */}
          {hasAuthor ? (
            <div className="ap__author">
              <div className="ap__author-avatar">
                {article.author_photo_url
                  ? <img src={article.author_photo_url} alt={article.author_name || 'Autor'} className="ap__author-img" />
                  : <div className="ap__author-placeholder"><UserOutlined /></div>
                }
              </div>
              <div className="ap__author-info">
                {article.author_name && <span className="ap__author-name">{article.author_name}</span>}
                {article.author_bio  && <span className="ap__author-bio">{article.author_bio}</span>}
              </div>
              <div className="ap__author-date">
                {new Date(article.created_at).toLocaleDateString('es-CO', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
            </div>
          ) : (
            <div className="ap__meta">
              {new Date(article.created_at).toLocaleDateString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          )}

          {/* Contenido enriquecido */}
          <div className="ap__content">
            {renderBlocks(blocks)}
          </div>

        </div>
      </article>
    </div>
  );
};

export default ArticlePage;
