// frontend/src/context/CompetitionContext.jsx
import React, { createContext, useState, useContext } from 'react';
import competitionService from '../services/competitionService';

const CompetitionContext = createContext();

export const useCompetition = () => useContext(CompetitionContext);

export const CompetitionProvider = ({ children }) => {
  const [competitions, setCompetitions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const response = await competitionService.getCompetitions();
      setCompetitions(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching competitions:', err);
      setError('Error al cargar competencias');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async (params = {}) => {
    setLoading(true);
    try {
      const response = await competitionService.getMatches(params);
      setMatches(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Error al cargar partidos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async (params = {}) => {
    setLoading(true);
    try {
      const response = await competitionService.getTeams(params);
      setTeams(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  const createNewMatch = async (matchData) => {
    setLoading(true);
    try {
      const response = await competitionService.createMatch(matchData);
      setMatches(prev => [response.data, ...prev]);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating match:', err);
      const errorMsg = err.response?.data?.detail || 'Error al crear partido';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateMatchResult = async (matchId, result) => {
    setLoading(true);
    try {
      const response = await competitionService.updateMatch(matchId, result);
      setMatches(prev => 
        prev.map(match => 
          match.id === matchId ? response.data : match
        )
      );
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating match:', err);
      const errorMsg = err.response?.data?.detail || 'Error al actualizar resultado';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    competitions,
    matches,
    teams,
    selectedCompetition,
    loading,
    error,
    fetchCompetitions,
    fetchMatches,
    fetchTeams,
    createNewMatch,
    updateMatchResult,
    setSelectedCompetition,
    setError,
  };

  return (
    <CompetitionContext.Provider value={value}>
      {children}
    </CompetitionContext.Provider>
  );
};
