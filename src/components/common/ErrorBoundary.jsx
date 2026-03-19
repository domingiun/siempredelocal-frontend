//frontend/src/components/common/ErrorBoundary.jsx
import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const errorHandler = (error) => {
      console.error('Error capturado:', error);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <Result
        status="500"
        title="500"
        subTitle="Lo sentimos, algo salió mal."
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            Recargar página
          </Button>
        }
      />
    );
  }

  return children;
};

export default ErrorBoundary;
