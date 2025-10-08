// components/Game.jsx
import Voting from "./Voting.jsx";
import { useEffect, useState } from "react";

export default function Game({ roomName, nickname }) {
  // Nuevo handler: llama al backend para avanzar turno y marcar listo
  const handleReady = async () => {
    try {
      const res = await fetch(`http://localhost:5000/rooms/${roomName}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      if (!res.ok) throw new Error("Error al avanzar turno");
      const data = await res.json();
      setRoom(data);
    } catch (err) {
      console.error(err);
    }
  };
  const [room, setRoom] = useState(null);
  // Las palabras ahora vienen del backend
  const [timer, setTimer] = useState(null);

  const fetchRoom = async () => {
    try {
      const res = await fetch(`http://localhost:5000/rooms/${roomName}`);
      // Si la respuesta no es OK, no actualizar room
      if (!res.ok) {
        setRoom({ error: true, message: "Sala no encontrada o error de backend" });
        return;
      }
      const data = await res.json();
      setRoom(data);
    } catch (err) {
      setRoom({ error: true, message: "No se pudo conectar con el backend" });
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 1000);
    return () => clearInterval(interval);
  }, []);

  // Actualiza el temporizador visual cada segundo
  useEffect(() => {
    if (!room || !room.started || room.mode !== "online") return;
    // No timer for eliminated players
    if (room.words && room.words[room.turnOrder[room.turnIndex]] && room.words[room.turnOrder[room.turnIndex]].includes("ELIMINADO")) {
      setTimer(null);
      return;
    }
    let seconds = room.turnTime;
    setTimer(seconds);
    let timeout = setInterval(() => {
      seconds--;
      setTimer(seconds);
      if (seconds <= 0) clearInterval(timeout);
    }, 1000);
    return () => clearInterval(timeout);
  }, [room]);

  if (!room) return <p>Cargando partida...</p>;
  if (room.error) return <div className="text-red-600 text-center p-8 font-bold">{room.message}</div>;
  if (room.gameOver) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
        <h2 className="text-2xl font-bold mb-4">Partida finalizada</h2>
        {room.impostorWin ? (
          <div className="text-red-600 text-xl font-bold">¡Ganaron los impostores!</div>
        ) : (
          <div className="text-green-600 text-xl font-bold">¡Ganaron los jugadores!</div>
        )}
      </div>
    );
  }

  const role = room.roles ? room.roles[nickname] : null;
  const assigned = room.assigned ? room.assigned[nickname] : null;

  // Handler para enviar palabra al backend
  const handleWord = async (e) => {
    e.preventDefault();
    const word = e.target.word.value;
    try {
      await fetch(`http://localhost:5000/rooms/${roomName}/word`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, word }),
      });
      fetchRoom(); // refresca palabras
    } catch (err) {
      console.error(err);
    }
    e.target.reset();
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-4">Partida: {room.roomName}</h2>
      <p className="mb-4">Tu rol: <span className="font-bold">{role}</span></p>
      {role !== "impostor" && assigned && (
        <p className="mb-4">Tu jugador/equipo asignado: <span className="font-bold">{assigned.name}</span></p>
      )}
      {role === "impostor" && (
        <p className="mb-4 text-red-600 font-bold">¡Sos impostor!</p>
      )}

      {/* Input y timer solo si es online y el jugador no está eliminado */}
      {room.mode === "online" && room.turnOrder[room.turnIndex] === nickname && !(room.words && room.words[nickname] && room.words[nickname].includes("ELIMINADO")) && (
        <>
          <form onSubmit={handleWord} className="mb-6">
            <input type="text" name="word" className="p-2 border rounded mr-2" required />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Enviar</button>
          </form>
          <div className="mb-4 text-lg font-bold text-red-600">
            Tiempo restante: {timer !== null ? timer : room.turnTime} segundos
          </div>
        </>
      )}

      {/* Para modalidad presencial: solo mostrar orden de turnos */}
      {room.mode === "presencial" && (
        <div className="mb-6 text-gray-500">
          Turno actual: <span className="font-bold">{room.turnOrder[room.turnIndex]}</span>
        </div>
      )}

      {room.turnOrder && room.turnOrder[room.turnIndex] !== nickname && (
        <div className="mb-6 text-gray-500">Esperando el turno de <span className="font-bold">{room.turnOrder[room.turnIndex]}</span>...</div>
      )}

      {/* Tablero de palabras / turnos */}
      <div className="flex gap-4 overflow-x-auto">
        {(room.turnOrder || room.players).map(player => (
          <div key={player} className="flex flex-col items-center bg-white p-2 rounded shadow min-w-[100px]">
            <strong>{player}</strong>
            <div className="mt-2 flex flex-col gap-1">
              {room.mode === "presencial" ? (
                room.words && room.words[player] && room.words[player].includes("ELIMINADO") ? (
                  <span className="bg-red-200 p-1 rounded w-full text-center">ELIMINADO</span>
                ) : (
                  (room.readyPlayers && room.readyPlayers[player]) ? (
                    <span className="bg-green-200 p-1 rounded w-full text-center">LISTO</span>
                  ) : (
                    <span className="bg-gray-200 p-1 rounded w-full text-center">—</span>
                  )
                )
              ) : (
                (room.words && room.words[player] ? room.words[player] : []).map((word, idx) => (
                  <span key={idx} className="bg-gray-200 p-1 rounded w-full text-center">{word}</span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botón Listo para modo presencial, solo si no está listo */}
  {room.mode === "presencial" && room.turnOrder[room.turnIndex] === nickname && !(room.readyPlayers && room.readyPlayers[nickname]) && !(room.words && room.words[nickname] && room.words[nickname].includes("ELIMINADO")) && (
        <button
          onClick={handleReady}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 mt-4"
        >
          Listo
        </button>
      )}

      {/* Mostrar Voting si todos escribieron palabra o están listos */}
      {/* Mostrar Voting solo si todos los jugadores vivos han escrito su palabra o están listos */}
      {/* Mostrar Voting solo si todos los jugadores vivos han escrito su palabra o están listos, y solo si no estamos en la fase de escritura (online) */}
      {room.turnOrder &&
        room.turnOrder
          .filter(p => !(room.words[p]?.includes("ELIMINADO")))
          .every(p => (room.words[p]?.length > 0 || room.readyPlayers?.[p])) &&
        // En online, solo mostrar Voting si no hay ningún turno pendiente de palabra
        ((room.mode === "online" && room.turnIndex >= room.turnOrder.length) || room.mode === "presencial") && (
        <Voting
          room={room}
          nickname={nickname}
          onVote={() => fetchRoom()}
          onTimeEnd={() => {
            fetchRoom();
          }}
        />
      )}
    </div>
  );
}
