import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/shared/design/fonts.css';
import '@/shared/design/tokens.css';
import '@/shared/design/global.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
