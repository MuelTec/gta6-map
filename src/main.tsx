import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const el = document.getElementById('root');
if (!el) throw new Error('#root não encontrado');

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA: registra o service worker só no build de produção (evita cache
// interferindo no HMR em desenvolvimento).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((e: unknown) => {
      console.warn('Falha ao registrar o service worker:', e);
    });
  });
}
