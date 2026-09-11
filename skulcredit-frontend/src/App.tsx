import React from 'react';
import AppRouter from './routes/AppRouter';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => (
  <AuthProvider>
    <div className="app-container">
      <AppRouter />
    </div>
  </AuthProvider>
);

export default App;
