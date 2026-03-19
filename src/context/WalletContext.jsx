// frontend/src/context/WalletContext.jsx 
import React, { createContext, useState, useContext, useEffect } from 'react';
import { message } from 'antd';
import { useAuth } from './AuthContext';
import betService from '../services/betService';

  const WalletContext = createContext();
  
  export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet debe usarse dentro de WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState({
    credits: 0,
    balance_PTS: 0,
    total_earned: 0,
    total_spent: 0,
    bets_placed: 0,
    bets_won: 0
  });
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.id) {
      fetchWalletData();
    } else {
      // Resetear si no hay usuario
      setWallet({
        credits: 0,
        balance_PTS: 0,
        total_earned: 0,
        total_spent: 0,
        bets_placed: 0,
        bets_won: 0
      });
      setTransactions([]);
    }
  }, [user]);

  // Transformar transacción del backend para el frontend
  const transformTransaction = (backendTx) => {
    const type = backendTx.transaction_type ? backendTx.transaction_type.toUpperCase() : '';
    let description = backendTx.description || '';

    // Preferir los campos ya calculados por backend
    let amount = Number(backendTx.amount);
    if (Number.isNaN(amount)) {
      amount = Number(backendTx.net_amount_cop ?? backendTx.amount_cop ?? 0);
    }

    let credits_affected = Number(backendTx.credits_affected);
    if (Number.isNaN(credits_affected)) {
      credits_affected = Number(backendTx.amount_credits ?? 0);
    }

    // Mensajes por tipo si no vienen
    switch (type) {
      case 'CREDIT_PURCHASE':
        description = description || `Recarga de ${Math.abs(credits_affected)} créditos`;
        break;
      case 'BET_PLACEMENT':
        description = description || 'Pronósticos realizados';
        break;
      case 'PRIZE_WIN':
        description = description || 'Premio ganado';
        break;
      case 'CREDIT_CONVERSION':
        description = description || `Conversión de ${Math.abs(credits_affected)} créditos`;
        break;
      default:
        break;
    }

    return {
      id: backendTx.id,
      transaction_type: type || backendTx.transaction_type,
      status: backendTx.status,
      created_at: backendTx.created_at,
      description,
      amount,
      currency: 'PTS',
      credits_affected,
      _original: backendTx
    };
  };

  const fetchWalletData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Obtener saldo de la mi cajon
      const walletRes = await betService.getWalletBalance(user.id);
      console.log('📊 Wallet response:', walletRes.data);
      
      if (walletRes.data) {
        setWallet(prev => ({
          ...prev,
          credits: walletRes.data.credits || 0,
          balance_PTS: walletRes.data.balance_PTS || 0
        }));
      }
      
      // Obtener historial de transacciones
      const transactionsRes = await betService.getTransactionHistory(user.id, { limit: 50 });
      console.log('📋 Transactions response:', transactionsRes.data);
      
      if (transactionsRes.data?.transactions) {
        // Transformar transacciones para el frontend
        const transformedTransactions = transactionsRes.data.transactions.map(transformTransaction);
        setTransactions(transformedTransactions);
        
        // Actualizar totales desde el backend si vienen
        if (transactionsRes.data.total_earned || transactionsRes.data.total_spent) {
          setWallet(prev => ({
            ...prev,
            total_earned: transactionsRes.data.total_earned || prev.total_earned,
            total_spent: transactionsRes.data.total_spent || prev.total_spent
          }));
        }
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos de mi Cajon:', error);
      if (error.response?.status !== 404) { // No mostrar error si es 404 (sin datos)
        message.error('Error al cargar datos de mio cajon');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshWallet = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
    message.success('Datos actualizados');
  };

  const getErrorMessage = (error, fallback) => {
    const detail = error?.response?.data?.detail;
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    if (typeof detail === 'object') {
      return detail.error || detail.details || JSON.stringify(detail);
    }
    return String(detail);
  };

  const purchaseCredits = async (planId, paymentMethod = 'credit_card', reference = null) => {
    try {
      const response = await betService.purchaseCredits(user.id, planId, paymentMethod, reference);
      console.log('💰 Purchase response:', response.data);
      
      if (response.data?.success) {
        // Transacción queda pendiente de aprobación del admin
        const newTransaction = {
          id: response.data.transaction_id,
          transaction_type: 'CREDIT_PURCHASE',
          status: 'pending',
          created_at: response.data.timestamp || new Date().toISOString(),
          description: `Solicitud de recarga de ${response.data.credits_added} créditos`,
          amount: -response.data.total_paid,
          currency: 'PTS',
          credits_affected: 0
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        
        message.info('Solicitud registrada. Pendiente de aprobación.');
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('❌ Error recargando créditos:', error);
      message.error(getErrorMessage(error, 'Error al recargar créditos'));
      return { success: false, error };
    }
  };

  const convertToCash = async (creditsToConvert, conversionRate = 4500) => {
    try {
      const response = await betService.convertToCash(user.id, creditsToConvert, conversionRate);
      console.log('💸 Convert response:', response.data);
      
      if (response.data?.success) {
        // Actualizar saldo localmente
        setWallet(prev => ({
          ...prev,
          credits: prev.credits - response.data.credits_converted,
          balance_PTS: prev.balance_PTS + response.data.amount_received
        }));
        
        // Transformar y agregar transacción al historial
        const newTransaction = {
          id: response.data.transaction_id,
          transaction_type: 'CREDIT_CONVERSION',
          status: 'completed',
          created_at: response.data.timestamp || new Date().toISOString(),
          description: `Conversión de ${response.data.credits_converted} créditos`,
          amount: response.data.amount_received,
          currency: 'PTS',
          credits_affected: -response.data.credits_converted
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        
        message.success(`Conversión exitosa! +$${response.data.amount_received.toLocaleString()} PTS`);
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('❌ Error convirtiendo a Puntos:', error);
      message.error(getErrorMessage(error, 'Error al convertir a Puntos'));
      return { success: false, error };
    }
  };

  const requestPointsToCredits = async (pointsToConvert, creditValue = 5000) => {
    try {
      const response = await betService.requestPointsToCredits(user.id, pointsToConvert, creditValue);
      if (response.data?.success) {
        message.info('Solicitud enviada. Pendiente de aprobación.');
      }
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error solicitando canje de puntos:', error);
      message.error(getErrorMessage(error, 'Error al solicitar canje de puntos'));
      return { success: false, error };
    }
  };

  const requestWithdrawPoints = async (amountPts, paymentMethod = 'nequi') => {
    try {
      const response = await betService.requestWithdrawPoints(user.id, amountPts, paymentMethod);
      if (response.data?.success) {
        message.info('Solicitud de retiro enviada. Pendiente de aprobación.');
      }
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error solicitando retiro:', error);
      message.error(getErrorMessage(error, 'Error al solicitar retiro'));
      return { success: false, error };
    }
  };

  const placeBet = async (betDateId, predictions) => {
    try {
      const response = await betService.placeBet(user.id, betDateId, predictions);
      console.log('🎯 Place bet response:', response.data);
      
      if (response.data?.success) {
        // Actualizar créditos (restar 1)
        setWallet(prev => ({
          ...prev,
          credits: prev.credits - 1,
          bets_placed: prev.bets_placed + 1
        }));
        
        // Transformar y agregar transacción al historial
        const newTransaction = {
          id: response.data.bet_id,
          transaction_type: 'BET_PLACEMENT',
          status: 'completed',
          created_at: new Date().toISOString(),
          description: `Pronósticos en la fecha ${betDateId}`,
          amount: -5000, // $5,000 PTS por pronósticos
          currency: 'PTS',
          credits_affected: -1
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        
        message.success('¡Pronósticos realizados con éxito!');
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('❌ Error al realizar pronósticos:', error);
      message.error(getErrorMessage(error, 'Error al realizar pronósticos'));
      return { success: false, error };
    }
  };

  const updateWalletOnPrize = (amount, betId) => {
    setWallet(prev => ({
      ...prev,
      balance_PTS: prev.balance_PTS + amount,
      total_earned: prev.total_earned + amount,
      bets_won: prev.bets_won + 1
    }));
    
    // Agregar transacción de premio
    const newTransaction = {
      id: Date.now(), // ID temporal
      transaction_type: 'PRIZE_WIN',
      status: 'completed',
      created_at: new Date().toISOString(),
      description: `Premio ganado${betId ? ` por apuesta ${betId}` : ''}`,
      amount: amount,
      currency: 'PTS',
      credits_affected: 0
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    message.success(`¡Felicidades! Ganaste $${amount.toLocaleString()} PTS`);
  };

  const hasEnoughCredits = (required = 1) => {
    return wallet.credits >= required;
  };

  // Función para forzar actualización de datos
  const forceRefresh = async () => {
    await fetchWalletData();
  };

  // Valor del contexto
  const contextValue = {
    wallet,
    transactions,
    loading,
    refreshing,
    refreshWallet,
    purchaseCredits,
    convertToCash,
    requestPointsToCredits,
    requestWithdrawPoints,
    placeBet,
    updateWalletOnPrize,
    hasEnoughCredits,
    fetchWalletData: forceRefresh,
    // Métodos adicionales útiles
    getTransactionStats: () => {
      const stats = {
        totalTransactions: transactions.length,
        totalSpent: Math.abs(transactions
          .filter(tx => tx.amount < 0)
          .reduce((sum, tx) => sum + tx.amount, 0)),
        totalEarned: transactions
          .filter(tx => tx.amount > 0)
          .reduce((sum, tx) => sum + tx.amount, 0),
        netBalance: transactions
          .reduce((sum, tx) => sum + tx.amount, 0)
      };
      return stats;
    }
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

