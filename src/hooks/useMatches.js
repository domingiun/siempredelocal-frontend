// frontend/src/hooks/useMatches.js
import { useState, useCallback } from 'react';
import competitionService from '../services/competitionService';

export const useMatches = (initialParams = {}) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchMatches = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await competitionService.getMatches({
        ...params,
        page: params.page || pagination.current,
        page_size: params.page_size || pagination.pageSize,
      });
      
      setMatches(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || response.data?.length || 0,
      }));
    } catch (err) {
      setError(err);
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  const updateMatch = useCallback(async (id, data) => {
    try {
      const response = await competitionService.updateMatch(id, data);
      // Actualizar en la lista local
      setMatches(prev => prev.map(match => 
        match.id === id ? { ...match, ...response.data } : match
      ));
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteMatch = useCallback(async (id) => {
    try {
      await competitionService.deleteMatch(id);
      // Remover de la lista local
      setMatches(prev => prev.filter(match => match.id !== id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    matches,
    loading,
    error,
    pagination,
    setPagination,
    fetchMatches,
    updateMatch,
    deleteMatch,
  };
};
