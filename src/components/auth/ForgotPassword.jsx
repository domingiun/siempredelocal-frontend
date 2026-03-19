// frontend/src/components/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import logo from '../../assets/logo.png';

const ForgotPassword = () => {
  const [channel, setChannel] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const payload = channel === 'email'
        ? { channel, email }
        : { channel, phone };

      const response = await authAPI.forgotPassword(payload);
      setMessage(response.data?.message || 'Si la cuenta existe, recibiras instrucciones para restablecer tu contrasena.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <img
        src={logo}
        alt="Watermark top left"
        style={{
          position: 'absolute',
          width: '56vw',
          maxWidth: 820,
          minWidth: 360,
          opacity: 0.07,
          left: '-10vw',
          top: '-12vh',
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'grayscale(100%)',
        }}
      />
      <img
        src={logo}
        alt="Watermark bottom right"
        style={{
          position: 'absolute',
          width: '62vw',
          maxWidth: 900,
          minWidth: 420,
          opacity: 0.08,
          right: '-8vw',
          bottom: '-10vh',
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'grayscale(100%)',
        }}
      />
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <img
              src={logo}
              alt="Siempre de Local"
              style={{ width: 184, height: 184, objectFit: 'contain' }}
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Recuperar contrasena
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Elige el medio
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="email">Correo electronico</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            {channel === 'email' ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electronico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Celular
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="ej: +57 300 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Volver a iniciar sesion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
