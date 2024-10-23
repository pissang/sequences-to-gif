import { createRoot } from 'react-dom/client';
import App from './App';

import './global.css';

const loading = document.getElementById('loading');
if (loading) {
  loading.remove();
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
