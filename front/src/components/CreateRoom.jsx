import { useState } from "react";

export default function CreateRoom({ nickname, onCreate, onCancel }) {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [impostors, setImpostors] = useState(1);
  const [turnTime, setTurnTime] = useState(30);
  const [mode, setMode] = useState("online");
  const [gameType, setGameType] = useState("players");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roomName.trim()) {
      alert("El nombre de la sala es obligatorio");
      return;
    }

    // Creamos objeto de la sala
    const roomData = {
      roomName: roomName.trim(),
      password: password.trim() || null,
      maxPlayers,
      impostors,
      turnTime,
      mode,
      gameType,
      host: nickname
    };

    try {
      const res = await fetch("http://localhost:5000/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(roomData)
      });
      const data = await res.json();
      if (!res.ok || !data.roomName || !data.players || !data.players.includes(nickname)) {
        throw new Error(data.error || "No se pudo crear la sala. Verifica el nombre y tu usuario.");
      }
      onCreate(data); // Pasamos la respuesta del backend al padre
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Crear Sala
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Nombre de la sala"
            className="p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña (opcional)"
            className="p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
          <div className="flex gap-2">
            <div className="flex flex-col w-1/2">
              <label className="mb-1">Máx. jugadores</label>
              <input
                type="number"
                value={maxPlayers}
                min={2}
                max={10}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col w-1/2">
              <label className="mb-1">Impostores</label>
              <input
                type="number"
                value={impostors}
                min={1}
                max={2}
                onChange={(e) => setImpostors(Number(e.target.value))}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {mode === "online" && (
            <div className="flex flex-col">
              <label className="mb-1">Segundos por turno</label>
              <input
                type="number"
                value={turnTime}
                min={10}
                max={120}
                onChange={(e) => setTurnTime(Number(e.target.value))}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex flex-col w-1/2">
              <label className="mb-1">Modalidad</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="online">Online</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>
            <div className="flex flex-col w-1/2">
              <label className="mb-1">Tipo de juego</label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="players">Jugadores</option>
                <option value="teams">Equipos de fútbol</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="bg-green-500 text-white p-3 rounded text-lg hover:bg-green-600 transition mt-4"
          >
            Crear Sala
          </button>
          <button
            type="button"
            className="bg-gray-400 text-white p-3 rounded text-lg hover:bg-gray-500 transition mt-2"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
