// frontend/src/services/userService.js
import api from './api';

const userService = {
  // Obtener todos los usuarios
  getAllUsers: (params = {}) => {
    return api.get('/users/', { params });
  },
  
  // Obtener usuario por ID
  getUserById: (userId) => {
    return api.get(`/users/${userId}`);
  },
  
  // Crear usuario
  createUser: (userData) => {
    return api.post('/auth/register', userData);
  },
  
  // Actualizar usuario
  updateUser: (userId, userData) => {
    return api.put(`/users/${userId}`, userData);
  },
  
  // Desactivar usuario (soft delete)
  deleteUser: (userId) => {
    return api.delete(`/users/${userId}`);
  },
  
  // Activar usuario
  activateUser: (userId) => {
    return api.patch(`/users/${userId}/activate`);
  },
  
  // Cambiar rol de usuario
  updateUserRole: (userId, role) => {
    return api.put(`/users/${userId}/role`, { role });
  },
  
  // Cambiar contraseña
  changePassword: (userId, passwordData) => {
    return api.post(`/users/${userId}/change-password`, passwordData);
  },
  
  // Obtener estadísticas de usuarios
  getUserStats: () => {
    return api.get('/users/stats');
  },
  
  // Buscar usuarios
  searchUsers: (query) => {
    return api.get('/users/search', { params: query });
  },
  
  // Actualización masiva de usuarios
  bulkUpdateUsers: (userIds, updateData) => {
    return api.post('/users/bulk-update', { user_ids: userIds, ...updateData });
  }
};

export default userService;
