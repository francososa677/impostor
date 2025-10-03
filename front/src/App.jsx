// App.jsx
import React, { useState, useEffect } from "react";
import Nickname from "./components/Nickname.jsx";
import CreateRoom from "./components/CreateRoom.jsx";
import JoinRoom from "./components/JoinRoom.jsx";
import Lobby from "./components/Lobby.jsx";
import Game from "./components/Game.jsx";

function App() {
  const [nickname, setNickname] = useState("");
  const [step, setStep] = useState("nickname"); // nickname -> menu -> createRoom -> joinRoom -> lobby -> game
  const [roomData, setRoomData] = useState(null);

  // Esto refresca la sala automáticamente para detectar cuando la partida comienza
  useEffect(() => {
    if (step === "lobby" && roomData) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:5000/rooms/${roomData.roomName}`);
          const data = await res.json();
          setRoomData(data);

          if (data.started) {
            setStep("game"); // 🔹 cuando la partida empieza, pasamos al game
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step, roomData]);

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-gray-100">
      {step === "nickname" && (
        <Nickname
          setNickname={(nick) => {
            setNickname(nick);
            setStep("menu");
          }}
        />
      )}
      {step === "menu" && (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            ¡Hola, {nickname}! Bienvenido al juego.
          </h2>
          <button
            onClick={() => setStep("createRoom")}
            className="bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition"
          >
            Crear Sala
          </button>
          <button
            onClick={() => setStep("joinRoom")}
            className="bg-green-500 text-white p-3 rounded hover:bg-green-600 transition"
          >
            Unirse a Sala
          </button>
          <button
            onClick={() => setStep("nickname")}
            className="bg-gray-400 text-white p-3 rounded hover:bg-gray-500 transition"
          >
            Volver atrás
          </button>
        </div>
      )}
      {step === "createRoom" && (
        <CreateRoom
          nickname={nickname}
          onCreate={(data) => {
            setRoomData(data);
            setStep("lobby");
          }}
          onCancel={() => setStep("menu")}
        />
      )}
      {step === "joinRoom" && (
        <JoinRoom
          nickname={nickname}
          onJoin={(data) => {
            setRoomData(data);
            setStep("lobby");
          }}
          onCancel={() => setStep("menu")}
        />
      )}
      {step === "lobby" && roomData && (
        <Lobby
          roomName={roomData.roomName}
          nickname={nickname}
          onStart={() => setStep("game")}
        />
      )}
      {step === "game" && roomData && (
        <Game roomName={roomData.roomName} nickname={nickname} />
      )}
    </div>
  );
}

export default App;
