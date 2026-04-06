// frontend/src/components/common/ErrorBoundary.jsx
// A6: Reescrito como class component con componentDidCatch.
// El anterior usaba window.addEventListener('error') que NO captura
// errores en el árbol de renderizado de React.
import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Actualiza el estado para mostrar la UI de error en el siguiente render
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // M5: No logueamos al console en producción — solo enviamos a un servicio de monitoring
    // En desarrollo, lo mostramos para facilitar debug
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary capturó un error:', error, errorInfo);
    }
    // TODO: integrar con Sentry u otro servicio de monitoring:
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="500"
          title="Algo salió mal"
          subTitle="Ocurrió un error inesperado. Por favor intenta nuevamente."
          extra={
            <Button type="primary" onClick={this.handleReset}>
              Volver al inicio
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
