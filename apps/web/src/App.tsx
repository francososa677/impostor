import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GameProvider } from "./context/GameContext.js";
import { Navbar } from "./components/Navbar.js";
import { ToastContainer } from "./components/ToastContainer.js";
import { HomePage } from "./pages/HomePage.js";
import { CreateRoomPage } from "./pages/CreateRoomPage.js";
import { LobbyPage } from "./pages/LobbyPage.js";
import { JoinPage } from "./pages/JoinPage.js";
import { RoomPage } from "./pages/RoomPage.js";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <GameProvider>
        <div className="min-h-screen flex flex-col bg-dark-950 text-zinc-100">
          <Navbar />
          <ToastContainer />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateRoomPage />} />
              <Route path="/lobby" element={<LobbyPage />} />
              <Route path="/join/:code" element={<JoinPage />} />
              <Route path="/room/:code" element={<RoomPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </GameProvider>
    </BrowserRouter>
  );
};
export default App;
