import React from "react";
import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";

const App: React.FC = () => (
  <AuthProvider>
    <SocketProvider>
      <NotificationProvider>
        <div className="app-container">
          <AppRouter />
        </div>
      </NotificationProvider>
    </SocketProvider>
  </AuthProvider>
);

export default App;
