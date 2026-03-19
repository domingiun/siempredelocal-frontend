// frontend/src/hooks/usePermissions.js
import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  
  // FUNCIONES GENERALES
  const canEdit = (resourceOwnerId = null) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (resourceOwnerId) {
      return user.id === resourceOwnerId;
    }
    return false;
  };
  
  const canDelete = () => {
    if (!user) return false;
    if (isAdmin) return true;
    return false;
  };
  
  const canDeleteOwn = (resourceOwnerId = null) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (resourceOwnerId) {
      return user.id === resourceOwnerId;
    }
    return false;
  };
  
  
  const canCreate = (resourceType = null) => {
    if (!user) return false;
    
    // Solo admin puede crear ciertos recursos
    if (isAdmin) return true;
    
    // Para usuarios normales, definir qué pueden crear
    switch(resourceType) {
      case 'competition':
      case 'team':
      case 'match':
      case 'round':
        // Solo admin puede crear estas cosas
        return false;
      
      case 'comment':
      case 'prediction':
        // Usuarios normales pueden crear comentarios, predicciones, etc.
        return true;
      
      default:
        // Por defecto, solo admin puede crear
        return false;
    }
  };
  
  // FUNCIONES ESPECÍFICAS
  const canCreateCompetition = () => canCreate('competition');
  const canCreateTeam = () => canCreate('team');
  const canCreateMatch = () => canCreate('match');
  const canCreateRound = () => canCreate('round');
  
  // Funciones específicas por tipo (alias para facilidad)
  const canEditAny = () => isAdmin; // Solo admin puede editar cualquier cosa
  const canDeleteAny = () => isAdmin; // Solo admin puede eliminar cualquier cosa
  
  const canView = () => {
    return !!user; // Cualquier usuario autenticado puede ver
  };
  
  const canManage = () => {
    return isAdmin;
  };
  
  return {
    // Funciones principales
    canEdit,
    canDelete,
    canDeleteOwn,
    canCreate,
    canView,
    canManage,
    
    // Funciones específicas para creación
    canCreateCompetition,
    canCreateTeam,
    canCreateMatch,
    canCreateRound,
    
    // Funciones para permisos generales de admin
    canEditAny,    // ← Asegúrate de que esta función esté aquí
    canDeleteAny,  // ← Asegúrate de que esta función esté aquí
    
    // Información del usuario
    isAdmin,
    isAuthenticated: !!user,
    user
  };
};
