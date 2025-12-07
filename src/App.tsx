import React from 'react';

const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Test GastApp</h1>
        <p style={{ fontSize: 14, opacity: 0.7 }}>
          Si ves este texto, React está montando bien.
        </p>
      </div>
    </div>
  );
};

export default App;
