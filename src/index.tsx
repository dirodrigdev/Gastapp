import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// CORRECCIÓN: Eliminamos la importación de index.css para evitar fallos
// import './index.css'; 

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Error crítico: No se encontró el elemento 'root' en el HTML.");
}
