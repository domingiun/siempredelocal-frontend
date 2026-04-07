// frontend/src/pages/admin/articles/AdminArticlesPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Switch, Upload,
  message, Popconfirm, Space, Tag, Image, Typography, Avatar, Divider
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  UploadOutlined, EyeOutlined, FileTextOutlined, UserOutlined
} from '@ant-design/icons';
import api from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const AdminArticlesPage = () => {
  const [articles, setArticles]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const [imageFile, setImageFile]           = useState(null);
  const [imagePreview, setImagePreview]     = useState(null);
  const [authorFile, setAuthorFile]         = useState(null);
  const [authorPreview, setAuthorPreview]   = useState(null);
  const [form] = Form.useForm();

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
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setImageFile(null);   setImagePreview(record.image_url || null);
    setAuthorFile(null);  setAuthorPreview(record.author_photo_url || null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const fd = new FormData();
      fd.append('title',     values.title);
      fd.append('content',   values.content);
      fd.append('published', values.published ? 'true' : 'false');
      fd.append('author_name', values.author_name || '');
      fd.append('author_bio',  values.author_bio  || '');
      if (imageFile)  fd.append('image',        imageFile);
      if (authorFile) fd.append('author_photo', authorFile);

      // Con FormData axios genera Content-Type+boundary automáticamente.
      // Hay que eliminar el Content-Type del header default (application/json)
      // para que no interfiera con el multipart.
      // fetch nativo: maneja FormData+boundary correctamente sin config extra
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url  = editing
        ? `${BASE}/articles/${editing.id}`
        : `${BASE}/articles/`;

      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',   // envía la cookie httpOnly
        body: fd,                 // browser auto-setea multipart+boundary
      });

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
    setFile(file);
    setPreview(URL.createObjectURL(file));
    return false;
  };

  const columns = [
    {
      title: 'Imagen',
      dataIndex: 'image_url',
      width: 80,
      render: (url) => url
        ? <Image src={url} width={60} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} />
        : <div style={{ width: 60, height: 40, background: '#1c2b3a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileTextOutlined style={{ color: '#4a6fa5' }} />
          </div>,
    },
    {
      title: 'Título',
      dataIndex: 'title',
      render: (t, r) => (
        <div>
          <Text strong style={{ color: '#e6edf3', display: 'block' }}>{t}</Text>
          {r.author_name && (
            <Text style={{ fontSize: 12, color: '#64748b' }}>
              <UserOutlined style={{ marginRight: 4 }} />{r.author_name}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'published',
      width: 110,
      render: (v) => v ? <Tag color="green">Publicado</Tag> : <Tag color="default">Borrador</Tag>,
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      width: 120,
      render: (d) => new Date(d).toLocaleDateString('es-CO'),
    },
    {
      title: 'Acciones',
      width: 140,
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

      <Modal
        title={editing ? 'Editar artículo' : 'Nuevo artículo'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        afterOpenChange={(open) => {
          if (open) {
            if (editing) {
              form.setFieldsValue({
                title:       editing.title,
                content:     editing.content,
                published:   editing.published,
                author_name: editing.author_name || '',
                author_bio:  editing.author_bio  || '',
              });
            } else {
              form.resetFields();
              form.setFieldsValue({ published: true });
            }
          }
        }}
        okText={editing ? 'Guardar cambios' : 'Crear'}
        cancelText="Cancelar"
        confirmLoading={saving}
        width={680}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>

          {/* ── Imagen del artículo ── */}
          <Form.Item label="Imagen principal del artículo">
            <Upload accept="image/*" beforeUpload={makeBeforeUpload(setImageFile, setImagePreview)} showUploadList={false} maxCount={1}>
              <Button icon={<UploadOutlined />}>{imageFile ? 'Cambiar imagen' : 'Subir imagen'}</Button>
            </Upload>
            {imagePreview && (
              <img src={imagePreview} alt="preview" style={{ marginTop: 12, width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
            )}
          </Form.Item>

          {/* ── Título ── */}
          <Form.Item name="title" label="Título" rules={[{ required: true, message: 'Ingresa un título' }]}>
            <Input placeholder="Título del artículo" />
          </Form.Item>

          {/* ── Contenido ── */}
          <Form.Item name="content" label="Contenido del artículo" rules={[{ required: true, message: 'Escribe el contenido' }]}>
            <TextArea rows={7} placeholder="Escribe el contenido completo..." showCount maxLength={10000} />
          </Form.Item>

          <Divider>Información del Autor</Divider>

          {/* ── Foto del autor ── */}
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

          {/* ── Nombre del autor ── */}
          <Form.Item name="author_name" label="Nombre del autor">
            <Input placeholder="Ej: Johan García Blandón" />
          </Form.Item>

          {/* ── Reseña ── */}
          <Form.Item name="author_bio" label="Reseña del autor (máx. 2 líneas)">
            <TextArea
              rows={2}
              placeholder="Ej: 20 años de experiencia en fútbol europeo y análisis táctico."
              maxLength={300}
              showCount
            />
          </Form.Item>

          {/* ── Publicado ── */}
          <Form.Item name="published" label="Estado" valuePropName="checked">
            <Switch checkedChildren="Publicado" unCheckedChildren="Borrador" />
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
};

export default AdminArticlesPage;
