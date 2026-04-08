// frontend/src/pages/admin/articles/AdminArticlesPage.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Switch, Upload,
  message, Popconfirm, Space, Tag, Image, Typography,
  Avatar, Divider, Tooltip, Collapse, Select, Spin, Radio
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
  EyeOutlined, FileTextOutlined, UserOutlined, QuestionCircleOutlined,
  PictureOutlined, ReloadOutlined, AlignLeftOutlined, AlignCenterOutlined,
  AlignRightOutlined
} from '@ant-design/icons';
import api from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

// ─── Syntax cheatsheet items ───────────────────────────────────────────────
const SYNTAX_GUIDE = [
  { mark: '## Subtítulo',            desc: 'Encabezado grande de sección' },
  { mark: '### Subtítulo menor',     desc: 'Encabezado pequeño' },
  { mark: '>> frase destacada <<',   desc: 'Pull quote en color azul (frase resaltada)' },
  { mark: '[IMG-LEFT: url | pie]',   desc: 'Imagen flotante izquierda (usa el botón "Imágenes" para seleccionar del banco)' },
  { mark: '[IMG-RIGHT: url | pie]',  desc: 'Imagen flotante derecha' },
  { mark: '[IMG-CENTER: url | pie]', desc: 'Imagen centrada ancho completo' },
  { mark: '---',                     desc: 'Línea separadora decorativa' },
  { mark: '**texto**',               desc: 'Negrita' },
  { mark: '*texto*',                 desc: 'Cursiva' },
];

// ─── Inline parser (same as ArticlePage) — for preview ────────────────────
const parseInline = (text) => {
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  const parts = []; let last = 0; let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith('**')) parts.push(<strong key={m.index}>{m[2]}</strong>);
    else parts.push(<em key={m.index}>{m[3]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 1 ? parts : text;
};

const parseBlocks = (raw = '') => raw.split('\n').map((line) => {
  const t = line.trim();
  const quoteM = t.match(/^>>\s*(.+?)\s*<<$/);
  if (quoteM) return { type: 'quote', text: quoteM[1] };
  const imgM = t.match(/^\[IMG-(LEFT|RIGHT|CENTER):\s*(.+?)(?:\s*\|\s*(.+?))?\]$/i);
  if (imgM) return { type: 'img', align: imgM[1].toLowerCase(), src: imgM[2].trim(), caption: imgM[3]?.trim() || '' };
  if (t.startsWith('## ')) return { type: 'h2', text: t.slice(3) };
  if (t.startsWith('### ')) return { type: 'h3', text: t.slice(4) };
  if (t === '---') return { type: 'hr' };
  if (t === '') return { type: 'br' };
  return { type: 'p', text: line };
});

// ─── Mini preview ──────────────────────────────────────────────────────────
const Preview = ({ content }) => {
  const blocks = parseBlocks(content);
  return (
    <div style={{ fontFamily: 'Georgia, serif', color: '#c8d5e8', lineHeight: 1.8, overflow: 'hidden' }}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'quote':
            return (
              <blockquote key={i} style={{ borderLeft: '4px solid #1677ff', background: 'rgba(22,119,255,.07)', margin: '20px -4px', padding: '16px 20px', borderRadius: '0 8px 8px 0' }}>
                <span style={{ fontSize: 36, lineHeight: .7, color: '#1677ff', float: 'left', marginRight: 8 }}>&ldquo;</span>
                <span style={{ fontSize: 17, fontWeight: 700, fontStyle: 'italic', color: '#60a5fa' }}>{b.text}</span>
                <span style={{ fontSize: 36, lineHeight: 0, color: '#1677ff', float: 'right', marginBottom: -8 }}>&rdquo;</span>
              </blockquote>
            );
          case 'img':
            return (
              <figure key={i} style={{
                float: b.align === 'left' ? 'left' : b.align === 'right' ? 'right' : 'none',
                width: b.align === 'center' ? '100%' : '40%',
                margin: b.align === 'left' ? '4px 20px 12px 0' : b.align === 'right' ? '4px 0 12px 20px' : '20px 0',
                clear: b.align === 'center' ? 'both' : b.align,
              }}>
                <img src={b.src} alt={b.caption} style={{ width: '100%', borderRadius: 6, objectFit: 'cover' }} />
                {b.caption && <figcaption style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>{b.caption}</figcaption>}
              </figure>
            );
          case 'h2': return <h2 key={i} style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '28px 0 10px', borderBottom: '2px solid rgba(22,119,255,.3)', paddingBottom: 6 }}>{b.text}</h2>;
          case 'h3': return <h3 key={i} style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', margin: '20px 0 8px' }}>{b.text}</h3>;
          case 'hr': return <hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(22,119,255,.3)', margin: '24px 0' }} />;
          case 'br': return <div key={i} style={{ height: 8 }} />;
          default:   return <p key={i} style={{ fontSize: 15, margin: '0 0 14px' }}>{parseInline(b.text)}</p>;
        }
      })}
    </div>
  );
};

