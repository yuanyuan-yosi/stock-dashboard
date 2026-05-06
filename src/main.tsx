import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Clear old data on version change (before Zustand hydrates)
const APP_VERSION = 'v6';
const storedVersion = localStorage.getItem('app-version');
if (storedVersion !== APP_VERSION) {
  localStorage.removeItem('stock-portfolio');
  localStorage.removeItem('stock-portfolio-seeded');
  localStorage.removeItem('stock-portfolio-seeded-v2');
  localStorage.removeItem('stock-portfolio-seeded-v3');
  localStorage.removeItem('stock-portfolio-seeded-v4');
  localStorage.removeItem('stock-portfolio-seeded-v5');
  localStorage.setItem('app-version', APP_VERSION);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
