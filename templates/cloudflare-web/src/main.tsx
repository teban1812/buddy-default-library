import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('The page has no #root element to start the application in.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
