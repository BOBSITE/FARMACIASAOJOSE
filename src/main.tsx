import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - considera os dados "frescos" por mais tempo
      gcTime: 1000 * 60 * 30,    // 30 minutos - mantém no cache por mais tempo
      refetchOnWindowFocus: false, // NÃO recarrega toda vez que você volta para a aba (MUITO IMPORTANTE para economizar cota)
      refetchOnReconnect: true,
      retry: 1, // Reduz o número de tentativas em caso de erro de cota
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <App />
      </Router>
    </QueryClientProvider>
  </StrictMode>,
);