// ─── Folder labels ─────────────────────────────────────────────────────────
const FOLDER_LABELS = {
  'article-images':    'Imágenes de artículos',
  'logos':             'Logos de equipos',
  'competition-logos': 'Logos de competencias',
  'author-photos':     'Fotos de autores',
  'avatars':           'Avatares',
};

// ─── Image Picker Modal ─────────────────────────────────────────────────────
const ImagePicker = ({ open, onClose, onInsert }) => {
  const [images, setImages]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [folder, setFolder]       = useState('all');
  const [selected, setSelected]   = useState(null);
  const [align, setAlign]         = useState('center');
  const [caption, setCaption]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/articles/admin/images');
      setImages(res.data || []);
    } catch {
      message.error('No se pudo cargar el banco de imágenes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) { load(); setSelected(null); setCaption(''); setAlign('center'); } }, [open]);

  const folders = ['all', ...new Set((images || []).map(i => i.folder))];
  const filtered = folder === 'all' ? images : images.filter(i => i.folder === folder);

  const handleInsert = () => {
    if (!selected) { message.warning('Selecciona una imagen'); return; }
    onInsert({ url: selected.url, align, caption });
    onClose();
  };

  return (
    <Modal
      title={<span><PictureOutlined style={{ marginRight: 8, color: '#1677ff' }} />Banco de imágenes</span>}
      open={open}
      onCancel={onClose}
      onOk={handleInsert}
      okText="Insertar imagen"
      cancelText="Cancelar"
      width={860}
      styles={{ body: { padding: '12px 0' } }}
    >
      {/* Filtro de carpeta + reload */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 16px 12px' }}>
        <Select
          value={folder}
          onChange={setFolder}
          style={{ flex: 1 }}
          options={folders.map(f => ({ value: f, label: f === 'all' ? 'Todas las carpetas' : (FOLDER_LABELS[f] || f) }))}
        />
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading} />
      </div>

      {/* Grid de imágenes */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No hay imágenes en esta carpeta</div>
      ) : (
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          {filtered.map((img, i) => {
            const isSel = selected?.url === img.url;
            return (
              <div
                key={i}
                onClick={() => setSelected(img)}
                style={{
                  cursor: 'pointer',
                  border: `2px solid ${isSel ? '#1677ff' : 'transparent'}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#0c141f',
                  transition: 'border-color .15s',
                }}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
                {isSel && (
                  <div style={{ position: 'absolute', top: 4, right: 4, background: '#1677ff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>
                    ✓
                  </div>
                )}
                <div style={{ fontSize: 10, color: '#64748b', padding: '4px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {img.name}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Opciones de inserción */}
      {selected && (
        <div style={{ padding: '16px 16px 0', borderTop: '1px solid #1f2b3a', marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>Posición:</Text>
              <Radio.Group value={align} onChange={e => setAlign(e.target.value)} size="small">
                <Radio.Button value="left"><AlignLeftOutlined /> Izquierda</Radio.Button>
                <Radio.Button value="center"><AlignCenterOutlined /> Centro</Radio.Button>
                <Radio.Button value="right"><AlignRightOutlined /> Derecha</Radio.Button>
              </Radio.Group>
            </div>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>Pie de foto:</Text>
              <Input
                size="small"
                placeholder="Descripción opcional..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginTop: 10, padding: '8px 10px', background: '#0c141f', borderRadius: 6, fontSize: 12, color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            [IMG-{align.toUpperCase()}: {selected.url}{caption ? ` | ${caption}` : ''}]
          </div>
        </div>
      )}
    </Modal>
  );
};

// ─── Main component ────────────────────────────────────────────────────────
const AdminArticlesPage = () => {
  const [articles, setArticles]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [showPreview, setShowPreview]   = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [pickerOpen, setPickerOpen]     = useState(false);

  const [imageFile, setImageFile]         = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [authorFile, setAuthorFile]       = useState(null);
  const [authorPreview, setAuthorPreview] = useState(null);

  const [form] = Form.useForm();
  const taRef  = useRef(null);  // ref to antd TextArea

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/articles/admin/all');
      setArticles(res.data || []);
    } catch {
      message.error('No se pudieron cargar los artículos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setImageFile(null); setImagePreview(null);
    setAuthorFile(null); setAuthorPreview(null);
    setShowPreview(false); setPreviewContent('');
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setImageFile(null);  setImagePreview(record.image_url || null);
    setAuthorFile(null); setAuthorPreview(record.author_photo_url || null);
    setShowPreview(false); setPreviewContent(record.content || '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const fd = new FormData();
      fd.append('title',       values.title);
      fd.append('content',     values.content);
      fd.append('published',   values.published ? 'true' : 'false');
      fd.append('author_name', values.author_name || '');
      fd.append('author_bio',  values.author_bio  || '');
      if (imageFile)  fd.append('image',        imageFile);
      if (authorFile) fd.append('author_photo', authorFile);

      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url  = editing ? `${BASE}/articles/${editing.id}` : `${BASE}/articles/`;
      const res  = await fetch(url, { method: editing ? 'PUT' : 'POST', credentials: 'include', body: fd });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || `Error ${res.status}`);
      }
      message.success(editing ? 'Artículo actualizado' : 'Artículo creado');
      setModalOpen(false);
      load();
    } catch (err) {
      if (err?.errorFields) return;
      message.error('Error al guardar el artículo');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/articles/${id}`);
      message.success('Artículo eliminado');
      load();
    } catch {
      message.error('Error al eliminar');
    }
  };

  const makeBeforeUpload = (setFile, setPreview) => (file) => {
    if (!file.type.startsWith('image/')) { message.error('Solo imágenes'); return Upload.LIST_IGNORE; }
    if (file.size > 10 * 1024 * 1024)   { message.error('Máximo 10 MB');  return Upload.LIST_IGNORE; }
    setFile(file); setPreview(URL.createObjectURL(file));
    return false;
  };

  // ── Toolbar: insert syntax at cursor ──────────────────────────────────
  const getTA = () => taRef.current?.resizableTextArea?.textArea;

  const insertAtCursor = (before, after = '', placeholder = '') => {
    const ta = getTA();
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const cur   = form.getFieldValue('content') || '';
    const sel   = cur.substring(start, end) || placeholder;
    const next  = cur.substring(0, start) + before + sel + after + cur.substring(end);
    form.setFieldValue('content', next);
    setPreviewContent(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + sel.length);
    }, 0);
  };

  const insertLine = (line) => {
    const ta = getTA();
    if (!ta) return;
    const cur  = form.getFieldValue('content') || '';
    const pos  = ta.selectionStart;
    // Find start of current line
    const lineStart = cur.lastIndexOf('\n', pos - 1) + 1;
    const next = cur.substring(0, lineStart) + line + '\n' + cur.substring(lineStart);
    form.setFieldValue('content', next);
    setPreviewContent(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + line.length + 1, lineStart + line.length + 1); }, 0);
  };

  const handlePickerInsert = ({ url, align, caption }) => {
    const line = `[IMG-${align.toUpperCase()}: ${url}${caption ? ` | ${caption}` : ''}]`;
    insertLine(line);
  };

  const TOOLBAR = [
    { icon: '## H2', tip: 'Subtítulo grande', action: () => insertLine('## Subtítulo de sección') },
    { icon: '### H3', tip: 'Subtítulo pequeño', action: () => insertLine('### Subtítulo menor') },
    { icon: '❝ Frase', tip: 'Pull quote (frase destacada)', action: () => insertAtCursor('>> ', ' <<', 'Escribe aquí la frase destacada') },
    { icon: '━━', tip: 'Separador horizontal', action: () => insertLine('---') },
    { icon: 'N', tip: 'Negrita (**texto**)', action: () => insertAtCursor('**', '**', 'texto en negrita'), bold: true },
    { icon: 'I', tip: 'Cursiva (*texto*)', action: () => insertAtCursor('*', '*', 'texto en cursiva'), italic: true },
  ];

  const columns = [
    {
      title: 'Imagen', dataIndex: 'image_url', width: 80,
      render: (url) => url
        ? <Image src={url} width={60} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} />
        : <div style={{ width: 60, height: 40, background: '#1c2b3a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileTextOutlined style={{ color: '#4a6fa5' }} />
          </div>,
    },
    {
      title: 'Título', dataIndex: 'title',
      render: (t, r) => (
        <div>
          <Text strong style={{ color: '#e6edf3', display: 'block' }}>{t}</Text>
          {r.author_name && <Text style={{ fontSize: 12, color: '#64748b' }}><UserOutlined style={{ marginRight: 4 }} />{r.author_name}</Text>}
        </div>
      ),
    },
    {
      title: 'Estado', dataIndex: 'published', width: 110,
      render: (v) => v ? <Tag color="green">Publicado</Tag> : <Tag color="default">Borrador</Tag>,
    },
    {
      title: 'Fecha', dataIndex: 'created_at', width: 120,
      render: (d) => new Date(d).toLocaleDateString('es-CO'),
    },
    {
      title: 'Acciones', width: 140,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => window.open(`/articles/${record.id}`, '_blank')} />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="¿Eliminar este artículo?" onConfirm={() => handleDelete(record.id)} okText="Sí" cancelText="No">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#e6edf3' }}>
          <FileTextOutlined style={{ marginRight: 10, color: '#1677ff' }} />
          Artículos del Homepage
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Nuevo Artículo
        </Button>
      </div>

      <Table dataSource={articles} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <ImagePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onInsert={handlePickerInsert} />

      <Modal
        title={editing ? 'Editar artículo' : 'Nuevo artículo'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        afterOpenChange={(open) => {
          if (open) {
            if (editing) {
              form.setFieldsValue({ title: editing.title, content: editing.content, published: editing.published, author_name: editing.author_name || '', author_bio: editing.author_bio || '' });
            } else {
              form.resetFields();
              form.setFieldsValue({ published: true });
            }
          }
        }}
        okText={editing ? 'Guardar cambios' : 'Crear'}
        cancelText="Cancelar"
        confirmLoading={saving}
        width={820}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>

          {/* Imagen del artículo */}
          <Form.Item label="Imagen principal (hero del artículo)">
            <Upload accept="image/*" beforeUpload={makeBeforeUpload(setImageFile, setImagePreview)} showUploadList={false} maxCount={1}>
              <Button icon={<UploadOutlined />}>{imageFile ? 'Cambiar imagen' : 'Subir imagen'}</Button>
            </Upload>
            {imagePreview && (
              <img src={imagePreview} alt="preview" style={{ marginTop: 12, width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
            )}
          </Form.Item>

          {/* Título */}
          <Form.Item name="title" label="Título" rules={[{ required: true, message: 'Ingresa un título' }]}>
            <Input placeholder="Título del artículo" />
          </Form.Item>

          {/* Toolbar de formato */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 12, color: '#64748b', marginRight: 4 }}>Insertar:</Text>
              {TOOLBAR.map((btn, idx) => (
                <Tooltip key={idx} title={btn.tip}>
                  <button
                    type="button"
                    onClick={btn.action}
                    style={{
                      padding: '3px 10px',
                      fontSize: 12,
                      fontWeight: btn.bold ? 700 : 400,
                      fontStyle: btn.italic ? 'italic' : 'normal',
                      background: '#1c2b3a',
                      border: '1px solid #2b3a4f',
                      borderRadius: 4,
                      color: '#c8d5e8',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      lineHeight: '1.6',
                    }}
                  >
                    {btn.icon}
                  </button>
                </Tooltip>
              ))}
              {/* Botón banco de imágenes */}
              <Tooltip title="Insertar imagen del banco de imágenes">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  style={{
                    padding: '3px 10px',
                    fontSize: 12,
                    background: '#162235',
                    border: '1px solid #1677ff',
                    borderRadius: 4,
                    color: '#60a5fa',
                    cursor: 'pointer',
                    lineHeight: '1.6',
                    marginLeft: 4,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <PictureOutlined /> Imágenes
                </button>
              </Tooltip>
              <Tooltip title="Ver / ocultar vista previa">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewContent(form.getFieldValue('content') || '');
                    setShowPreview(p => !p);
                  }}
                  style={{
                    padding: '3px 10px',
                    fontSize: 12,
                    background: showPreview ? '#1677ff' : '#1c2b3a',
                    border: `1px solid ${showPreview ? '#1677ff' : '#2b3a4f'}`,
                    borderRadius: 4,
                    color: '#fff',
                    cursor: 'pointer',
                    lineHeight: '1.6',
                    marginLeft: 8,
                  }}
                >
                  {showPreview ? '✕ Previa' : '👁 Previa'}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Contenido */}
          <Form.Item name="content" label="Contenido del artículo" rules={[{ required: true, message: 'Escribe el contenido' }]}>
            <TextArea
              ref={taRef}
              rows={showPreview ? 10 : 14}
              placeholder="Escribe el contenido completo..."
              showCount
              maxLength={20000}
              onChange={(e) => setPreviewContent(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Form.Item>

          {/* Vista previa */}
          {showPreview && (
            <div style={{
              background: '#0c141f',
              border: '1px solid #1f2b3a',
              borderRadius: 8,
              padding: '20px 24px',
              marginBottom: 20,
              maxHeight: 420,
              overflowY: 'auto',
            }}>
              <Text style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 12, fontFamily: 'sans-serif' }}>
                VISTA PREVIA DEL CONTENIDO
              </Text>
              <Preview content={previewContent} />
            </div>
          )}

          {/* Guía de sintaxis */}
          <Collapse ghost size="small" style={{ marginBottom: 12 }}>
            <Panel
              header={<Text style={{ fontSize: 12, color: '#64748b' }}><QuestionCircleOutlined style={{ marginRight: 6 }} />Guía de formato del contenido</Text>}
              key="guide"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SYNTAX_GUIDE.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <code style={{ background: '#0c141f', border: '1px solid #1f2b3a', borderRadius: 4, padding: '1px 8px', fontSize: 12, color: '#60a5fa', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {g.mark}
                    </code>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>{g.desc}</Text>
                  </div>
                ))}
              </div>
            </Panel>
          </Collapse>

          <Divider>Información del Autor</Divider>

          {/* Foto del autor */}
          <Form.Item label="Foto del autor">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {authorPreview
                ? <img src={authorPreview} alt="autor" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1677ff' }} />
                : <Avatar size={56} icon={<UserOutlined />} style={{ background: '#1c2b3a' }} />
              }
              <Upload accept="image/*" beforeUpload={makeBeforeUpload(setAuthorFile, setAuthorPreview)} showUploadList={false} maxCount={1}>
                <Button icon={<UploadOutlined />} size="small">{authorFile ? 'Cambiar foto' : 'Subir foto'}</Button>
              </Upload>
            </div>
          </Form.Item>

          <Form.Item name="author_name" label="Nombre del autor">
            <Input placeholder="Ej: Johan García Blandón" />
          </Form.Item>

          <Form.Item name="author_bio" label="Reseña del autor (máx. 2 líneas)">
            <TextArea rows={2} placeholder="Ej: 20 años de experiencia en fútbol europeo y análisis táctico." maxLength={300} showCount />
          </Form.Item>

          <Form.Item name="published" label="Estado" valuePropName="checked">
            <Switch checkedChildren="Publicado" unCheckedChildren="Borrador" />
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
};

export default AdminArticlesPage;
