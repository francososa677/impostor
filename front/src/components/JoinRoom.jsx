import { useState } from "react";

export default function JoinRoom({ nickname, onJoin, onCancel }) {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, nickname, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.roomName || !data.players || !data.players.includes(nickname)) {
        throw new Error(data.error || "No se pudo unir a la sala. Verifica el nombre y tu usuario.");
      }
      onJoin(data);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
        Unirse a una Sala
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
        <input
          type="text"
          placeholder="Nombre de la sala"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Contraseña (opcional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-green-500 text-white p-3 rounded hover:bg-green-600 transition"
        >
          Unirse
        </button>
        <button
          type="button"
          className="bg-gray-400 text-white p-3 rounded hover:bg-gray-500 transition"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </form>
  {message && <p className="mt-4 text-center text-red-600">{message}</p>}
    </div>
  );
}
