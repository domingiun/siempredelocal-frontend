// frontend/src/components/matches/MatchActions.jsx
import React, { useState } from 'react';
import { Dropdown, Menu, Button, Space, Modal, message } from 'antd';
import { 
  MoreOutlined, EditOutlined, DeleteOutlined, 
  EyeOutlined, CopyOutlined, CalendarOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const MatchActions = ({ matchId, onDelete, onEdit, showView = true, showDropdown = true }) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Modal.confirm({
      title: '¿Eliminar partido?',
      content: 'Esta acción no se puede deshacer. ¿Está seguro?',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        setDeleting(true);
        try {
          if (onDelete) {
            await onDelete(matchId);
          }
          message.success('Partido eliminado');
        } catch (error) {
          message.error('Error al eliminar partido');
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  const menu = (
    <Menu>
      {showView && (
        <Menu.Item 
          key="view" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/matches/${matchId}`)}
        >
          Ver Detalles
        </Menu.Item>
      )}
      
      <Menu.Item 
        key="edit" 
        icon={<EditOutlined />}
        onClick={() => {
          if (onEdit) {
            onEdit(matchId);
          } else {
            navigate(`/matches/edit/${matchId}`);
          }
        }}
      >
        Editar
      </Menu.Item>
      
      <Menu.Item 
        key="duplicate" 
        icon={<CopyOutlined />}
        onClick={() => navigate(`/matches/new?duplicate=${matchId}`)}
      >
        Duplicar
      </Menu.Item>
      
      <Menu.Divider />
      
      <Menu.Item 
        key="delete" 
        icon={<DeleteOutlined />}
        onClick={handleDelete}
        danger
      >
        Eliminar
      </Menu.Item>
    </Menu>
  );

  if (showDropdown) {
    return (
      <Dropdown overlay={menu} trigger={['click']}>
        <Button 
          type="text" 
          icon={<MoreOutlined />} 
          loading={deleting}
        />
      </Dropdown>
    );
  }

  // Versión horizontal (para tarjetas pequeñas)
  return (
    <Space>
      {showView && (
        <Button 
          type="text" 
          icon={<EyeOutlined />} 
          size="small"
          onClick={() => navigate(`/matches/${matchId}`)}
        />
      )}
      <Button 
        type="text" 
        icon={<EditOutlined />} 
        size="small"
        onClick={() => navigate(`/matches/edit/${matchId}`)}
      />
      <Button 
        type="text" 
        icon={<DeleteOutlined />} 
        size="small"
        danger
        onClick={handleDelete}
        loading={deleting}
      />
    </Space>
  );
};

export default MatchActions;
