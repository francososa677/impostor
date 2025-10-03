import { useEffect, useState } from "react";

export default function Lobby({ roomName, nickname, onStart }) {
  const [room, setRoom] = useState(null);

  const fetchRoom = async () => {
    try {
      const res = await fetch(`http://localhost:5000/rooms/${roomName}`);
      if (!res.ok) {
        setRoom({ error: true, message: "Sala no encontrada o error de backend" });
        return;
      }
      const data = await res.json();
      setRoom(data);

      // Si la partida ya empezó, avisamos al App.jsx
      if (data.started && onStart) {
        onStart();
      }
    } catch (err) {
      setRoom({ error: true, message: "No se pudo conectar con el backend" });
      console.error(err);
    }
  };

  const startGame = async () => {
    try {
      const res = await fetch(`http://localhost:5000/rooms/${roomName}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      const data = await res.json();
      if (data.message && onStart) {
        onStart(); // avisamos al App.jsx que inicie la partida
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!room) return <p>Cargando sala...</p>;
  if (room.error) return <div className="text-red-600 text-center p-8 font-bold">{room.message}</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-4">Sala: {room.roomName}</h2>
      <p className="mb-4">Host: {room.host}</p>
      <ul className="mb-6 bg-white p-4 rounded shadow w-full max-w-sm">
        {room.players && room.players.map((player, i) => (
          <li
            key={i}
            className={`p-2 border-b last:border-0 ${
              player === room.host ? "font-bold text-blue-600" : ""
            }`}
          >
            {player}
          </li>
        ))}
      </ul>
      {nickname === room.host && !room.started && (
        <button
          onClick={startGame}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600"
        >
          Iniciar partida
        </button>
      )}
      {room.started && (
        <p className="text-red-500 font-bold mt-4">La partida ya ha comenzado</p>
      )}
    </div>
  );
}
